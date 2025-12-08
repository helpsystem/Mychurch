#!/usr/bin/env node

/**
 * مهاجرت فایل‌های سنگین از سرور به Supabase Storage
 * 
 * Usage:
 *   node scripts/migrate-to-storage.cjs --type worship
 *   node scripts/migrate-to-storage.cjs --type bible
 *   node scripts/migrate-to-storage.cjs --type all
 */

require('dotenv').config();
const storage = require('../backend/services/storageService');
const path = require('path');
const fs = require('fs');

const MIGRATIONS = {
  worship: {
    bucket: storage.BUCKETS.WORSHIP_AUDIO,
    localPath: path.join(__dirname, '../public/worship/audio'),
    remotePath: 'audio'
  },
  'worship-data': {
    bucket: storage.BUCKETS.WORSHIP_AUDIO,
    localPath: path.join(__dirname, '../public/worship/data'),
    remotePath: 'data'
  },
  'worship-pdf': {
    bucket: storage.BUCKETS.DOCUMENTS,
    localPath: path.join(__dirname, '../public/worship/pdf'),
    remotePath: 'worship/pdf'
  },
  bible: {
    bucket: storage.BUCKETS.BIBLE_AUDIO,
    localPath: path.join(__dirname, '../public/bible/audio'),
    remotePath: 'audio'
  },
  'bible-timings': {
    bucket: storage.BUCKETS.BIBLE_AUDIO,
    localPath: path.join(__dirname, '../public/bible/data/timings'),
    remotePath: 'timings'
  },
  sermons: {
    bucket: storage.BUCKETS.SERMONS,
    localPath: path.join(__dirname, '../public/sermons'),
    remotePath: ''
  },
  images: {
    bucket: storage.BUCKETS.IMAGES,
    localPath: path.join(__dirname, '../public/images'),
    remotePath: ''
  }
};

async function setupBuckets() {
  console.log('📦 Setting up storage buckets...\n');
  
  const buckets = Object.values(storage.BUCKETS);
  
  for (const bucket of buckets) {
    await storage.ensureBucket(bucket, true);
  }
  
  console.log('\n✅ All buckets ready!\n');
}

async function migrateType(type) {
  const config = MIGRATIONS[type];
  
  if (!config) {
    console.error(`❌ Unknown migration type: ${type}`);
    console.log(`Available types: ${Object.keys(MIGRATIONS).join(', ')}`);
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Migration: ${type}`);
  console.log(`   Local:  ${config.localPath}`);
  console.log(`   Bucket: ${config.bucket}`);
  console.log(`   Remote: ${config.remotePath}`);
  console.log(`${'='.repeat(60)}\n`);

  // Ensure bucket exists
  await storage.ensureBucket(config.bucket);

  // Migrate files
  const results = await storage.migrateLocalFiles(
    config.localPath,
    config.bucket,
    config.remotePath
  );

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Migration Summary: ${type}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Success: ${results.success.length} files`);
  console.log(`❌ Failed:  ${results.failed.length} files`);
  console.log(`📦 Total:   ${results.total} files`);
  
  if (results.failed.length > 0) {
    console.log(`\n⚠️  Failed files:`);
    results.failed.forEach(f => {
      console.log(`   - ${f.destination}: ${f.error}`);
    });
  }
  
  console.log(`${'='.repeat(60)}\n`);

  return results;
}

async function migrateAll() {
  console.log('🚀 Starting full migration...\n');
  
  await setupBuckets();
  
  const allResults = {
    success: [],
    failed: [],
    total: 0
  };

  for (const type of Object.keys(MIGRATIONS)) {
    const results = await migrateType(type);
    
    allResults.success.push(...results.success);
    allResults.failed.push(...results.failed);
    allResults.total += results.total;
    
    // Rate limiting between migrations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 FULL MIGRATION SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Success: ${allResults.success.length} files`);
  console.log(`❌ Failed:  ${allResults.failed.length} files`);
  console.log(`📦 Total:   ${allResults.total} files`);
  console.log(`${'='.repeat(60)}\n`);

  return allResults;
}

async function generateUrlMapping() {
  console.log('📝 Generating URL mapping file...\n');
  
  const mapping = {};
  
  for (const [type, config] of Object.entries(MIGRATIONS)) {
    const result = await storage.listFiles(config.bucket, config.remotePath);
    
    if (result.success) {
      mapping[type] = result.files.map(file => ({
        name: file.name,
        oldPath: `/worship/audio/${file.name}`, // Example
        newUrl: storage.getPublicUrl(config.bucket, path.join(config.remotePath, file.name))
      }));
    }
  }

  const outputPath = path.join(__dirname, '../storage-url-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
  
  console.log(`✅ URL mapping saved to: ${outputPath}\n`);
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(arg => arg.startsWith('--type='));
  const type = typeArg ? typeArg.split('=')[1] : 'help';

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 STORAGE MIGRATION TOOL`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    if (type === 'help' || type === '--help' || type === '-h') {
      console.log('Usage:');
      console.log('  node migrate-to-storage.cjs --type=worship');
      console.log('  node migrate-to-storage.cjs --type=bible');
      console.log('  node migrate-to-storage.cjs --type=all');
      console.log('  node migrate-to-storage.cjs --type=setup  (only create buckets)');
      console.log('  node migrate-to-storage.cjs --type=mapping (generate URL mapping)');
      console.log('\nAvailable types:');
      Object.keys(MIGRATIONS).forEach(t => console.log(`  - ${t}`));
      console.log('  - all (migrate everything)');
      console.log('  - setup (only create buckets)');
      console.log('  - mapping (generate URL mapping)\n');
    } else if (type === 'setup') {
      await setupBuckets();
    } else if (type === 'mapping') {
      await generateUrlMapping();
    } else if (type === 'all') {
      await migrateAll();
    } else {
      await setupBuckets();
      await migrateType(type);
    }
    
    console.log('✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateType, migrateAll, setupBuckets };
