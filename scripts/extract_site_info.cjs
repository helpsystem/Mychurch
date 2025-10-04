#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walkDir(dir, fileList = []) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    // Skip directories we can't read (permissions)
    return fileList;
  }
  for (const file of files) {
    const full = path.join(dir, file);
    // Skip build and dependency folders to avoid permission issues and speed up scan
    const base = path.basename(full).toLowerCase();
    if (base === 'dist' || base === 'node_modules' || base === '.git') continue;
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (err) {
      // Skip unreadable entries
      continue;
    }
    if (stat.isDirectory()) {
      walkDir(full, fileList);
    } else if (stat.isFile() && full.toLowerCase().endsWith('.html')) {
      fileList.push(full);
    }
  }
  return fileList;
}

function extract(html) {
  const data = {};
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  data.title = titleMatch ? titleMatch[1].trim() : '';

  // Generic meta tags (description, keywords)
  const meta = {};
  const metaRe = /<meta\s+([^>]*?)>/gi;
  while ((m = metaRe.exec(html))) {
    const attrs = m[1];
    const nameMatch = attrs.match(/name=["']?([^"'\s>]+)["']?/i);
    const propMatch = attrs.match(/property=["']?([^"'\s>]+)["']?/i);
    const contentMatch = attrs.match(/content=["']([\s\S]*?)["']/i);
    const key = propMatch ? propMatch[1].trim() : (nameMatch ? nameMatch[1].trim() : null);
    if (key && contentMatch) {
      meta[key] = contentMatch[1].trim();
    }
  }
  data.meta = meta;

  // Canonical link
  const canonicalMatch = html.match(/<link[^>]*rel=["']?canonical["']?[^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']?canonical["']?[^>]*>/i);
  data.canonical = canonicalMatch ? canonicalMatch[1] : '';

  // JSON-LD structured data
  const jsonld = [];
  const jsonldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = jsonldRe.exec(html))) {
    try {
      const parsed = JSON.parse(m[1]);
      jsonld.push(parsed);
    } catch (err) {
      // If invalid JSON, store raw
      jsonld.push({ raw: m[1].trim() });
    }
  }
  data.jsonld = jsonld;

  // H1s
  const h1s = [];
  const h1re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  while ((m = h1re.exec(html))) {
    h1s.push(m[1].replace(/<[^>]+>/g, '').trim());
  }
  data.h1 = h1s;

  // Links, images, scripts (src)
  const links = [];
  const aRe = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((m = aRe.exec(html))) {
    links.push(m[1]);
  }
  data.links = links;

  const imgs = [];
  const imgRe = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((m = imgRe.exec(html))) {
    imgs.push(m[1]);
  }
  data.images = imgs;

  const scripts = [];
  const scriptRe = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((m = scriptRe.exec(html))) {
    scripts.push(m[1]);
  }
  data.scripts = scripts;

  // Extract body text (strip scripts/styles and tags), compute simple stats
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : html;
  // remove script/style blocks
  bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  bodyHtml = bodyHtml.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // remove all tags
  let bodyText = bodyHtml.replace(/<[^>]+>/g, ' ');
  // decode HTML entities minimally
  bodyText = bodyText.replace(/&nbsp;/gi, ' ');
  bodyText = bodyText.replace(/&amp;/gi, '&');
  bodyText = bodyText.replace(/&lt;/gi, '<');
  bodyText = bodyText.replace(/&gt;/gi, '>');
  bodyText = bodyText.replace(/\s+/g, ' ').trim();
  data.bodyText = bodyText;

  // simple tokenizer for English + Persian words
  const tokenRe = /[A-Za-z\u0600-\u06FF]+/g;
  const tokens = (bodyText.match(tokenRe) || []).map(t => t.toLowerCase()).filter(t => t.length > 1);

  // basic stopwords English + Persian (small set)
  const stop_en = new Set(['the','and','for','that','with','this','from','have','you','your','are','was','but','not','all','our','they','their','will','can','has','his','her']);
  const stop_fa = new Set(['و','در','به','از','با','که','را','یا','برای','است','این','تا','آن','می','بر','شد','کنند','شود','شود']);

  const freqs = {};
  for (const w of tokens) {
    if (stop_en.has(w) || stop_fa.has(w)) continue;
    freqs[w] = (freqs[w] || 0) + 1;
  }
  const topWords = Object.keys(freqs).sort((a,b) => freqs[b]-freqs[a]).slice(0,25).map(k => ({ word:k, count: freqs[k] }));
  data.wordCount = tokens.length;
  data.topWords = topWords;
  data.readingTimeMinutes = Math.max(1, Math.round(tokens.length / 200));

  return data;
}

function main() {
  // Allow optional directory argument: node scripts/extract_site_info.cjs <path>
  const argPath = process.argv[2];
  const root = argPath ? path.resolve(argPath) : process.cwd();
  console.log('Scanning for HTML files under', root);
  const files = walkDir(root);
  if (!files.length) {
    console.log('No HTML files found.');
    return process.exit(0);
  }

  const results = [];
  for (const file of files) {
    try {
      const html = fs.readFileSync(file, 'utf8');
      const info = extract(html);
      results.push({ file: path.relative(root, file), ...info, counts: { h1: info.h1.length, links: info.links.length, images: info.images.length, scripts: info.scripts.length } });
    } catch (err) {
      console.error('Failed to read', file, err.message);
    }
  }

  const outJson = path.join('scripts', 'site-report.json');
  const outCsv = path.join('scripts', 'site-report.csv');
  fs.writeFileSync(outJson, JSON.stringify(results, null, 2), 'utf8');

  const csvLines = ['file,title,metaDescription,h1_count,links_count,images_count,scripts_count'];
  for (const r of results) {
    const safe = (v) => '"' + (String(v || '').replace(/"/g, '""').replace(/\r?\n/g, ' ') ) + '"';
    csvLines.push([r.file, r.title, r.metaDescription, r.counts.h1, r.counts.links, r.counts.images, r.counts.scripts].map(safe).join(','));
  }
  fs.writeFileSync(outCsv, csvLines.join('\n'), 'utf8');

  console.log('Wrote', outJson, 'and', outCsv);
}

main();
