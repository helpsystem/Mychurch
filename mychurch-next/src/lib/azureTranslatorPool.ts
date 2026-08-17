/**
 * Microsoft Azure Translator Multi-Account Key Pool & Load Balancer
 * 
 * Supports multiple Azure Cognitive Services accounts:
 * - Round-robin / Auto-Failover if an account runs out of monthly quota (429/403)
 * - Seamless pooling of multiple Free 2,000,000 chars/month accounts (2 accounts = 4M, 3 = 6M, etc.)
 */

export interface AzureAccount {
  key: string;
  region: string;
  name?: string;
  failureCount?: number;
  lastFailure?: number;
}

// Global in-memory pool
let accounts: AzureAccount[] = [];
let currentAccountIndex = 0;

export function getAzureAccounts(): AzureAccount[] {
  if (accounts.length > 0) return accounts;

  const pool: AzureAccount[] = [];

  // 1. Check for comma-separated or formatted AZURE_TRANSLATOR_KEYS (e.g. "key1:region1,key2:region2")
  const multiKeysEnv = process.env.AZURE_TRANSLATOR_KEYS;
  if (multiKeysEnv) {
    const parts = multiKeysEnv.split(',');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      const [k, r] = part.split(':');
      if (k) {
        pool.push({
          key: k.trim(),
          region: (r || process.env.AZURE_TRANSLATOR_REGION || 'eastus').trim(),
          name: `Account #${i + 1}`,
          failureCount: 0,
        });
      }
    }
  }

  // 2. Check numbered keys: AZURE_TRANSLATOR_KEY_1, AZURE_TRANSLATOR_KEY_2, etc.
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`AZURE_TRANSLATOR_KEY_${i}`];
    const r = process.env[`AZURE_TRANSLATOR_REGION_${i}`] || process.env.AZURE_TRANSLATOR_REGION || 'eastus';
    if (k && k.trim()) {
      pool.push({
        key: k.trim(),
        region: r.trim(),
        name: `Account #${i}`,
        failureCount: 0,
      });
    }
  }

  // 3. Fallback to standard primary/secondary keys
  const primaryKey = process.env.AZURE_TRANSLATOR_KEY;
  const primaryRegion = process.env.AZURE_TRANSLATOR_REGION || 'eastus';
  if (primaryKey && primaryKey.trim()) {
    if (!pool.some(a => a.key === primaryKey.trim())) {
      pool.unshift({
        key: primaryKey.trim(),
        region: primaryRegion.trim(),
        name: 'Primary Account',
        failureCount: 0,
      });
    }
  }

  // Check secondary key if available (AZURE_TRANSLATOR_KEY_2 or secondary)
  const secondaryKey = process.env.AZURE_TRANSLATOR_KEY_SECONDARY;
  if (secondaryKey && secondaryKey.trim()) {
    if (!pool.some(a => a.key === secondaryKey.trim())) {
      pool.push({
        key: secondaryKey.trim(),
        region: primaryRegion.trim(),
        name: 'Secondary Account',
        failureCount: 0,
      });
    }
  }

  accounts = pool;
  return accounts;
}

/**
 * Execute translation with automatic failover across all configured Microsoft Azure accounts
 */
export async function translateWithAzurePool(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<{ translatedText: string; accountName: string; keyIndex: number } | null> {
  const pool = getAzureAccounts();
  if (pool.length === 0) return null;

  const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
  let url = `${endpoint}?api-version=3.0&to=${encodeURIComponent(targetLang)}`;
  if (sourceLang) {
    url += `&from=${encodeURIComponent(sourceLang)}`;
  }

  const payload = JSON.stringify([{ text }]);
  const totalAccounts = pool.length;

  // Try each account in the pool in sequence starting from current index
  for (let attempt = 0; attempt < totalAccounts; attempt++) {
    const idx = (currentAccountIndex + attempt) % totalAccounts;
    const account = pool[idx];

    // Skip recently failing account (backoff for 1 minute)
    if (account.lastFailure && Date.now() - account.lastFailure < 60000 && account.failureCount! >= 3) {
      continue;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800); // Fast 1.8s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': account.key,
          'Ocp-Apim-Subscription-Region': account.region,
          'Content-type': 'application/json',
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translatedText = data?.[0]?.translations?.[0]?.text;
        if (translatedText) {
          // Success: reset failure count and remember this working account
          account.failureCount = 0;
          account.lastFailure = undefined;
          currentAccountIndex = idx; // Keep using this healthy account
          
          return {
            translatedText: translatedText.trim(),
            accountName: account.name || `Account #${idx + 1}`,
            keyIndex: idx + 1,
          };
        }
      } else {
        // Status 429 (Quota limit / Rate limit) or 403 (Invalid key/expired)
        console.warn(`[AzurePool] Account ${account.name} returned status ${response.status}. Switching to next account...`);
        account.failureCount = (account.failureCount || 0) + 1;
        account.lastFailure = Date.now();
      }
    } catch (err: any) {
      console.warn(`[AzurePool] Account ${account.name} network/timeout error:`, err?.message || err);
      account.failureCount = (account.failureCount || 0) + 1;
      account.lastFailure = Date.now();
    }
  }

  return null;
}
