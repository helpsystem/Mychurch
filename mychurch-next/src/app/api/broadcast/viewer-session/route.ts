import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_SECRET = process.env.BROADCAST_VIEWER_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me";
const MAX_SESSION_ID_LENGTH = 128;

function normalizeSessionId(sessionId: unknown): string | null {
  if (typeof sessionId !== "string") return null;
  const trimmed = sessionId.trim();
  if (!trimmed || trimmed.length > MAX_SESSION_ID_LENGTH) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLen);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(payloadBase64Url: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(payloadBase64Url).digest("base64url");
}

function verifyToken(token: string, sessionId: string): { ok: boolean; reason?: string } {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return { ok: false, reason: "malformed" };

  const expectedSig = sign(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { ok: false, reason: "bad-signature" };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as { s?: string; e?: number };
    if (parsed.s !== sessionId) return { ok: false, reason: "session-mismatch" };
    if (typeof parsed.e !== "number" || Number.isNaN(parsed.e)) return { ok: false, reason: "bad-exp" };
    const now = Math.floor(Date.now() / 1000);
    if (parsed.e < now) return { ok: false, reason: "expired" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "bad-payload" };
  }
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

  try {
    const { rows } = await query(
      "SELECT id, slides_json, slides FROM presentations WHERE id = $1 LIMIT 1",
      [sessionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "session-not-found" }, { status: 404 });
    }

    const row = rows[0] as { id: string; slides_json?: unknown; slides?: unknown };
    const rawSlides = Array.isArray(row.slides_json) ? row.slides_json : Array.isArray(row.slides) ? row.slides : [];

    return NextResponse.json({ ok: true, sessionId: row.id, slides: rawSlides });
  } catch {
    return NextResponse.json({ ok: false, error: "db-error" }, { status: 500 });
  }
}
