import dynamic from "next/dynamic";

const AudioSyncClient = dynamic(
  () => import("./AudioSyncClient"),
  { ssr: false }
);

export const metadata = {
  title: "Audio-Text Sync & Highlight - MyChurch Admin",
  description: "Synchronize audio files with transcripts, lyrics, and translations.",
};

export default function AudioSyncPage() {
  return <AudioSyncClient />;
}
