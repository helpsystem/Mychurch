import React from "react";
import { query } from "@/lib/db";
import { createAdminClient } from "@/utils/supabase/server";
import { VerseOfTheDayPopup } from "./VerseOfTheDayPopup";

export async function VersePopupWrapper() {
    try {
        let isActive = false;
        let config: any = {};

        try {
            const supabase = await createAdminClient();
            const { data } = await supabase
                .from("widgets")
                .select("is_active, config")
                .eq("id", "w_verse_donation")
                .maybeSingle();
            if (data) {
                isActive = !!data.is_active;
                config = data.config || {};
            }
        } catch {
            const { rows } = await query(
                "SELECT is_active, config FROM widgets WHERE id = 'w_verse_donation'"
            );
            isActive = rows[0]?.is_active || false;
            config = rows[0]?.config || {};
        }
        
        if (!isActive) return null;

        return <VerseOfTheDayPopup config={config} />;
    } catch (error) {
        console.error("[VersePopupWrapper] Error loading verse widget data:", error);
        return null;
    }
}
