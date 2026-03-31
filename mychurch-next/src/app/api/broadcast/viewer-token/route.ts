import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/utils/rbac";

export const runtime = "nodejs";

const MAX_SESSION_ID_LENGTH = 120;
const TOKEN_TTL_SECONDS = 2 * 60 * 60;
const TOKEN_RATE_WINDOW_MS = 60_000;
const TOKEN_RATE_MAX_REQUESTS = 30;

type RateState = {
  windowStart: number;
  count: number;
};

const tokenRateMap = new Map<string, RateState>();

function getSecret(): string {
  return (
    process.env.BROADCAST_VIEWER_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "dev-broadcast-secret"
  );
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function sign(payloadBase64Url: string): string {
  return toBase64Url(
    crypto.createHmac("sha256", getSecret()).update(payloadBase64Url).digest()
  );
}

function normalizeSessionId(sessionId: unknown): string | null {
  if (typeof sessionId !== "string") return null;
  const trimmed = sessionId.trim();
  if (!trimmed || trimmed.length > MAX_SESSION_ID_LENGTH) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "unknown";
}

function consumeTokenRateLimit(key: string): boolean {
  const now = Date.now();
  const existing = tokenRateMap.get(key);

  if (!existing) {
    tokenRateMap.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (now - existing.windowStart > TOKEN_RATE_WINDOW_MS) {
    existing.windowStart = now;
    existing.count = 1;
    return true;
  }

  existing.count += 1;
  return existing.count <= TOKEN_RATE_MAX_REQUESTS;
}

function createToken(sessionId: string): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = toBase64Url(JSON.stringify({ s: sessionId, e: expiresAt }));
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, expiresAt };
}

function verifyToken(token: string, sessionId: string): { ok: boolean; reason?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };

  const [payloadPart, sigPart] = parts;
  const expectedSig = sign(payloadPart);

  const sigA = Buffer.from(sigPart);
  const sigB = Buffer.from(expectedSig);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return { ok: false, reason: "signature" };
  }

  try {
    const decoded = JSON.parse(fromBase64Url(payloadPart).toString("utf8")) as {
      s?: string;
      e?: number;
    };

    if (!decoded?.s || decoded.s !== sessionId) return { ok: false, reason: "session" };
    if (!decoded?.e || Math.floor(Date.now() / 1000) > decoded.e) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "payload" };
  }
}

export async function POST(req: NextRequest) {
  await requireRole(["Admin", "Leader", "Operator"]);

  const ip = getClientIp(req);
  if (!consumeTokenRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many token requests. Please wait and retry." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const sessionId = normalizeSessionId(body?.sessionId);

  if (!sessionId) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const { token, expiresAt } = createToken(sessionId);
  return NextResponse.json({ token, expiresAt, sessionId });
}

export async function GET(req: NextRequest) {
  const sessionId = normalizeSessionId(req.nextUrl.searchParams.get("session"));
  const token = req.nextUrl.searchParams.get("token") || "";

  if (!sessionId || !token) {
    return NextResponse.json({ ok: false, error: "Missing session/token" }, { status: 400 });
  }

  const result = verifyToken(token, sessionId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason || "invalid" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
