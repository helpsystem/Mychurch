import React from "react";
import SlideBuilder from "@/components/broadcast/SlideBuilder";
import { requireRole } from "@/utils/rbac";

export const metadata = {
    title: "Slide Builder | MyChurch",
    description: "Create and edit Sermon and Scripture slides for broadcast.",
};

export default async function SlideBuilderPage() {
    // Only authorized roles can build slides
    await requireRole(['Admin', 'Leader', 'Operator']);

    return <SlideBuilder />;
}
