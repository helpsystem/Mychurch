/**
 * Anti-Bot & Spam Detection Engine for Church Mail System
 * Evaluates inbound email content, headers, and metadata to protect the church inbox.
 */

export interface SpamAnalysisResult {
  isSpam: boolean;
  isBot: boolean;
  score: number; // 0 to 100
  reasons: string[];
  botReason?: string;
  verdict: "clean" | "suspicious" | "spam";
}

const SPAM_KEYWORDS = [
  { pattern: /\b(crypto|bitcoin|btc|eth|binance|metamask|wallet)\b.*(profit|investment|deposit|guaranteed|earn)/i, weight: 35, reason: "Cryptocurrency / Investment scam pattern" },
  { pattern: /\b(viagra|cialis|pharmacy|erectile|medication without prescription)\b/i, weight: 45, reason: "Illicit pharmaceutical spam" },
  { pattern: /\b(verify your account|account suspended|immediate action required|login within 24 hours)\b/i, weight: 30, reason: "Phishing / Urgent credential harvesting phrase" },
  { pattern: /\b(inherited funds|inheritance of \$|beneficiary of \$|next of kin|unclaimed funds)\b/i, weight: 40, reason: "Advance-fee / Nigerian prince scam pattern" },
  { pattern: /\b(claim your prize|lottery winner|you have been selected to receive|congratulations you won)\b/i, weight: 35, reason: "Sweepstakes / Fake reward scam" },
  { pattern: /\b(casino|slots|free spins|betting bonus|jackpot)\b/i, weight: 30, reason: "Gambling / Betting promotion" },
  { pattern: /https?:\/\/[^\s]+(\.ru|\.xyz|\.top|\.click|\.work|\.link|\.live)\/[^\s]*/i, weight: 20, reason: "High-risk TLD link detected" },
];

const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com", "throwawaymail.com", "guerrillamail.com", "10minutemail.com",
  "sharklasers.com", "yopmail.com", "mailinator.com", "trashmail.com"
];

export function analyzeSpamAndBot(params: {
  fromEmail: string;
  fromName?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  headers?: Record<string, string>;
  spfStatus?: string;
  dkimStatus?: string;
}): SpamAnalysisResult {
  const reasons: string[] = [];
  let score = 0;
  let isBot = false;
  let botReason: string | undefined;

  const content = `${params.subject || ""} ${params.bodyText || ""} ${params.bodyHtml || ""}`;
  const senderDomain = params.fromEmail.split("@")[1]?.toLowerCase() || "";

  // 1. Check for disposable domain
  if (DISPOSABLE_EMAIL_DOMAINS.includes(senderDomain)) {
    score += 40;
    reasons.push(`Disposable sender domain (${senderDomain})`);
  }

  // 2. Keyword & Pattern Matching
  for (const item of SPAM_KEYWORDS) {
    if (item.pattern.test(content)) {
      score += item.weight;
      reasons.push(item.reason);
    }
  }

  // 3. Excessive Links / Bot indicator
  const linkCount = (content.match(/https?:\/\//gi) || []).length;
  if (linkCount > 7) {
    score += 25;
    reasons.push(`Excessive hyperlinks (${linkCount} links)`);
  }

  // 4. Empty subject + suspicious links
  if (!params.subject.trim() && linkCount > 0) {
    score += 30;
    isBot = true;
    botReason = "Empty subject combined with automated links";
    reasons.push(botReason);
  }

  // 5. SPF / DKIM verification signals (if passed by Resend or mail server)
  if (params.spfStatus && params.spfStatus.toLowerCase() === "fail") {
    score += 35;
    reasons.push("SPF authentication failed (Sender IP not permitted)");
  }
  if (params.dkimStatus && params.dkimStatus.toLowerCase() === "fail") {
    score += 35;
    reasons.push("DKIM cryptographic signature verification failed");
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  let verdict: "clean" | "suspicious" | "spam" = "clean";
  let isSpam = false;

  if (score >= 45) {
    verdict = "spam";
    isSpam = true;
  } else if (score >= 20) {
    verdict = "suspicious";
    // Suspicious can still land in inbox with a warning badge, or spam if bot is flagged
    if (isBot) isSpam = true;
  }

  return {
    isSpam,
    isBot,
    score,
    reasons,
    botReason,
    verdict,
  };
}
