import React from "react";
import { query } from "@/lib/db";
import { VerseOfTheDayPopup } from "./VerseOfTheDayPopup";

export async function VersePopupWrapper() {
    try {
        const { rows } = await query(
            "SELECT is_active, config FROM widgets WHERE id = 'w_verse_donation'"
        );
        
        const isActive = rows[0]?.is_active || false;
        const config = rows[0]?.config || {};
        
        if (!isActive) return null;

        return <VerseOfTheDayPopup config={config} />;
    } catch (error) {
        console.error("[VersePopupWrapper] Error loading verse widget data:", error);
        return null;
    }
}
