import type { Metadata } from "next";
import "./globals.css";

// Google Fonts will be loaded at runtime via CSS, not during build
// This allows builds to succeed in environments without external network access

export const metadata: Metadata = {
  title: "Visual Schedules — Grow Gently",
  description:
    "Create visual schedules for children with special needs. Drag-and-drop daily routines, weekly planners, and custom visual flows.",
  keywords: [
    "visual schedule",
    "special needs",
    "autism",
    "daily routine",
    "visual planner",
    "ASD",
    "ADHD",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="h-full overflow-hidden font-sans bg-bg text-[#2C2C2C]">
        {children}
      </body>
    </html>
  );
}
