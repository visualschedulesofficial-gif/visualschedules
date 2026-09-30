"use client";

// Slim desktop header for the builder: brand, 1-2-3 steps, site links,
// text size and account — replaces the black accessibility strip and the
// dark nav so the page gets the height.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type User = { id: string; email: string; role: string };

export function BuilderTopBar({ placed, total }: { placed: number; total: number }) {
  const full = total > 0 && placed >= total;
  return (
    <header className="h-14 shrink-0 bg-white border-b border-border flex items-center relative px-4 z-50">
      <a
        href="#canvas-wrap"
        className="absolute -left-[9999px] top-0 bg-white text-ink px-4 py-2 text-[13px] font-semibold z-[1000] focus:left-2 focus:top-2"
      >
        Skip to schedule
      </a>

      <Link href="/schedule" className="flex items-center gap-2.5 no-underline text-ink shrink-0">
        <span className="w-8 h-8 rounded-[9px] bg-accent-strong flex items-center justify-center">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" /></svg>
        </span>
        <span className="font-serif text-[17px] whitespace-nowrap">Visual Schedules</span>
      </Link>

      <ol className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 m-0 p-0 list-none" aria-label="Progress">
        <Step n={1} label="Choose type" state="done" />
        <Sep done />
        <Step n={2} label="Add cards" state={full ? "done" : "on"} />
        <Sep done={full} />
        <Step n={3} label="Save & download" state={full ? "on" : "todo"} />
      </ol>

      <div className="ml-auto flex items-center gap-1">
        <NavLink href="/downloads" label="Free Schedules" icon={<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11" />} />
        <NavLink href="/blog" label="Blog" icon={<path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5" />} />
        <TextSize />
        <Account />
      </div>
    </header>
  );
}

function Step({ n, label, state }: { n: number; label: string; state: "done" | "on" | "todo" }) {
  const circle =
    state === "on" ? "bg-accent-strong border-accent-strong text-white"
    : state === "done" ? "bg-accent-soft border-accent-strong text-accent-strong"
    : "bg-white border-[#CBD3C6] text-ink-3";
  return (
    <li className={`flex items-center gap-2 text-[14px] font-semibold whitespace-nowrap ${state === "todo" ? "text-ink-3" : state === "done" ? "text-accent-strong" : "text-ink"}`} aria-current={state === "on" ? "step" : undefined}>
      <span key={state} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[13px] ${circle} ${state === "done" ? "animate-[vsPop_350ms_ease-out]" : ""}`}>
        {state === "done" ? "✓" : n}
      </span>
      {label}
    </li>
  );
}

function Sep({ done }: { done: boolean }) {
  return <li aria-hidden className={`w-12 h-0.5 rounded ${done ? "bg-accent-strong" : "bg-[#DCE2D8]"}`} />;
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] no-underline text-ink-2 font-semibold text-[13.5px] hover:bg-surface-hover hover:text-ink whitespace-nowrap">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      {label}
    </Link>
  );
}

function TextSize() {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("vs_a11y_zoom"));
      if (saved >= 80 && saved <= 140) {
        setZoom(saved);
        document.documentElement.style.fontSize = `${(14 * saved) / 100}px`;
      }
    } catch {}
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const apply = (z: number) => {
    const c = Math.max(80, Math.min(140, z));
    setZoom(c);
    document.documentElement.style.fontSize = `${(14 * c) / 100}px`;
    try { localStorage.setItem("vs_a11y_zoom", String(c)); } catch {}
  };
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Text size and accessibility" className="w-10 h-10 rounded-[10px] flex items-center justify-center hover:bg-surface-hover">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="1.9" strokeLinecap="round"><path d="M4 19l5-14 5 14M6 14h6M15 19l3-8 3 8M16 16.5h4" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-border rounded-xl shadow-lg p-3 space-y-3 z-[200]">
          <p className="text-[12px] font-semibold text-ink-2 uppercase tracking-wider">Text size</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => apply(zoom - 10)} aria-label="Decrease text size" className="w-10 h-10 rounded-lg border border-input-border font-bold">A−</button>
            <button type="button" onClick={() => apply(100)} aria-label="Reset text size" className="flex-1 h-10 rounded-lg hover:bg-surface-hover font-semibold">{zoom}%</button>
            <button type="button" onClick={() => apply(zoom + 10)} aria-label="Increase text size" className="w-10 h-10 rounded-lg border border-input-border font-bold">A+</button>
          </div>
          <a href="mailto:visualschedulesofficial@gmail.com" className="block text-[13px] text-ink-2 underline">Accessibility help</a>
        </div>
      )}
    </div>
  );
}

function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!checked) return <span className="w-[34px] h-[34px] ml-1" />;
  if (!user) {
    return (
      <Link href="/login?next=/schedule" className="ml-1 h-9 px-4 rounded-full bg-accent-strong text-white font-bold text-[13.5px] flex items-center no-underline hover:bg-accent-hover">
        Log in
      </Link>
    );
  }
  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/schedule";
  };
  return (
    <div className="relative ml-1" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={`Account: ${user.email}`} aria-expanded={open} className="w-[34px] h-[34px] rounded-full bg-accent-strong text-white font-bold">
        {user.email?.[0]?.toUpperCase() || "?"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-lg z-[200] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">Signed in as</p>
            <p className="text-[13px] text-ink truncate">{user.email}</p>
          </div>
          <Link href="/schedules" className="block px-3 py-2.5 text-[13px] text-ink no-underline hover:bg-surface-hover">My Schedules</Link>
          <Link href="/plans" className="block px-3 py-2.5 text-[13px] text-ink no-underline hover:bg-surface-hover">Plans</Link>
          <button type="button" onClick={logout} className="w-full text-left px-3 py-2.5 text-[13px] text-[#C53030] hover:bg-[#FEF0F0] border-t border-border">Log out</button>
        </div>
      )}
    </div>
  );
}
