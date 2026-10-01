import type { Metadata } from "next";
import { SiteTopBar } from "@/components/schedule/BuilderTopBar";
import { getEnv, requireAdmin } from "@/lib/admin-auth";
import { getCourse } from "@/lib/course";
import { CourseClient } from "@/components/course/CourseClient";

export const metadata: Metadata = {
  title: "Free Course — Visual Schedules for Neurodiverse Children | Visual Schedules",
  description: "Short video chapters on using visual schedules and routines with autistic, ADHD and neurodiverse children.",
  alternates: { canonical: "https://visualschedule.app/course" },
};

export const dynamic = "force-dynamic";

export default async function CoursePage() {
  const env = getEnv();
  const course = await getCourse(env.DB);
  // Admins can preview an unpublished course.
  const visible = course.published || (await requireAdmin(env));
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <SiteTopBar />
      <CourseClient course={visible ? course : { ...course, chapters: [] }} preview={visible && !course.published} />
    </div>
  );
}
