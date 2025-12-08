require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkFiles() {
  console.log('Checking uploaded files...\n');
  
  const buckets = ['bible-audio', 'worship-audio', 'sermons', 'images', 'documents', 'videos'];
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
      
      if (error) {
        console.log(`❌ ${bucket}: Error - ${error.message}`);
      } else {
        const folders = data?.filter(item => !item.name.includes('.')) || [];
        let totalFiles = data?.filter(item => item.name.includes('.'))?.length || 0;
        
        // Check subfolders
        for (const folder of folders) {
          const { data: subData } = await supabase.storage.from(bucket).list(folder.name, { limit: 2000 });
          totalFiles += subData?.length || 0;
        }
        
        console.log(`✅ ${bucket}: ${totalFiles} files (${folders.length} folders)`);
      }
    } catch (e) {
      console.log(`❌ ${bucket}: ${e.message}`);
    }
  }
}

checkFiles();
