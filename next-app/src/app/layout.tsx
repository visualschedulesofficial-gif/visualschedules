import type { Metadata } from "next";
import "./globals.css";

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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
