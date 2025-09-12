import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOMAIN = 'https://your-domain.com'; // Update with actual domain
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Define all pages/routes for the website
const routes = [
  // Main pages
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about', priority: 0.9, changefreq: 'monthly' },
  { path: '/leaders', priority: 0.8, changefreq: 'monthly' },
  { path: '/sermons', priority: 0.9, changefreq: 'weekly' },
  { path: '/worship', priority: 0.8, changefreq: 'weekly' },
  { path: '/bible', priority: 0.9, changefreq: 'monthly' },
  { path: '/audio-bible', priority: 0.8, changefreq: 'monthly' },
  { path: '/bible-reader', priority: 0.8, changefreq: 'monthly' },
  { path: '/worship-songs', priority: 0.7, changefreq: 'weekly' },
  { path: '/worship-presentation', priority: 0.6, changefreq: 'weekly' },
  { path: '/daily-devotional', priority: 0.8, changefreq: 'daily' },
  { path: '/giving', priority: 0.7, changefreq: 'monthly' },
  { path: '/prayer', priority: 0.8, changefreq: 'weekly' },
  { path: '/prayer-requests', priority: 0.7, changefreq: 'weekly' },
  { path: '/events', priority: 0.8, changefreq: 'weekly' },
  { path: '/calendar', priority: 0.7, changefreq: 'weekly' },
  { path: '/announcements', priority: 0.7, changefreq: 'weekly' },
  { path: '/contact', priority: 0.8, changefreq: 'monthly' },
  { path: '/ai-helper', priority: 0.6, changefreq: 'monthly' },
  { path: '/gallery', priority: 0.6, changefreq: 'monthly' },
  { path: '/help-center', priority: 0.5, changefreq: 'monthly' },
  { path: '/new-here', priority: 0.8, changefreq: 'monthly' },
  { path: '/connect', priority: 0.7, changefreq: 'monthly' },
  { path: '/testimonials', priority: 0.7, changefreq: 'monthly' },
  { path: '/live', priority: 0.9, changefreq: 'weekly' },
  { path: '/notification-center', priority: 0.5, changefreq: 'daily' },
  
  // Auth pages (lower priority)
  { path: '/login', priority: 0.3, changefreq: 'yearly' },
  { path: '/signup', priority: 0.3, changefreq: 'yearly' },
  { path: '/verify-email', priority: 0.2, changefreq: 'yearly' },
  
  // Special pages
  { path: '/presentation', priority: 0.4, changefreq: 'monthly' }
];

// Languages
const languages = ['en', 'fa'];

// Generate sitemap URLs for both languages
function generateSitemapUrls() {
  const urls = [];
  const now = new Date().toISOString();
  
  // Add root domain
  urls.push({
    loc: DOMAIN,
    lastmod: now,
    changefreq: 'daily',
    priority: '1.0',
    alternates: languages.map(lang => ({
      rel: 'alternate',
      hreflang: lang,
      href: `${DOMAIN}/${lang}/`
    }))
  });
  
  // Add language-specific routes
  languages.forEach(lang => {
    routes.forEach(route => {
      const url = `${DOMAIN}/${lang}${route.path}`;
      urls.push({
        loc: url,
        lastmod: now,
        changefreq: route.changefreq,
        priority: route.priority.toString(),
        alternates: languages.map(l => ({
          rel: 'alternate',
          hreflang: l,
          href: `${DOMAIN}/${l}${route.path}`
        }))
      });
    });
  });
  
  return urls;
}

// Generate XML sitemap content
function generateSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    
    // Add hreflang alternatives for bilingual SEO
    if (url.alternates) {
      url.alternates.forEach(alt => {
        xml += `    <xhtml:link rel="${alt.rel}" hreflang="${alt.hreflang}" href="${alt.href}"/>\n`;
      });
      
      // Add x-default
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${url.alternates[0].href}"/>\n`;
    }
    
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

// Generate sitemap index for large sites (future use)
function generateSitemapIndex() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <sitemap>\n';
  xml += `    <loc>${DOMAIN}/sitemap.xml</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
  xml += '  </sitemap>\n';
  xml += '</sitemapindex>';
  return xml;
}

// Main function
function generateSitemap() {
  try {
    console.log('🗺️  Generating XML sitemap...');
    
    const urls = generateSitemapUrls();
    const sitemapXML = generateSitemapXML(urls);
    
    // Write sitemap to public directory
    fs.writeFileSync(OUTPUT_PATH, sitemapXML, 'utf8');
    
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📍 Location: ${OUTPUT_PATH}`);
    console.log(`🔗 URLs included: ${urls.length}`);
    console.log(`🌐 Languages: ${languages.join(', ')}`);
    console.log(`📝 Update domain in script before production: ${DOMAIN}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();