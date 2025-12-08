require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkWorshipAudio() {
  console.log('Checking worship-audio bucket in detail...\n');
  
  try {
    // List root
    const { data: root } = await supabase.storage.from('worship-audio').list('', { limit: 1000 });
    console.log('Root items:', root?.length || 0);
    root?.forEach(item => {
      console.log(`  - ${item.name} ${item.metadata ? `(${(item.metadata.size / 1024 / 1024).toFixed(2)} MB)` : '(folder)'}`);
    });
    
    // List audio folder
    console.log('\nChecking audio/ folder...');
    const { data: audioRoot } = await supabase.storage.from('worship-audio').list('audio', { limit: 1000 });
    console.log('Audio root items:', audioRoot?.length || 0);
    
    let totalFiles = 0;
    
    // List all subfolders in audio/
    for (const item of audioRoot || []) {
      if (!item.name.includes('.')) {
        const { data: subItems } = await supabase.storage.from('worship-audio').list(`audio/${item.name}`, { limit: 2000 });
        const fileCount = subItems?.filter(f => f.name.includes('.')).length || 0;
        console.log(`  - audio/${item.name}: ${fileCount} files`);
        totalFiles += fileCount;
      }
    }
    
    console.log(`\n✅ Total audio files: ${totalFiles}`);
    
    // List data folder
    console.log('\nChecking data/ folder...');
    const { data: dataItems } = await supabase.storage.from('worship-audio').list('data', { limit: 2000 });
    console.log('Data files:', dataItems?.length || 0);
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkWorshipAudio();
