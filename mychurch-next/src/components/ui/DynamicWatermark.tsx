"use client";

import React, { useEffect, useState } from "react";
import { getWatermarkConfig } from "@/actions/widgets";
import { WatermarkLogo, type WatermarkPosition } from "./WatermarkLogo";

interface Props {
    className?: string;
    defaultSize?: number;
    defaultPosition?: WatermarkPosition;
    defaultOpacity?: number;
    defaultCustomOffsets?: { x: number, y: number };
}

export function DynamicWatermark({
    className,
    defaultSize = 400,
    defaultPosition = 'custom',
    defaultOpacity = 4,
    defaultCustomOffsets = { x: 50, y: 50 }
}: Props) {
    const [config, setConfig] = useState<Record<string, any> | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Fetch global watermark configs from the Server Action
        getWatermarkConfig().then(res => {
            if (res) setConfig(res);
            setIsLoaded(true);
        }).catch(() => {
            setIsLoaded(true);
        });
    }, []);

    // Prevent rendering until we know the actual config to avoid flickers
    if (!isLoaded) return null;

    return (
        <WatermarkLogo
            size={config?.size || defaultSize}
            position={config?.position || defaultPosition}
            opacity={config?.opacity || defaultOpacity}
            imageUrl={config?.imageUrl}
            customOffsets={config?.customOffsets || defaultCustomOffsets}
            className={className}
        />
    );
}
