"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Was a server-side unconditional redirect("/schedule") — sent every visit,
// phone or desktop, to the raw builder. That's why "My Space" felt like the
// only way into the real mobile app: it was. Phones now land on /schedules
// (the actual app home); desktop keeps going straight to the builder.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    router.replace(isMobile ? "/schedules" : "/schedule");
  }, [router]);
  return <div className="min-h-dvh bg-bg" />;
}
