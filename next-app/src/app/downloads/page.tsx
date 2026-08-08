import type { Metadata } from "next";
import { DownloadsClient } from "@/components/downloads/DownloadsClient";

export const metadata: Metadata = {
  title: "Free Downloads — Printable Visual Schedules | Visual Schedules",
  description:
    "Free, ready-to-print visual schedule cards for autistic, ADHD and neurodiverse children — filter by category, character and language.",
  alternates: { canonical: "https://visualschedule.app/downloads" },
};

export default function DownloadsPage() {
  return <DownloadsClient />;
}
