"use client";

import React from "react";
import { type MediaAsset } from "@/actions/media";
import { MediaPicker } from "@/components/admin/media/MediaPicker";

export default function MediaClient({ initialFiles }: { initialFiles: MediaAsset[] }) {
    return <MediaPicker mode="page" initialFiles={initialFiles} />;
}
