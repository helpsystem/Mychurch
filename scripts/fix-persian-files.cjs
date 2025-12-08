require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOCAL_DIR = '/root/Mychurch/public/worship/audio/kalameh';
const BUCKET = 'worship-audio';
const REMOTE_PREFIX = 'audio/kalameh';

async function uploadPersianFiles() {
  console.log('🔄 Re-uploading Persian files with URL encoding...\n');
  
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error('❌ Directory not found:', LOCAL_DIR);
    return;
  }
  
  const files = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`Found ${files.length} MP3 files\n`);
  
  let success = 0;
  let failed = 0;
  const failedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const localPath = path.join(LOCAL_DIR, filename);
    
    // URL encode the filename for remote storage
    const encodedFilename = encodeURIComponent(filename);
    const remotePath = `${REMOTE_PREFIX}/${encodedFilename}`;
    
    try {
      console.log(`[${i + 1}/${files.length}] ${filename}`);
      
      const fileBuffer = fs.readFileSync(localPath);
      
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(remotePath, fileBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });
      
      if (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        failed++;
        failedFiles.push({ file: filename, error: error.message });
      } else {
        console.log(`   ✅ Uploaded as: ${encodedFilename}`);
        success++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (e) {
      console.log(`   ❌ Exception: ${e.message}`);
      failed++;
      failedFiles.push({ file: filename, error: e.message });
    }
  }
  
  console.log('\n============================================================');
  console.log('📊 Upload Summary');
  console.log('============================================================');
  console.log(`✅ Success: ${success} files`);
  console.log(`❌ Failed:  ${failed} files`);
  console.log(`📦 Total:   ${files.length} files`);
  console.log('============================================================\n');
  
  if (failedFiles.length > 0) {
    console.log('❌ Failed files:');
    failedFiles.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
  }
}

uploadPersianFiles();
