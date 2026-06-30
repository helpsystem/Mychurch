"use client";

import dynamic from "next/dynamic";

const AudioSyncClient = dynamic(
  () => import("./AudioSyncClient"),
  { ssr: false }
);

export default function AudioSyncPage() {
  return <AudioSyncClient />;
}
