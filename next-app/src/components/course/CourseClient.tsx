"use client";

import { useEffect, useState } from "react";
import { youTubeId, type Course } from "@/lib/course";

const DONE_KEY = "vs_course_done";

export function CourseClient({ course, preview }: { course: Course; preview?: boolean }) {
  const chapters = course.chapters.filter((c) => youTubeId(c.youtubeUrl));
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); } catch {}
    const n = Number(new URLSearchParams(window.location.search).get("ch"));
    if (n >= 1 && n <= chapters.length) setIdx(n - 1);
  }, [chapters.length]);

  const go = (i: number) => {
    setIdx(i);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("ch", String(i + 1));
      window.history.replaceState(null, "", u);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleDone = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (!chapters.length) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-[28px] text-ink m-0">{course.title}</h1>
          <p className="text-ink-2 mt-3">Video chapters are coming soon. Follow us on YouTube or join the WhatsApp community to hear when they go live.</p>
          <a href="https://www.youtube.com/@VisualSchedulesOfficial" target="_blank" rel="noopener noreferrer" className="inline-flex mt-5 h-11 px-5 rounded-xl bg-accent-strong text-white font-bold items-center no-underline hover:bg-accent-hover">
            Visit our YouTube
          </a>
        </div>
      </main>
    );
  }

  const ch = chapters[Math.min(idx, chapters.length - 1)];
  const vid = youTubeId(ch.youtubeUrl)!;
  const doneCount = chapters.filter((c) => done.includes(c.id)).length;
  const isDone = done.includes(ch.id);

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 py-5 md:py-7">
      {preview && (
        <p className="mb-4 text-[13px] rounded-lg bg-[#FFF7E8] border border-[#F1DDB6] text-[#7A5213] px-3 py-2">
          Preview: this course isn&apos;t published yet. Only admins can see it.
        </p>
      )}
      <header className="mb-4 md:mb-5">
        <h1 className="font-serif text-[26px] md:text-[32px] text-ink m-0 leading-tight">{course.title}</h1>
        {course.intro && <p className="text-ink-2 text-[15px] mt-2 max-w-[760px] whitespace-pre-line">{course.intro}</p>}
      </header>

      <div className="grid gap-5 md:gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section className="min-w-0">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-[0_8px_30px_rgba(30,42,36,0.15)]">
            <iframe
              key={vid}
              src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`}
              title={ch.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-bold tracking-[.07em] uppercase text-ink-3 m-0">Chapter {idx + 1} of {chapters.length}</p>
              <h2 className="text-[20px] md:text-[22px] font-bold text-ink m-0 mt-1">{ch.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => toggleDone(ch.id)}
              aria-pressed={isDone}
              className={`h-10 px-4 rounded-xl border-[1.5px] text-[14px] font-semibold flex items-center gap-2 ${isDone ? "bg-accent-soft border-accent-strong text-accent-strong" : "bg-white border-input-border text-ink hover:bg-surface-hover"}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${isDone ? "bg-accent-strong text-white" : "border-2 border-[#C5CDBF]"}`}>{isDone ? "✓" : ""}</span>
              {isDone ? "Watched" : "Mark as watched"}
            </button>
          </div>
          {ch.description && <p className="text-ink-2 text-[15px] leading-relaxed mt-3 whitespace-pre-line">{ch.description}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" disabled={idx === 0} onClick={() => go(idx - 1)} className="h-11 px-4 rounded-xl border-[1.5px] border-input-border bg-white text-ink font-semibold hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed">
              ← Previous
            </button>
            <button type="button" disabled={idx >= chapters.length - 1} onClick={() => { if (!isDone) toggleDone(ch.id); go(idx + 1); }} className="h-11 px-5 rounded-xl bg-accent-strong text-white font-bold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed">
              Next chapter →
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-white overflow-hidden lg:sticky lg:top-4">
          <div className="px-4 py-3 border-b border-border">
            <p className="m-0 font-bold text-ink text-[15px]">Chapters</p>
            <div className="mt-2 h-1.5 rounded-full bg-[#EDF1EA] overflow-hidden">
              <div className="h-full bg-accent-strong rounded-full transition-[width] duration-300" style={{ width: `${(doneCount / chapters.length) * 100}%` }} />
            </div>
            <p className="m-0 mt-1.5 text-[12px] text-ink-3">{doneCount} of {chapters.length} watched</p>
          </div>
          <ol className="m-0 p-1.5 list-none max-h-[60vh] overflow-y-auto">
            {chapters.map((c, i) => {
              const on = i === idx;
              const cid = youTubeId(c.youtubeUrl)!;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={on ? "true" : undefined}
                    className={`w-full text-left flex gap-3 p-2 rounded-xl ${on ? "bg-accent-soft" : "hover:bg-surface-hover"}`}
                  >
                    <span className="relative w-[96px] aspect-video shrink-0 rounded-lg overflow-hidden bg-[#E8ECE4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${cid}/mqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
                      {done.includes(c.id) && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent-strong text-white text-[11px] flex items-center justify-center">✓</span>}
                      {c.duration && <span className="absolute bottom-1 right-1 rounded bg-black/75 text-white text-[10px] px-1">{c.duration}</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold text-ink-3">{i + 1}</span>
                      <span className={`block text-[14px] leading-snug line-clamp-2 ${on ? "font-bold text-ink" : "font-semibold text-ink-2"}`}>{c.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </main>
  );
}
