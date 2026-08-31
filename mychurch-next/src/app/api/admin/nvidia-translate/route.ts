import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    // ===== Security Check: Admin or Leader Role Required =====
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .ilike('email', user.email || '')
      .maybeSingle();

    if (!userRecord || (userRecord.role !== 'Admin' && userRecord.role !== 'Leader')) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Leader access required" },
        { status: 403 }
      );
    }
    // ===== End Security Check =====

    const body = await req.json().catch(() => ({}));
    const { lines, target } = body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "An array of lines is required." }, { status: 400 });
    }

    if (!target || !['persian', 'english', 'finglish'].includes(target)) {
      return NextResponse.json({ error: "Invalid or missing target language." }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Nvidia API Key is not configured on the server." }, { status: 500 });
    }

    let systemPrompt = `You are a professional translator and structured data processor.
You MUST translate or transliterate the input JSON array of text lines and respond with ONLY a valid, parseable JSON object matching this exact schema:
{
  "translated_lines": ["Line 1 translation", "Line 2 translation"]
}
CRITICAL: Maintain the exact same number of lines and the same line order as the input array.
Do NOT include any markdown code blocks, backticks (\`\`\`json), quotes, or explanations. Respond with the raw JSON string only.`;

    let userPrompt = "";
    if (target === "persian") {
      userPrompt = `Translate each line of this JSON array to fluent, formal Iranian Persian (Farsi): ${JSON.stringify(lines)}`;
    } else if (target === "english") {
      userPrompt = `Translate each line of this JSON array to fluent English: ${JSON.stringify(lines)}`;
    } else if (target === "finglish") {
      userPrompt = `Transliterate each line of this JSON array to Finglish (Persian language written in Latin/English alphabet). If a line is English, translate it to Persian first, then transliterate: ${JSON.stringify(lines)}`;
    }

    console.log(`[NvidiaTranslate] Dispatching GLM-5.1 translation request for target: ${target}`);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[NvidiaTranslate] Nvidia API error (${response.status}):`, errBody);
      return NextResponse.json({ error: `Nvidia API status ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    let responseText = data.choices?.[0]?.message?.content?.trim() || "";

    // Clean JSON markdown packaging if returned
    if (responseText.startsWith("```json")) responseText = responseText.substring(7);
    if (responseText.startsWith("```")) responseText = responseText.substring(3);
    if (responseText.endsWith("```")) responseText = responseText.slice(0, -3);
    responseText = responseText.trim();

    try {
      const parsedData = JSON.parse(responseText);
      if (parsedData.translated_lines && Array.isArray(parsedData.translated_lines)) {
        return NextResponse.json(parsedData);
      } else {
        throw new Error("Invalid schema inside returned JSON.");
      }
    } catch (parseErr) {
      console.error("[NvidiaTranslate] Failed to parse model output:", responseText, parseErr);
      return NextResponse.json({
        error: "Failed to parse structured JSON from Nvidia GLM.",
        raw: responseText
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[NvidiaTranslate] Exception occurred:", error);
    return NextResponse.json({ error: error.message || "Failed to process translation." }, { status: 500 });
  }
}
