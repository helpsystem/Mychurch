// تست سریع Supabase Storage با dotenv
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// از همان URL که در logs دیدیم
const supabaseUrl = process.env.SUPABASE_URL || 'https://wxzhzsqicgwfxffxayhy.supabase.co';

// Service key را از environment می‌گیریم
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!serviceKey);
console.log('Service Key length:', serviceKey ? serviceKey.length : 0);

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment');
  console.log('\nAvailable SUPABASE env vars:');
  Object.keys(process.env).filter(k => k.includes('SUPABASE')).forEach(k => {
    console.log(`  - ${k}: ${process.env[k].substring(0, 50)}...`);
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  try {
    console.log('\n📦 Testing storage...');
    
    // Test 1: List buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ Storage accessible!');
    console.log(`Found ${buckets ? buckets.length : 0} buckets:`);
    if (buckets) {
      buckets.forEach(b => console.log(`  - ${b.name} (${b.public ? 'public' : 'private'})`));
    }
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

test();
