// Script to create avatars bucket in Supabase Storage
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setup() {
    console.log("🔧 Setting up Supabase Storage for avatars...\n");

    // 1. Create the avatars bucket (public)
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket("avatars", {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });

    if (bucketError) {
        if (bucketError.message?.includes("already exists")) {
            console.log("✅ Bucket 'avatars' already exists — skipping creation.");
        } else {
            console.error("❌ Failed to create bucket:", bucketError.message);
            process.exit(1);
        }
    } else {
        console.log("✅ Created bucket 'avatars' (public, max 10MB)");
    }

    // 2. List buckets to confirm
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucket = buckets?.find(b => b.name === "avatars");
    if (avatarBucket) {
        console.log(`\n📦 Bucket details:`);
        console.log(`   Name:   ${avatarBucket.name}`);
        console.log(`   Public: ${avatarBucket.public}`);
    }

    // 3. Check/add avatar_url column to users table
    console.log("\n🔧 Checking avatar_url column in users table...");
    const { error: colError } = await supabase
        .from("users")
        .select("avatar_url")
        .limit(1);

    if (colError && colError.message?.includes("column")) {
        console.log("⚠️  avatar_url column missing. Run this SQL in Supabase SQL Editor:");
        console.log("\nALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;");
        console.log("\nUPDATE storage.buckets SET public = true WHERE id = 'avatars';");
    } else {
        console.log("✅ avatar_url column exists in users table");
    }

    console.log("\n🎉 Supabase Storage setup complete!");
    console.log("   Public URL pattern: " + supabaseUrl + "/storage/v1/object/public/avatars/{userId}/ai-avatar-{timestamp}.png");
}

setup().catch(console.error);
