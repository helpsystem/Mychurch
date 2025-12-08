/**
 * Storage Service - مدیریت فایل‌های سنگین در Supabase Storage
 * 
 * Buckets:
 * - worship-audio: فایل‌های صوتی ستایش
 * - bible-audio: فایل‌های صوتی کتاب مقدس
 * - sermons: فایل‌های ویدیو و صوتی موعظه‌ها
 * - images: تصاویر و عکس‌ها
 * - documents: فایل‌های PDF و اسناد
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Storage Buckets
const BUCKETS = {
  WORSHIP_AUDIO: 'worship-audio',
  BIBLE_AUDIO: 'bible-audio',
  SERMONS: 'sermons',
  IMAGES: 'images',
  DOCUMENTS: 'documents',
  VIDEOS: 'videos'
};

/**
 * ایجاد یا چک کردن bucket
 */
async function ensureBucket(bucketName, isPublic = true) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets: ${listError.message}`);
      return false;
    }

    const bucketExists = buckets.find(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`📦 Creating bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 524288000 // 500 MB
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}: ${error.message}`);
        return false;
      }
      
      console.log(`✅ Bucket created: ${bucketName}`);
    } else {
      console.log(`✅ Bucket exists: ${bucketName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket: ${error.message}`);
    return false;
  }
}

/**
 * آپلود فایل به storage
 */
async function uploadFile(bucketName, filePath, destinationPath, options = {}) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(destinationPath);
    
    console.log(`📤 Uploading ${fileName} to ${bucketName}/${destinationPath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(destinationPath, fileBuffer, {
        contentType: options.contentType || getContentType(filePath),
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || true
      });

    if (error) {
      console.error(`Upload error: ${error.message}`);
      return { success: false, error: error.message };
    }

    // گرفتن public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(destinationPath);

    console.log(`✅ Uploaded: ${urlData.publicUrl}`);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: destinationPath,
      bucket: bucketName
    };
  } catch (error) {
    console.error(`Upload failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * لیست فایل‌های یک bucket
 */
async function listFiles(bucketName, folderPath = '') {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`List error: ${error.message}`);
      return { success: false, error: error.message };
    }

    return { success: true, files: data };
  } catch (error) {
    console.error(`List failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * حذف فایل
 */
async function deleteFile(bucketName, filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Delete error: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`🗑️  Deleted: ${bucketName}/${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`Delete failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * گرفتن URL عمومی فایل
 */
function getPublicUrl(bucketName, filePath) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * گرفتن signed URL با expiration
 */
async function getSignedUrl(bucketName, filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error(`Signed URL error: ${error.message}`);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error(`Signed URL failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * تشخیص content type
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain'
  };
  
  return types[ext] || 'application/octet-stream';
}

/**
 * آپلود دسته‌ای فایل‌ها
 */
async function uploadBatch(bucketName, files, options = {}) {
  console.log(`📦 Uploading ${files.length} files to ${bucketName}...`);
  
  const results = {
    success: [],
    failed: [],
    total: files.length
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Processing ${file.destination}...`);
    
    const result = await uploadFile(bucketName, file.source, file.destination, options);
    
    if (result.success) {
      results.success.push({ ...file, url: result.url });
    } else {
      results.failed.push({ ...file, error: result.error });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Upload complete: ${results.success.length} success, ${results.failed.length} failed`);
  
  return results;
}

/**
 * مهاجرت فایل‌های local به storage
 */
async function migrateLocalFiles(localDir, bucketName, remotePath = '') {
  console.log(`🚀 Starting migration: ${localDir} → ${bucketName}/${remotePath}`);
  
  const files = [];
  
  // خواندن تمام فایل‌های directory
  function scanDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, path.join(prefix, item));
      } else {
        files.push({
          source: fullPath,
          destination: path.join(remotePath, prefix, item).replace(/\\/g, '/'),
          size: stat.size
        });
      }
    });
  }
  
  if (fs.existsSync(localDir)) {
    scanDirectory(localDir);
    console.log(`📁 Found ${files.length} files (${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB)`);
    
    // آپلود دسته‌ای
    const results = await uploadBatch(bucketName, files);
    
    return results;
  } else {
    console.error(`❌ Directory not found: ${localDir}`);
    return { success: [], failed: [], total: 0 };
  }
}

module.exports = {
  BUCKETS,
  ensureBucket,
  uploadFile,
  listFiles,
  deleteFile,
  getPublicUrl,
  getSignedUrl,
  uploadBatch,
  migrateLocalFiles
};
