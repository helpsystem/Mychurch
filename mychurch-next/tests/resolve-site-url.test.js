const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'src', 'lib', 'site-url.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const moduleSource = source
  .replace('const CANONICAL_SITE_URL = "https://www.iranianchurchdc.com";', 'const CANONICAL_SITE_URL = "https://www.iranianchurchdc.com";\nmodule.exports.CANONICAL_SITE_URL = CANONICAL_SITE_URL;')
  .replace('export function resolveAuthCallbackOrigin(requestUrl: URL, headers: Headers) {', 'function resolveAuthCallbackOrigin(requestUrl, headers) {')
  .replace('export function normalizeSiteOrigin', 'function normalizeSiteOrigin')
  .replace('export function resolvePublicSiteUrl()', 'function resolvePublicSiteUrl()')
  .replace(/: string \| undefined \| null/g, '')
  .concat('\nmodule.exports.normalizeSiteOrigin = normalizeSiteOrigin;\nmodule.exports.resolveAuthCallbackOrigin = resolveAuthCallbackOrigin;\nmodule.exports.resolvePublicSiteUrl = resolvePublicSiteUrl;\n');

const sandbox = {
  module: { exports: {} },
  exports: {},
  require,
  __dirname: path.dirname(sourcePath),
  __filename: sourcePath,
  process,
  URL,
};

vm.runInNewContext(moduleSource, sandbox, { filename: sourcePath });

const { normalizeSiteOrigin, resolveAuthCallbackOrigin, CANONICAL_SITE_URL } = sandbox.module.exports;

const HeadersShim = class {
  constructor(entries = {}) {
    this.map = new Map(Object.entries(entries));
  }
  get(name) {
    return this.map.get(name) || null;
  }
};

assert.equal(normalizeSiteOrigin('', CANONICAL_SITE_URL), CANONICAL_SITE_URL);
assert.equal(normalizeSiteOrigin('iranianchurchdc.com', CANONICAL_SITE_URL), 'https://iranianchurchdc.com');
assert.equal(normalizeSiteOrigin('http://localhost:3000', CANONICAL_SITE_URL), 'http://localhost:3000');
assert.equal(normalizeSiteOrigin('https://www.iranianchurchdc.com/profile', CANONICAL_SITE_URL), 'https://www.iranianchurchdc.com');
assert.equal(normalizeSiteOrigin('::::bad-url::::', CANONICAL_SITE_URL), CANONICAL_SITE_URL);

process.env.NEXT_PUBLIC_SITE_URL = 'https://www.iranianchurchdc.com';
assert.equal(
  sandbox.module.exports.resolveAuthCallbackOrigin(new URL('https://www.iranianchurchdc.com/api/auth/callback'), new HeadersShim({ host: 'localhost:3000' })),
  'https://www.iranianchurchdc.com'
);

delete process.env.NEXT_PUBLIC_SITE_URL;
assert.equal(
  resolveAuthCallbackOrigin(
    new URL('http://localhost:3000/api/auth/callback'),
    new HeadersShim({ 'x-forwarded-host': 'localhost:3000', 'x-forwarded-proto': 'https' })
  ),
  'http://localhost:3000'
);

console.log('resolve-site-url regression checks passed');
