"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/Spotlight";

type PageVisualsProps = {
  className?: string;
  soft?: boolean;
};

export function PageVisuals({ className, soft = false }: PageVisualsProps) {
  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden", className)} aria-hidden="true">
      <div className={cn("absolute inset-0 bg-noise", soft ? "opacity-[0.2]" : "opacity-[0.28]")} />
      <Spotlight className="-top-56 left-0 md:left-24" fill="var(--primary)" />
      <Spotlight className="top-28 right-0 md:right-20 rotate-180 opacity-80" fill="var(--ring)" />

      <div className={cn("absolute top-[8%] right-[8%] rounded-full blur-[120px]", soft ? "w-[34%] h-[34%] bg-primary/15" : "w-[44%] h-[44%] bg-primary/25")} />
      <div className={cn("absolute bottom-[8%] left-[8%] rounded-full blur-[120px]", soft ? "w-[32%] h-[32%] bg-secondary/30" : "w-[38%] h-[38%] bg-secondary/35")} />
      <div className={cn("absolute top-[42%] left-[42%] rounded-full blur-[90px]", soft ? "w-[20%] h-[20%] bg-primary/15" : "w-[24%] h-[24%] bg-primary/25")}/>
    </div>
  );
}
