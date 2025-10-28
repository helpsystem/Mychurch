const fs = require('fs');
const cheerio = require('cheerio');

// خواندن sample HTML
const html = fs.readFileSync('sample-song.html', 'utf8');
const $ = cheerio.load(html);

console.log('🔍 Testing YouTube extraction from sample HTML...\n');

// جستجوی لینک‌های یوتیوب
let count = 0;
$('a[href*="youtube.com/embed"]').each((i, el) => {
  const href = $(el).attr('href');
  const match = href.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (match) {
    count++;
    console.log(`${count}. Found YouTube: https://www.youtube.com/watch?v=${match[1]}`);
    console.log(`   Full href: ${href}\n`);
  }
});

console.log(`\n📊 Total YouTube links found: ${count}`);

// تست با cheerio selector مختلف
console.log('\n🔍 Testing different selectors:\n');

const selectors = [
  'a[href*="youtube.com/embed"]',
  'a[href*="youtube"]',
  '.colorbox-load[href*="youtube"]',
  'a.colorbox-load',
  '.views-field-field-video a'
];

selectors.forEach(sel => {
  const found = $(sel).length;
  console.log(`${sel}: ${found} elements`);
});
