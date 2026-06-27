import Link from "next/link";

export default function SchedulesListPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="h-[66px] bg-surface border-b border-border flex items-center justify-between px-7 shrink-0 max-md:px-4 max-md:h-[56px]">
        <Link
          href="/"
          className="font-serif text-2xl italic text-ink no-underline leading-none max-[480px]:text-base"
        >
          Visual Schedules
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/schedule"
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all"
          >
            New Schedule
          </Link>
        </div>
      </nav>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl italic text-ink">My Schedules</h1>
          <span className="text-xs text-ink-3">0 of 3 free schedules used</span>
        </div>

        {/* Empty state */}
        <div className="bg-surface border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg flex items-center justify-center">
            <svg className="w-7 h-7 stroke-ink-3 stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h2 className="text-sm font-medium text-ink mb-1.5">No schedules yet</h2>
          <p className="text-xs text-ink-2 leading-relaxed mb-5 max-w-xs mx-auto">
            Create your first visual schedule. Drag and drop activity cards to build
            daily routines, weekly planners, and more.
          </p>
          <Link
            href="/schedule"
            className="text-[11px] tracking-wider uppercase px-6 py-2.5 bg-accent text-white border border-accent no-underline font-medium font-sans hover:bg-accent-hover transition-all inline-block"
          >
            Create First Schedule
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-ink text-[#9A9690] px-7 py-4 flex items-center justify-between gap-4 flex-wrap text-xs mt-auto max-md:px-4">
        <span className="font-serif text-base italic text-[#F5F2EC]">
          Grow Gently
        </span>
        <span>Made with care for every child</span>
      </footer>
    </div>
  );
}
