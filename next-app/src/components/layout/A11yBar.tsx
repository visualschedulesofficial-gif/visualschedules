"use client";

import { useState, useCallback } from "react";

export function A11yBar() {
  const [zoom, setZoom] = useState(100);

  const applyZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(80, Math.min(140, newZoom));
    setZoom(clamped);
    document.documentElement.style.fontSize = `${(14 * clamped) / 100}px`;
    if (typeof window !== "undefined") {
      localStorage.setItem("vs_a11y_zoom", String(clamped));
    }
  }, []);

  return (
    <div className="bg-ink text-white shrink-0 px-5 py-1.5" role="region" aria-label="Accessibility options">
      <div className="flex items-center gap-5 flex-wrap">
        <a
          className="flex items-center gap-1.5 text-white no-underline text-xs hover:text-[#F5F2EC] hover:underline"
          href="mailto:visualschedulesofficial@gmail.com"
          aria-label="Email us for accessibility help"
        >
          <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
          <span>Accessibility help</span>
        </a>

        <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
          <span className="text-[11px] tracking-wider uppercase text-[#C9C5BE] hidden sm:inline">
            Text size
          </span>
          <button
            type="button"
            className="bg-white/10 border border-white/30 text-white w-[26px] h-[22px] rounded-sm text-xs flex items-center justify-center hover:bg-white/25"
            onClick={() => applyZoom(zoom - 10)}
            aria-label="Decrease text size"
          >
            A&minus;
          </button>
          <button
            type="button"
            className="text-[11px] text-white min-w-[36px] text-center hover:underline"
            onClick={() => applyZoom(100)}
            aria-label="Reset text size"
          >
            {zoom}%
          </button>
          <button
            type="button"
            className="bg-white/10 border border-white/30 text-white w-[26px] h-[22px] rounded-sm text-xs flex items-center justify-center hover:bg-white/25"
            onClick={() => applyZoom(zoom + 10)}
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 text-white text-xs hover:text-[#F5F2EC] hover:underline bg-transparent border-none cursor-pointer"
          aria-label="Jump to language selector"
        >
          <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="hidden sm:inline">Language</span>
        </button>
      </div>
    </div>
  );
}
