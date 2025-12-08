// ساخت مستقیم buckets با REST API
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key:', serviceKey ? 'EXISTS' : 'NOT FOUND');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const buckets = [
  { id: 'worship-audio', name: 'worship-audio', public: true },
  { id: 'bible-audio', name: 'bible-audio', public: true },
  { id: 'sermons', name: 'sermons', public: true },
  { id: 'images', name: 'images', public: true },
  { id: 'documents', name: 'documents', public: true },
  { id: 'videos', name: 'videos', public: true }
];

async function createBuckets() {
  console.log('\n📦 Creating storage buckets...\n');
  
  for (const bucket of buckets) {
    try {
      console.log(`Creating: ${bucket.name}`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ✅ ${bucket.name} (already exists)`);
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${bucket.name} created successfully`);
      }
      
      // کمی صبر می‌کنیم
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
  }
  
  // لیست نهایی buckets
  console.log('\n📋 Final bucket list:');
  const { data: allBuckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('Error listing buckets:', error.message);
  } else {
    console.log(`Found ${allBuckets.length} buckets:`);
    allBuckets.forEach(b => {
      console.log(`  - ${b.name} (${b.public ? 'public' : 'private'})`);
    });
  }
}

createBuckets().catch(console.error);
