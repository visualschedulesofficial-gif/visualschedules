"use client";

// Templates — admin-curated default schedules shown to every user under
// Templates on mobile. There's deliberately no separate builder here: a
// template is created the same way any schedule is, from the mobile app,
// signed in as an admin, with "Save as a template for everyone" checked.
// This page is just for reviewing and managing what's already been made.

import { useState, useEffect, useCallback } from "react";

type Template = {
  id: string; title: string; scheduleType: string; language: string; gender: string;
  updatedAt: string; creatorEmail: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily", mini: "My Schedule", firstthen: "First / Then", iwant: "I Want",
  weekly: "Weekly", custom: "Custom", timetable: "Timetable",
};

function timeAgo(dateStr: string) {
  // SQLite's datetime('now') returns UTC as "YYYY-MM-DD HH:MM:SS" with no
  // timezone marker, so browsers parse it as LOCAL time. In IST (+5:30)
  // that made a just-saved schedule read as "5h ago". Normalise to ISO
  // with an explicit Z so it's correctly treated as UTC.
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr)
    ? dateStr
    : dateStr.replace(" ", "T") + "Z";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unlist = async (t: Template) => {
    if (!confirm(`Remove "${t.title}" from Templates? It stays as a normal schedule for whoever made it.`)) return;
    await fetch(`/api/admin/templates/${t.id}`, { method: "PATCH" });
    load();
  };

  const del = async (t: Template) => {
    if (!confirm(`Permanently delete "${t.title}"? This can't be undone.`)) return;
    await fetch(`/api/admin/templates/${t.id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-[860px]">
      <h1 className="font-serif text-[22px] text-ink mb-1">Templates</h1>
      <p className="text-[12px] text-ink-3 mb-5 max-w-[560px]">
        Default schedules shown to every user under Templates on mobile. To add one, open the
        mobile app signed in as an admin, build a schedule, and check &ldquo;Save as a template
        for everyone&rdquo; before saving.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-surface border border-border p-8 text-center">
          <p className="text-[13px] text-ink-2">No templates yet.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border">
          {templates.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-ink font-medium truncate">{t.title || "Untitled"}</div>
                <div className="text-[12px] text-ink-3 mt-0.5">
                  {TYPE_LABELS[t.scheduleType] || t.scheduleType} · {t.language} ·{" "}
                  {t.creatorEmail ? `by ${t.creatorEmail}` : "unknown creator"} · edited {timeAgo(t.updatedAt)}
                </div>
              </div>
              <button
                onClick={() => unlist(t)}
                className="text-[11px] tracking-wider uppercase px-3 py-2 border border-border text-ink-2 font-medium hover:border-ink hover:text-ink transition-all shrink-0"
              >
                Remove
              </button>
              <button
                onClick={() => del(t)}
                className="text-[11px] tracking-wider uppercase px-3 py-2 text-ink-3 font-medium hover:text-[#C53030] transition-all shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
