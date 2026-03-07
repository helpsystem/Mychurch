require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addAiAvatarWidget() {
    console.log("Adding w_ai_avatar widget...");

    const { error } = await supabase
        .from('widgets')
        .upsert([{
            id: 'w_ai_avatar',
            name: 'AI Christian Avatar Generator',
            description: 'Allow users to generate AI-powered Christian profile pictures from their photos.',
            is_active: true,
            icon: 'Sparkles',
            color: 'text-indigo-500'
        }], { onConflict: 'id' });

    if (error) {
        console.error("Error adding widget:", error.message);
    } else {
        console.log("✅ Successfully added w_ai_avatar widget!");
    }
}

addAiAvatarWidget();
