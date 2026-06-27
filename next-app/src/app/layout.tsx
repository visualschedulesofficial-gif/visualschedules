import type { Metadata } from "next";
import { Playfair_Display, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400"],
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
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
      className={`${playfair.variable} ${atkinson.variable} h-full`}
    >
      <body className="h-full overflow-hidden font-sans bg-bg text-[#2C2C2C]">
        {children}
      </body>
    </html>
  );
}
