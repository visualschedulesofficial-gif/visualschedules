"use client";

import Link from "next/link";

interface TopNavProps {
  onToggleSidebar?: () => void;
  onToggleRightPanel?: () => void;
  showBuilderControls?: boolean;
}

export function TopNav({
  onToggleSidebar,
  onToggleRightPanel,
  showBuilderControls = false,
}: TopNavProps) {
  return (
    <nav className="h-[56px] bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 gap-3 relative md:h-[66px] md:px-7 md:gap-5">
      {showBuilderControls && (
        <button
          className="flex md:hidden flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2 shrink-0 -ml-2"
          onClick={onToggleSidebar}
          aria-label="Card library"
        >
          <span className="block w-5 h-0.5 bg-ink rounded-sm" />
          <span className="block w-5 h-0.5 bg-ink rounded-sm" />
          <span className="block w-5 h-0.5 bg-ink rounded-sm" />
        </button>
      )}

      <Link
        href="/"
        className="font-serif text-base md:text-2xl italic text-ink no-underline whitespace-nowrap shrink-0 leading-none"
      >
        Visual Schedules
      </Link>

      <div className="hidden md:flex items-center gap-1.5 shrink-0">
        <Link
          href="/schedules"
          className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline flex items-center gap-1.5 whitespace-nowrap transition-all font-medium font-sans hover:border-ink hover:text-ink"
        >
          My Schedules
        </Link>
        <Link
          href="/schedule"
          className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] bg-ink text-white border border-ink no-underline flex items-center gap-1.5 whitespace-nowrap transition-all font-medium font-sans hover:bg-[#333]"
        >
          New Schedule
        </Link>
      </div>

      {showBuilderControls && (
        <button
          className="flex md:hidden items-center justify-center bg-transparent border-none cursor-pointer p-2 shrink-0 -mr-2"
          onClick={onToggleRightPanel}
          aria-label="Schedule settings"
        >
          <svg className="w-5 h-5 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      )}
    </nav>
  );
}
