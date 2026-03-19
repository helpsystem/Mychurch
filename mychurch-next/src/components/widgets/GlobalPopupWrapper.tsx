import React from "react";
import { getGlobalPopupStatus } from "@/actions/widgets";
import { NowruzPopup } from "./NowruzPopup";

export async function GlobalPopupWrapper() {
    const isPopupActive = await getGlobalPopupStatus();
    
    if (!isPopupActive) return null;

    return <NowruzPopup />;
}
