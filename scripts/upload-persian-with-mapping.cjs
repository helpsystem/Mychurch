require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOCAL_DIR = '/root/Mychurch/public/worship/audio/kalameh';
const BUCKET = 'worship-audio';
const REMOTE_PREFIX = 'audio/kalameh';

function generateFileId(filename) {
  // Create a hash-based ID
  const hash = crypto.createHash('md5').update(filename).digest('hex').substring(0, 8);
  const ext = path.extname(filename);
  return `song_${hash}${ext}`;
}

async function uploadWithMapping() {
  console.log('🔄 Uploading Persian files with ID-based naming...\n');
  
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error('❌ Directory not found:', LOCAL_DIR);
    return;
  }
  
  const files = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`Found ${files.length} MP3 files\n`);
  
  let success = 0;
  let failed = 0;
  const mapping = {};
  const failedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const originalFilename = files[i];
    const localPath = path.join(LOCAL_DIR, originalFilename);
    
    // Generate safe ID-based filename
    const safeFilename = generateFileId(originalFilename);
    const remotePath = `${REMOTE_PREFIX}/${safeFilename}`;
    
    try {
      console.log(`[${i + 1}/${files.length}] ${originalFilename} → ${safeFilename}`);
      
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
        failedFiles.push({ file: originalFilename, error: error.message });
      } else {
        const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${remotePath}`;
        console.log(`   ✅ Uploaded`);
        
        mapping[safeFilename] = {
          original: originalFilename,
          safe: safeFilename,
          url: publicUrl,
          path: remotePath
        };
        
        success++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (e) {
      console.log(`   ❌ Exception: ${e.message}`);
      failed++;
      failedFiles.push({ file: originalFilename, error: e.message });
    }
  }
  
  // Save mapping file
  const mappingPath = '/root/Mychurch/public/worship/data/persian_files_mapping.json';
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`\n📄 Mapping file saved: ${mappingPath}`);
  
  // Upload mapping to storage
  const mappingBuffer = fs.readFileSync(mappingPath);
  await supabase.storage.from(BUCKET).upload('data/persian_files_mapping.json', mappingBuffer, {
    contentType: 'application/json',
    upsert: true
  });
  console.log('📤 Mapping file uploaded to storage\n');
  
  console.log('============================================================');
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

uploadWithMapping();
