import React from "react";
import { getGlobalPopupData } from "@/actions/widgets";
import { NowruzPopup } from "./NowruzPopup";

export async function GlobalPopupWrapper() {
    const { isActive, config } = await getGlobalPopupData();
    
    if (!isActive) return null;

    return <NowruzPopup config={config} />;
}
