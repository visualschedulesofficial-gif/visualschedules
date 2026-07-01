"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  role: string;
}

interface Schedule {
  id: string;
  title: string;
  scheduleType: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  custom: "Custom",
  firstthen: "First / Then",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function SchedulesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const currentUser = sessionData.user || null;
        setUser(currentUser);

        if (currentUser) {
          const schedulesRes = await fetch("/api/schedules");
          if (schedulesRes.ok) {
            const data = await schedulesRes.json();
            setSchedules(data.schedules || []);
          }
        }
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete. Please try again.");
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Nav */}
      <nav className="h-[56px] md:h-[66px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-7 shrink-0">
        <Link
          href="/schedule"
          className="font-serif text-base md:text-2xl italic text-ink no-underline leading-none"
        >
          Visual Schedules
        </Link>
        <Link
          href="/schedule"
          className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all"
        >
          + New Schedule
        </Link>
      </nav>

      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">

        {loading ? (
          // Loading state
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>

        ) : !user ? (
          // Not logged in
          <div className="text-center py-24">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface border border-border flex items-center justify-center">
              <svg className="w-6 h-6 stroke-ink-3 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl italic text-ink mb-2">My Schedules</h1>
            <p className="text-[13px] text-ink-2 mb-6 max-w-xs mx-auto leading-relaxed">
              Sign in to save your schedules and access them from any device.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/login"
                className="text-[11px] tracking-wider uppercase px-6 py-2.5 bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/schedule"
                className="text-[11px] tracking-wider uppercase px-6 py-2.5 border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
              >
                Continue Without Account
              </Link>
            </div>
          </div>

        ) : (
          // Logged in
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-serif text-2xl italic text-ink">My Schedules</h1>
              <span className="text-[11px] text-ink-3">
                {schedules.length} schedule{schedules.length !== 1 ? "s" : ""} saved
              </span>
            </div>

            {schedules.length === 0 ? (
              // Empty state
              <div className="bg-surface border border-border p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-bg flex items-center justify-center">
                  <svg className="w-6 h-6 stroke-ink-3 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-medium text-ink mb-2">
                  No saved schedules yet
                </h2>
                <p className="text-[13px] text-ink-2 leading-relaxed mb-6 max-w-xs mx-auto">
                  Create a schedule and use the Save button to keep it here. Your schedules are saved to your account and accessible on any device.
                </p>
                <Link
                  href="/schedule"
                  className="text-[11px] tracking-wider uppercase px-6 py-2.5 bg-accent text-white border border-accent no-underline font-medium font-sans hover:bg-accent-hover transition-all inline-block"
                >
                  Create Your First Schedule
                </Link>
              </div>

            ) : (
              // Schedule grid
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="bg-surface border border-border hover:shadow-md hover:border-[#C8C4BC] transition-all flex flex-col"
                  >
                    {/* Type badge */}
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-[10px] tracking-wider uppercase font-medium text-ink-3">
                        {TYPE_LABELS[s.scheduleType] || s.scheduleType}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="px-4 pb-3 flex-1">
                      <h2 className="font-serif text-lg italic text-ink leading-snug">
                        {s.title || "Untitled Schedule"}
                      </h2>
                      <p className="text-[11px] text-ink-3 mt-1">
                        Edited {timeAgo(s.updatedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-border">
                      <Link
                        href={`/schedule?id=${s.id}`}
                        className="flex-1 py-2.5 text-[11px] tracking-wider uppercase text-center text-ink-2 no-underline hover:bg-surface-hover hover:text-ink transition-colors border-r border-border font-medium font-sans"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        className="flex-1 py-2.5 text-[11px] tracking-wider uppercase text-ink-3 hover:bg-[#FAF0F0] hover:text-[#B83232] transition-colors font-medium font-sans"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-ink text-[#9A9690] px-7 py-4 flex items-center justify-between gap-4 flex-wrap text-xs max-md:px-4 mt-auto">
        <span className="font-serif text-base italic text-[#F5F2EC]">Grow Gently</span>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/privacy" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Privacy</Link>
          <Link href="/terms" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Terms</Link>
          <Link href="/refund" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Refunds</Link>
        </div>
      </footer>
    </div>
  );
}
