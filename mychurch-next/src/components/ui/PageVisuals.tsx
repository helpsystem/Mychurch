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
      <div className={cn("absolute inset-0 bg-noise", soft ? "opacity-[0.12]" : "opacity-[0.18]")} />
      <Spotlight className="-top-56 left-0 md:left-24" fill="var(--primary)" />
      <Spotlight className="top-28 right-0 md:right-20 rotate-180 opacity-60" fill="var(--ring)" />

      <div className={cn("absolute top-[8%] right-[8%] rounded-full blur-[120px]", soft ? "w-[32%] h-[32%] bg-primary/10" : "w-[40%] h-[40%] bg-primary/15")} />
      <div className={cn("absolute bottom-[8%] left-[8%] rounded-full blur-[120px]", soft ? "w-[30%] h-[30%] bg-secondary/20" : "w-[36%] h-[36%] bg-secondary/25")} />
      <div className={cn("absolute top-[42%] left-[42%] rounded-full blur-[90px]", soft ? "w-[18%] h-[18%] bg-primary/10" : "w-[22%] h-[22%] bg-primary/15")}/>
    </div>
  );
}
