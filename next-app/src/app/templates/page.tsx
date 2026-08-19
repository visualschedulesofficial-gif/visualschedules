"use client";

// /templates — admin-curated default schedules, browsable by anyone.
// Tapping one writes it into the same sessionStorage draft key
// MobileScheduleBuilder already restores from (see the draft-restore effect
// there) and sends you to /schedule — so no changes were needed in the
// builder itself. Saving there creates a NEW schedule owned by you; the
// original template is untouched.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GREEN = "#4A5A3E";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const FAINT = "#9AA69E";
const BORDER = "#E6EBE6";
const BG = "#F5F8F5";

interface TemplateSummary {
  id: string;
  title: string;
  scheduleType: string;
  language: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily", mini: "My Schedule", firstthen: "First / Then", iwant: "I Want",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        // Browsing templates no longer requires an account — people should
        // be able to see what's on offer before committing an email.
        setAuthed(!!d?.user);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [authed]);

  const startFrom = async (id: string) => {
    setStartingId(id);
    try {
      const full = await fetch(`/api/templates/${id}`).then((r) => r.json());
      if (!full?.data) { setStartingId(null); return; }
      // Starting from a template is a NEW schedule — clear any active id so
      // it doesn't overwrite the last one the builder was editing.
      sessionStorage.removeItem("vs_active_schedule_id");
      sessionStorage.setItem("vs_draft_mobile_schedule", JSON.stringify({
        title: full.title,
        scheduleType: full.scheduleType,
        language: full.language,
        gender: full.gender,
        gridCols: full.gridCols,
        pages: full.data.pages || [],
      }));
      router.push("/schedule");
    } catch {
      setStartingId(null);
    }
  };

  if (!authChecked) {
    return <div className="min-h-dvh" style={{ background: BG }} />;
  }

  return (
    <div className="h-dvh overflow-hidden flex flex-col" style={{ background: BG }}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 shrink-0">
        <button onClick={() => router.back()} className="w-8 h-8 -ml-1 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="font-bold text-[18px]" style={{ color: INK }}>Templates</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-6">
        <p className="text-[13px] mb-4" style={{ color: SUB }}>Ready-made schedules — tap one to start building from it.</p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${BORDER}`, borderTopColor: GREEN }} />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
            <p className="text-[13px]" style={{ color: SUB }}>No templates yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => startFrom(t.id)}
                disabled={startingId === t.id}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left disabled:opacity-60"
                style={{ background: "#fff", border: `1px solid ${BORDER}` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN_SOFT }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] truncate" style={{ color: INK }}>{t.title || "Untitled"}</div>
                  <div className="text-[12px]" style={{ color: SUB }}>{TYPE_LABELS[t.scheduleType] || t.scheduleType}</div>
                </div>
                {startingId === t.id ? (
                  <div className="w-5 h-5 rounded-full animate-spin shrink-0" style={{ border: `2px solid ${GREEN_BORDER}`, borderTopColor: GREEN }} />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
