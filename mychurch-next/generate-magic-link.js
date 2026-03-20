const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: 'help.system@ymail.com',
        options: {
            redirectTo: 'https://samanabyar.online/admin/widgets'
        }
    });

    if (error) {
        console.error("Error:", error.message);
    } else {
        fs.writeFileSync('magic.json', JSON.stringify({ link: data.properties.action_link }, null, 2));
    }
}
run();
