"use client";

import dynamic from "next/dynamic";

const ScheduleBuilder = dynamic(
  () => import("@/components/schedule/ScheduleBuilder"),
  { ssr: false }
);

export default function ScheduleBuilderPage() {
  return <ScheduleBuilder />;
}
