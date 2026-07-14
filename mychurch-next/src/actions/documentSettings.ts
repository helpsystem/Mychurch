"use server";

import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/utils/rbac";

// ─── Type: matches DEFAULT_CHURCH in DocumentsClient ─────────────────────────
export interface ChurchDocSettings {
  nameEn: string;
  nameFa: string;
  address: string;
  ein: string;
  phone: string;
  email: string;
  web: string;
  logo: string;
  pastor: string;
  denomination: string;
  letterheadTheme: string;
  customHeaderImage: string;
  paperSize: string;
  watermarkOpacity: number;
  showWatermark: boolean;
  signatureImage: string;
  signatoryName: string;
  signatoryTitle: string;
  showVerifyQR: boolean;
  designEn: {
    titleSize: number;
    bodySize: number;
    footerSize: number;
    fontFamily: string;
    logoSize: number;
    headerPadding: number;
    isBoldTitle: boolean;
    isItalicBody: boolean;
  };
  designFa: {
    titleSize: number;
    bodySize: number;
    footerSize: number;
    fontFamily: string;
    logoSize: number;
    headerPadding: number;
    isBoldTitle: boolean;
    isItalicBody: boolean;
  };
}

import { query } from "@/lib/db";

// ─── Ensure table exists ──────────────────────────────────────────────────────
async function ensureTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS church_document_settings (
        id text PRIMARY KEY,
        settings jsonb NOT NULL,
        updated_at timestamp with time zone DEFAULT now()
      );
    `);
  } catch (e) {
    console.error("[DocumentSettings] Failed to ensure table exists:", e);
  }
}

// ─── Get settings (uses service role to bypass RLS — settings are not sensitive) ──
export async function getDocumentSettings(): Promise<ChurchDocSettings | null> {
  try {
    await ensureTable();
    const { createClient: createServiceClient } = await import("@/utils/supabase/server");
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("church_document_settings")
      .select("settings")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) return null;
    const s = data.settings as any;
    if (!s || Object.keys(s).length === 0) return null;
    return s as ChurchDocSettings;
  } catch (e) {
    console.error("[DocumentSettings] getDocumentSettings error:", e);
    return null;
  }
}

// ─── Save settings (Admin/Leader only) ───────────────────────────────────────
export async function saveDocumentSettings(settings: ChurchDocSettings): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["Admin", "Leader"]);
    await ensureTable();
    const supabase = await createClient();

    const { error } = await supabase
      .from("church_document_settings")
      .upsert({
        id: "default",
        settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      // Table might not exist yet — try to create it
      if (error.code === "42P01") {
        // Table doesn't exist, fall back to localStorage only
        return { success: false, error: "TABLE_NOT_FOUND" };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("[DocumentSettings] saveDocumentSettings error:", e);
    return { success: false, error: e.message };
  }
}
