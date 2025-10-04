#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
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

  const metaDescMatch = html.match(/<meta[^>]*name=["']?description["']?[^>]*content=["']([\s\S]*?)["'][^>]*>/i)
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']?description["']?[^>]*>/i);
  data.metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

  const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)["']?[^>]*>/i);
  data.charset = charsetMatch ? charsetMatch[1].trim() : '';

  const h1s = [];
  const h1re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let m;
  while ((m = h1re.exec(html))) {
    h1s.push(m[1].replace(/<[^>]+>/g, '').trim());
  }
  data.h1 = h1s;

  const links = [];
  const aRe = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
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

  return data;
}

function main() {
  const root = process.cwd();
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
