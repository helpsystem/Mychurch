#!/usr/bin/env node

/**
 * تست ساده برای بررسی response API
 */

async function testAPI() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🔍 Testing Genesis 1...');
  const resp1 = await fetch('https://samanabyar.online/api/bible/content/GEN/1');
  const data1 = await resp1.json();
  
  console.log('✓ Success:', data1.success);
  console.log('✓ Has verses:', !!data1.verses);
  console.log('✓ Has verses.fa:', !!data1.verses?.fa);
  console.log('✓ Type:', Array.isArray(data1.verses?.fa) ? 'Array' : typeof data1.verses?.fa);
  console.log('✓ Count:', data1.verses?.fa?.length);
  console.log('✓ First item (index 0):', JSON.stringify(data1.verses?.fa[0]));
  console.log('✓ Second item (index 1):', JSON.stringify(data1.verses?.fa[1]));
  
  console.log('\n🔍 Testing Genesis 3...');
  const resp3 = await fetch('https://samanabyar.online/api/bible/content/GEN/3');
  const data3 = await resp3.json();
  
  console.log('✓ Success:', data3.success);
  console.log('✓ Has verses:', !!data3.verses);
  console.log('✓ Has verses.fa:', !!data3.verses?.fa);
  console.log('✓ Type:', Array.isArray(data3.verses?.fa) ? 'Array' : typeof data3.verses?.fa);
  console.log('✓ Count:', data3.verses?.fa?.length);
  console.log('✓ First item (index 0):', JSON.stringify(data3.verses?.fa[0]));
  console.log('✓ Second item (index 1):', JSON.stringify(data3.verses?.fa[1]));
  
  console.log('\n🔍 Testing Genesis 50...');
  const resp50 = await fetch('https://samanabyar.online/api/bible/content/GEN/50');
  const data50 = await resp50.json();
  
  console.log('✓ Success:', data50.success);
  console.log('✓ Has verses:', !!data50.verses);
  console.log('✓ Has verses.fa:', !!data50.verses?.fa);
  console.log('✓ Type:', Array.isArray(data50.verses?.fa) ? 'Array' : typeof data50.verses?.fa);
  console.log('✓ Count:', data50.verses?.fa?.length);
  console.log('✓ First item (index 0):', JSON.stringify(data50.verses?.fa[0]));
  console.log('✓ Second item (index 1):', JSON.stringify(data50.verses?.fa[1]));
}

testAPI().catch(console.error);
