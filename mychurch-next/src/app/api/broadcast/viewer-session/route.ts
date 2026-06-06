import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
import { mergeSlidesWithLatestSongData } from "@/lib/presentation-helper";

const MAX_SESSION_ID_LENGTH = 128;

function getSecret(): string {
  return (
    process.env.BROADCAST_VIEWER_SECRET ||
    process.env.BROADCAST_VIEWER_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
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
    let rawSlides: unknown[];

    if (Array.isArray(row.slides_json)) {
      rawSlides = row.slides_json;
    } else if (typeof row.slides_json === 'string') {
      try {
        rawSlides = JSON.parse(row.slides_json);
      } catch {
        rawSlides = [];
      }
    } else if (Array.isArray(row.slides)) {
      rawSlides = row.slides;
    } else {
      rawSlides = [];
    }

    const mergedSlides = await mergeSlidesWithLatestSongData(rawSlides);

    return NextResponse.json({ ok: true, sessionId: row.id, slides: mergedSlides });
  } catch {
    return NextResponse.json({ ok: false, error: "db-error" }, { status: 500 });
  }
}
