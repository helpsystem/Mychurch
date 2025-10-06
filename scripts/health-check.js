#!/usr/bin/env node
import https from 'https';
import http from 'http';

const url = process.argv[2] || process.env.HEALTH_URL || 'http://localhost:5000/api/health';
const mod = url.startsWith('https') ? https : http;

const req = mod.get(url, res => {
  let data='';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const ok = res.statusCode === 200 && /"ok"\s*:\s*true/.test(data);
    console.log(JSON.stringify({ url, status: res.statusCode, ok, body: data.slice(0,500) }));
    process.exit(ok ? 0 : 2);
  });
});
req.on('error', err => {
  console.error(JSON.stringify({ url, error: err.message }));
  process.exit(1);
});
