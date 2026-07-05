import type { Metadata } from "next";
import { DownloadsClient } from "@/components/downloads/DownloadsClient";

export const metadata: Metadata = {
  title: "Free Printable Visual Schedules & Downloads | Visual Schedules",
  description:
    "Download free printable visual schedule bundles for children — morning routines, brushing teeth, bedtime and more. Boy, girl and mini versions in English and Hindi, ready to print.",
  keywords:
    "free printable visual schedule, autism visual schedule pdf, morning routine chart kids, first then board printable, ADHD daily routine printable",
  alternates: { canonical: "https://visualschedule.app/downloads" },
  openGraph: {
    title: "Free Printable Visual Schedules & Downloads",
    description:
      "Ready-to-print visual schedule bundles for children — free to download.",
    url: "https://visualschedule.app/downloads",
    type: "website",
  },
};

export default function DownloadsPage() {
  return <DownloadsClient />;
}
