import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { imageUrl } = await req.json() as { imageUrl: string };
        if (!imageUrl) {
            return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
        }

        // 1. Download the generated image from the AI service URL
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error("Failed to fetch generated image");
        const buffer = Buffer.from(await imgRes.arrayBuffer());

        // 2. Upload to Supabase Storage bucket 'avatars'
        const fileName = `${user.id}/ai-avatar-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, buffer, {
                contentType: "image/png",
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // 3. Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

        // 4. Update user's avatar_url in the users table
        const { error: updateError } = await supabase
            .from("users")
            .update({ avatar_url: publicUrl })
            .eq("id", user.id);

        if (updateError) {
            console.warn("[Avatar Save] Could not update users table:", updateError.message);
            // Not a fatal error — still return the URL
        }

        console.log(`[Avatar Save] Saved for user ${user.id}: ${publicUrl}`);
        return NextResponse.json({ avatarUrl: publicUrl });

    } catch (error: any) {
        console.error("[Avatar Save] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
