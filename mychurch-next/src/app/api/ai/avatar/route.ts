import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Replicate from "replicate";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const gender = (formData.get("gender") as string) || "male";

        if (!file) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // Authentication Check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json({ error: "Replicate API Token is missing." }, { status: 500 });
        }

        // Convert file to base64 data URI for Replicate
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || "image/jpeg";
        const base64 = buffer.toString("base64");
        const dataUri = `data:${mimeType};base64,${base64}`;

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const genderWord = gender === "female" ? "woman" : "man";

        // Use PhotoMaker-Style: face-preserving image generation
        // IMPORTANT: The trigger word "img" must appear in the prompt to activate face injection
        const prompt = `cinematic portrait photo of a ${genderWord} img, wearing modest elegant clothing, standing inside a beautiful Christian church with warm stained glass lighting, peaceful and faithful expression, photorealistic, 8k, professional photography, sharp focus on face`;

        console.log(`[AI Avatar] Running photomaker for gender: ${genderWord}`);

        // Use tencentarc/photomaker-style which preserves facial identity
        const output = await replicate.run(
            "tencentarc/photomaker-style:66f42a9b6890a63a6f33e6197e9aaf7c63def394a29b768c62fc4efd6d32f56e",
            {
                input: {
                    input_image: dataUri,
                    prompt,
                    style_name: "Photographic (Default)",
                    style_strength_ratio: 15,
                    num_outputs: 1,
                    guidance_scale: 5,
                    num_inference_steps: 50,
                }
            }
        ) as string[];

        console.log("[AI Avatar] Photomaker output:", output);

        // Photomaker returns an array of image URLs
        const imageUrl = Array.isArray(output) ? output[0] : output;

        if (!imageUrl) {
            throw new Error("No image URL returned from AI model.");
        }

        return NextResponse.json({ url: imageUrl });

    } catch (error: any) {
        console.error("AI Avatar Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
