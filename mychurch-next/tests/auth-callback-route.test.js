const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const routePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'callback', 'route.ts');
let source = fs.readFileSync(routePath, 'utf8');

// Transform imports and TypeScript annotations for running inside Node vm
let moduleSource = source
  .replace('import { NextResponse } from "next/server";', 'const NextResponse = { redirect: (url) => ({ redirectUrl: url.toString() }) };')
  .replace('import { createClient } from "@/utils/supabase/server";', 'const createClient = async () => ({ auth: { verifyOtp: async () => {}, exchangeCodeForSession: async (code) => ({ data: { user: { email: "user@example.com", user_metadata: { full_name: "Test User" } } } }), getUser: async () => ({ data: { user: null } }) } });')
  .replace('import { resolveAuthCallbackOrigin } from "@/lib/site-url";', 'const { resolveAuthCallbackOrigin } = { resolveAuthCallbackOrigin: (requestUrl, headers) => { const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim(); if (siteUrl) return siteUrl; const forwardedHost = headers.get("x-forwarded-host") || headers.get("host"); const forwardedProto = headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", ""); if (forwardedHost) { let origin = `${forwardedProto}://${forwardedHost}`; if (origin.startsWith("https://localhost:")) { origin = origin.replace("https://", "http://"); } return origin; } return requestUrl.origin; } };')
  .replace(/export async function GET\(request: Request\)/, 'async function GET(request)')
  .replace(/type:\s*type as "signup" \| "invite" \| "magiclink" \| "recovery" \| "email_change",/, 'type: type,')
  // Remove the user sync block to avoid dynamic imports in test
  .replace(/if \(user\) \{[\s\S]*?\n\s*\}/, 'if (user) { /* noop in test */ }')
  .concat('\nmodule.exports.GET = GET;');

// Clean up any leftover upsert conflict trailing syntax that may break the vm transform
moduleSource = moduleSource.replace(/,\s*\{\s*onConflict:\s*'email'\s*\}\s*\);/g, ');');
// Fix any accidental leftover closing paren after noop replacement
moduleSource = moduleSource.replace('if (user) { /* noop in test */ });', 'if (user) { /* noop in test */ }');
// Remove any try/catch admin-sync blocks left in the transform
moduleSource = moduleSource.replace(/try\s*\{[\s\S]*?\}\s*catch\s*\([\s\S]*?\)\s*\{[\s\S]*?\}\s*/g, '');

const sandbox = {
  module: { exports: {} },
  exports: {},
  require,
  __dirname: path.dirname(routePath),
  __filename: routePath,
  process,
  URL,
  console,
};

vm.runInNewContext(moduleSource, sandbox, { filename: routePath });
const { GET } = sandbox.module.exports;

// Small Headers shim
class HeadersShim {
  constructor(entries = {}) {
    this.map = new Map(Object.entries(entries));
  }
  get(name) {
    return this.map.get(name) || null;
  }
}

(async () => {
  // Case 1: NEXT_PUBLIC_SITE_URL set
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.iranianchurchdc.com';
  const req1 = {
    url: 'https://example.com/api/auth/callback?code=abc&next=/profile',
    headers: new HeadersShim({ host: 'example.com' }),
  };
  const res1 = await GET(req1);
  assert.equal(res1.redirectUrl, 'https://www.iranianchurchdc.com/profile');

  // Case 2: no env, forwarded host to localhost
  delete process.env.NEXT_PUBLIC_SITE_URL;
  const req2 = {
    url: 'http://localhost:3000/api/auth/callback?code=abc&next=/profile',
    headers: new HeadersShim({ 'x-forwarded-host': 'localhost:3000', 'x-forwarded-proto': 'https' }),
  };
  const res2 = await GET(req2);
  assert.equal(res2.redirectUrl, 'http://localhost:3000/profile');

  console.log('auth-callback route redirect regression passed');
})();
