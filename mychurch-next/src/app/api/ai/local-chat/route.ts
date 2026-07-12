import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { dbAll } from "@/lib/bibleDb";

export async function POST(req: Request) {
  try {
    // Publicly accessible route to allow website visitors to query the Bible AI assistant.

    const body = await req.json().catch(() => ({}));
    const { question } = body;

    if (!question || question.trim() === "") {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    // Determine query language (Persian/Arabic script check)
    const isPersian = /[\u0600-\u06FF]/.test(question);

    // Extract search keywords (filter out common short prepositions/stop words)
    const stopWords = new Set([
      "و", "در", "به", "که", "از", "تا", "با", "بر", "برای", "را", "این", "آن", "است", "بود", "شد", "یک",
      "the", "and", "a", "of", "to", "in", "is", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "i"
    ]);
    
    const words = question
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopWords.has(w));

    let relatedVerses: any[] = [];

    if (words.length > 0) {
      // Build fuzzy LIKE statements
      const likeClauses = words.map(() => "v.text LIKE ?").join(" OR ");
      const likeParams = words.map(w => `%${w}%`);

      const query = `
        SELECT v.book_id, v.chapter_num, v.verse_num, v.text, ver.abbr, ver.name as version_name
        FROM verses v
        JOIN versions ver ON v.version_id = ver.version_id
        WHERE ver.is_rtl = ? AND (${likeClauses})
        ORDER BY RANDOM()
        LIMIT 10
      `;

      try {
        relatedVerses = await dbAll(query, [isPersian ? 1 : 0, ...likeParams]);
      } catch (dbErr) {
        console.error("[LocalBibleChat] DB query failed, using empty contexts:", dbErr);
      }
    }

    // Format local Bible context for the AI prompt
    const contextText = relatedVerses.length > 0
      ? relatedVerses.map(v => `[${v.abbr}] ${v.book_id} ${v.chapter_num}:${v.verse_num} — ${v.text}`).join("\n")
      : "No direct Bible verses matched the keywords.";

    const systemPrompt = isPersian
      ? `شما یک دستیار متخصص الهیات مسیحی و پاسخگوی سوالات بر اساس کتاب مقدس هستید.
وظیفه شما این است که بر اساس آیات و متون کتاب مقدس، به سوال کاربر به طور دقیق، محترمانه و آموزنده پاسخ دهید.
اگر در متون کتاب مقدس پیوست شده به این پرامپت اطلاعات کافی برای پاسخ وجود دارد، حتماً از آن متون و آیات استفاده کنید و آدرس آنها را ذکر کنید.
پاسخ شما باید کاملاً مستند و همراه با آدرس دقیق باب و آیه کتاب مقدس باشد.`
      : `You are an expert Christian theologian assistant. Answer the user's questions accurately, respectfully, and instructively based on the Holy Bible.
Use the provided biblical context verses if they are relevant, and cite book, chapter, and verse references.
Always construct a helpful theological answer with clear bible citations.`;

    const userPrompt = isPersian
      ? `آیات مرتبط استخراج شده از دیتابیس کلیسا:\n${contextText}\n\nسوال کاربر:\n${question}\n\nپاسخ جامع الهیاتی شما:`
      : `Related Bible verses from the local database:\n${contextText}\n\nUser Question:\n${question}\n\nYour comprehensive theological answer:`;

    console.log(`[LocalBibleChat] Dispatching request to local Ollama server...`);

    let answer = "";
    let usingFallback = false;

    try {
      const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:7b", // Highly performant local model for Persian/English
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false
        })
      });

      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        answer = data.response || "";
      } else {
        throw new Error(`Ollama returned status ${ollamaResponse.status}`);
      }
    } catch (ollamaErr: any) {
      console.warn("[LocalBibleChat] Ollama local model is offline or failed:", ollamaErr.message || ollamaErr);
      
      // FALLBACK: Use Nvidia GLM-5.1 if local model is offline! This ensures 100% operational uptime!
      const nvidiaKey = process.env.NVIDIA_API_KEY;
      if (nvidiaKey) {
        console.log("[LocalBibleChat] Falling back to Nvidia GLM-5.1 online API...");
        usingFallback = true;
        const nvRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify({
            model: "z-ai/glm-5.1",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 4096
          })
        });

        if (nvRes.ok) {
          const nvData = await nvRes.json();
          answer = nvData.choices?.[0]?.message?.content || "";
        } else {
          console.error("[LocalBibleChat] Nvidia fallback also failed.");
        }
      }
    }

    if (!answer) {
      return NextResponse.json({
        error: "هوش مصنوعی محلی یا ابری در دسترس نیست. لطفاً بررسی کنید سرور Ollama یا اتصال اینترنت برقرار باشد."
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      answer,
      usingFallback,
      verses: relatedVerses
    });

  } catch (error: any) {
    console.error("[LocalBibleChat] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
