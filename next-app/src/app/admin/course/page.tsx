"use client";

import { useEffect, useState } from "react";
import { EMPTY_COURSE, youTubeId, type Chapter, type Course } from "@/lib/course";

const input = "w-full px-3 py-2 border border-border text-[13px] bg-white";
const label = "text-[12px] text-ink-3 block mb-1";

export default function AdminCoursePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/course")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCourse(d?.course || EMPTY_COURSE))
      .catch(() => setCourse(EMPTY_COURSE));
  }, []);

  if (!course) return <div className="p-6 text-[13px] text-ink-3">Loading…</div>;

  const update = (patch: Partial<Course>) => { setCourse({ ...course, ...patch }); setDirty(true); setMessage(""); };
  const setChapter = (i: number, patch: Partial<Chapter>) =>
    update({ chapters: course.chapters.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= course.chapters.length) return;
    const next = [...course.chapters];
    [next[i], next[j]] = [next[j], next[i]];
    update({ chapters: next });
  };
  const addChapter = () =>
    update({ chapters: [...course.chapters, { id: crypto.randomUUID(), title: "", youtubeUrl: "", description: "", duration: "" }] });
  const removeChapter = (i: number) => {
    if (!confirm(`Remove chapter ${i + 1}?`)) return;
    update({ chapters: course.chapters.filter((_, j) => j !== i) });
  };

  const save = async (publish?: boolean) => {
    const next = publish === undefined ? course : { ...course, published: publish };
    const bad = next.chapters.findIndex((c) => !c.title.trim() || !youTubeId(c.youtubeUrl));
    if (bad >= 0) { setMessage(`Chapter ${bad + 1} needs a title and a valid YouTube link.`); return; }
    setBusy(true);
    const res = await fetch("/api/admin/course", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course: next }),
    });
    const d = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok) {
      setCourse(next);
      setDirty(false);
      setMessage(next.published ? "Saved. Live at /course" : "Saved as draft. Only admins can see /course.");
    } else {
      setMessage(d?.error || "Save failed.");
    }
  };

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">
          Course{" "}
          <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${course.published ? "bg-[#E6F2E1] text-[#2E5A26]" : "bg-[#F1EFE8] text-ink-3"}`}>
            {course.published ? "Published" : "Draft"}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <a href="/course" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-border text-[12px] text-ink no-underline">View page</a>
          <button onClick={() => save()} disabled={busy || !dirty} className="px-3 py-1.5 border border-border text-[12px] disabled:opacity-50">Save</button>
          <button onClick={() => save(!course.published)} disabled={busy} className="px-3 py-1.5 bg-[#4A5A3E] text-white text-[12px] disabled:opacity-50">
            {course.published ? "Unpublish" : "Save & publish"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-[900px]">
        {message && <p className="text-[12px] text-ink-2 bg-card border border-border px-3 py-2">{message}</p>}

        <div className="bg-card border border-border p-4 space-y-3">
          <div>
            <label className={label}>Course title</label>
            <input value={course.title} onChange={(e) => update({ title: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label}>Intro (shown under the title)</label>
            <textarea value={course.intro} onChange={(e) => update({ intro: e.target.value })} rows={3} className={input} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[13px] text-ink font-semibold m-0">Chapters ({course.chapters.length})</p>
          <button onClick={addChapter} className="px-3 py-1.5 bg-[#4A5A3E] text-white text-[12px]">+ Add chapter</button>
        </div>

        {course.chapters.length === 0 && (
          <p className="text-[13px] text-ink-3 bg-card border border-dashed border-border p-6 text-center">
            No chapters yet. Add one and paste its YouTube link.
          </p>
        )}

        {course.chapters.map((c, i) => {
          const vid = youTubeId(c.youtubeUrl);
          return (
            <div key={c.id} className="bg-card border border-border p-4 flex gap-4">
              <div className="w-[160px] shrink-0">
                <div className="aspect-video bg-[#EDEBE5] flex items-center justify-center overflow-hidden">
                  {vid ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-ink-3 px-2 text-center">Paste a YouTube link</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[12px] text-ink-3 mr-auto">Chapter {i + 1}</span>
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="w-7 h-7 border border-border text-[12px] disabled:opacity-30">↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === course.chapters.length - 1} aria-label="Move down" className="w-7 h-7 border border-border text-[12px] disabled:opacity-30">↓</button>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input value={c.title} onChange={(e) => setChapter(i, { title: e.target.value })} placeholder="Chapter title" className={`${input} font-semibold`} />
                <div className="flex gap-2">
                  <input value={c.youtubeUrl} onChange={(e) => setChapter(i, { youtubeUrl: e.target.value })} placeholder="https://youtu.be/… or youtube.com/watch?v=…"
                    className={`${input} ${c.youtubeUrl && !vid ? "border-[#B05555]" : ""}`} />
                  <input value={c.duration || ""} onChange={(e) => setChapter(i, { duration: e.target.value })} placeholder="5:30" aria-label="Duration" className="w-[80px] px-2 py-2 border border-border text-[13px] bg-white" />
                </div>
                <textarea value={c.description || ""} onChange={(e) => setChapter(i, { description: e.target.value })} rows={2} placeholder="What this chapter covers (optional)" className={input} />
                <button onClick={() => removeChapter(i)} className="text-[12px] text-[#B05555]">Remove chapter</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
