/**
 * دیباگ کردن ساختار HTML
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const KALAMEH_ROOT = path.join('D:', 'Windows.old', 'Users', 'Sami', 'Desktop', 'Iran Church DC', 'My Web Sites', 'Bible', 'www.kalameh.com');

// پیدا کردن اولین فایل HTML
const htmlFiles = fs.readdirSync(KALAMEH_ROOT)
  .filter(f => f.startsWith('song-archive') && f.endsWith('.html'))
  .map(f => path.join(KALAMEH_ROOT, f));

if (htmlFiles.length === 0) {
  console.log('❌ No HTML files found!');
  process.exit(1);
}

const htmlPath = htmlFiles[0];
console.log(`🔍 Analyzing: ${path.basename(htmlPath)}\n`);

const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// یافتن تمام accordion headers
const headers = $('.views-accordion-songs_and_video-page-header');
console.log(`📦 Found ${headers.length} accordion headers\n`);

if (headers.length > 0) {
  console.log('🔍 Analyzing first song:\n');
  
  const $firstHeader = headers.first();
  const $firstContent = $firstHeader.next('.ui-accordion-content');
  
  console.log('=== HEADER ===');
  console.log($firstHeader.html().substring(0, 500));
  
  console.log('\n=== CONTENT ===');
  if ($firstContent.length === 0) {
    console.log('⚠️  No .ui-accordion-content found!');
    console.log('\nLooking for alternative structures...');
    
    // جستجوی siblings
    console.log('\n=== SIBLINGS ===');
    $firstHeader.nextAll().slice(0, 3).each((i, el) => {
      console.log(`Sibling ${i + 1}: ${$(el).attr('class') || 'no-class'}`);
      console.log($(el).html()?.substring(0, 300) || 'empty');
      console.log('---');
    });
  } else {
    console.log($firstContent.html().substring(0, 1000));
  }
  
  console.log('\n=== SEARCHING FOR YOUTUBE ===');
  
  // جستجوی یوتیوب در header
  const headerYT = $firstHeader.find('a[href*="youtube"]');
  console.log(`YouTube in header: ${headerYT.length}`);
  
  // جستجوی یوتیوب در content
  const contentYT = $firstContent.find('a[href*="youtube"]');
  console.log(`YouTube in content: ${contentYT.length}`);
  if (contentYT.length > 0) {
    console.log(`First link: ${contentYT.first().attr('href')}`);
  }
  
  // جستجوی global
  const globalYT = $('a[href*="youtube"]');
  console.log(`YouTube in entire document: ${globalYT.length}`);
  if (globalYT.length > 0) {
    console.log(`First link: ${globalYT.first().attr('href')}`);
    console.log(`\nAll YouTube links (first 5):`);
    globalYT.slice(0, 5).each((i, el) => {
      console.log(`  ${i + 1}. ${$(el).attr('href')}`);
    });
  }
}

// جستجوی تمام accordion content
console.log('\n=== CHECKING ALL ACCORDIONS ===');
$('.views-accordion-songs_and_video-page-header').each((index, element) => {
  const $header = $(element);
  const $content = $header.next('.ui-accordion-content');
  
  const title = $header.find('.song_title').text().trim();
  const ytLink = $content.find('a[href*="youtube"]').first().attr('href');
  
  if (ytLink) {
    console.log(`✅ Song ${index + 1}: ${title} -> ${ytLink}`);
  }
  
  if (index >= 5) return false; // فقط 5 تا اول
});
