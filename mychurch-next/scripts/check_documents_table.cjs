const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('document_history')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error selecting document_history:', error.message);
  } else {
    console.log('document_history sample / fields:', data ? (data[0] ? Object.keys(data[0]) : 'empty table') : 'null');
  }
}

main();
