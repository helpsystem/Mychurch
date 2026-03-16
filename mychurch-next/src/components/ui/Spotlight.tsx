"use client";

import { cn } from "@/lib/utils";

type SpotlightProps = {
  className?: string;
  fill?: string;
};

export function Spotlight({ className, fill = "white" }: SpotlightProps) {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
      aria-hidden="true"
    >
      <g filter="url(#filter0_f_29_215)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M343.985 847.253L91.134 1630.99H259.619L343.985 847.253ZM91.134 1630.99H219.068L486.649 1461.46L199.13 874.331L91.134 1630.99ZM219.068 1630.99H462.665L687.971 1406.84L219.068 1630.99ZM462.665 1630.99H706.262L931.568 1352.22L462.665 1630.99ZM706.262 1630.99H949.859L1175.16 1297.59L706.262 1630.99ZM949.859 1630.99H1193.46L1418.76 1242.97L949.859 1630.99ZM1193.46 1630.99H1437.05L1662.36 1188.35L1193.46 1630.99ZM1437.05 1630.99H1680.65L1905.96 1133.73L1437.05 1630.99ZM1680.65 1630.99H1924.25L2149.56 1079.11L1680.65 1630.99ZM1924.25 1630.99H2167.84L2393.15 1024.48L1924.25 1630.99ZM2167.84 1630.99H2411.44L2636.75 969.863L2167.84 1630.99ZM2411.44 1630.99H2655.04L2880.34 915.242L2411.44 1630.99ZM2655.04 1630.99H2898.64L3123.94 860.621L2655.04 1630.99ZM2898.64 1630.99H3142.23L3367.54 806L2898.64 1630.99ZM3142.23 1630.99H3385.83L3611.14 751.378L3142.23 1630.99ZM3385.83 1630.99H3629.43L3854.73 696.757L3385.83 1630.99ZM3629.43 1630.99H3873.02L4098.33 642.136L3629.43 1630.99Z"
          fill={fill}
          fillOpacity="0.18"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_29_215"
          x="-160.333"
          y="-160.333"
          width="4538.93"
          height="3162.65"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_29_215" />
        </filter>
      </defs>
    </svg>
  );
}
