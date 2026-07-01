import type { Metadata } from "next";
import { Playwrite_DE_Grund } from "next/font/google";
import "./globals.css";

const playwrite = Playwrite_DE_Grund({
  weight: ["400"],
  variable: "--font-playwrite",
  display: "swap",
});

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
      className={`h-full ${playwrite.variable}`}
    >
      <body className="h-full overflow-hidden font-sans bg-bg text-[#2C2C2C]">
        {children}
      </body>
    </html>
  );
}
