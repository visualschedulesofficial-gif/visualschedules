import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="h-[66px] bg-surface border-b border-border flex items-center justify-between px-7 shrink-0 max-md:px-4 max-md:h-[56px]">
        <span className="font-serif text-2xl italic text-ink leading-none max-[480px]:text-base">
          Visual Schedules
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            Log In
          </Link>
          <Link
            href="/schedule"
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all"
          >
            Create Schedule
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl italic text-ink mb-4 leading-tight md:text-5xl">
          Visual schedules that help children thrive
        </h1>
        <p className="text-ink-2 text-base leading-relaxed mb-8 max-w-lg">
          Create beautiful, print-ready visual schedules for children with autism,
          ADHD, and other special needs. Drag-and-drop daily routines, weekly
          planners, and custom visual flows — in 25+ languages.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/schedule"
            className="text-[11px] tracking-wider uppercase px-8 py-3 bg-accent text-white border border-accent no-underline font-medium font-sans hover:bg-accent-hover transition-all"
          >
            Start Creating — Free
          </Link>
          <Link
            href="#features"
            className="text-[11px] tracking-wider uppercase px-8 py-3 border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            See How It Works
          </Link>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="bg-surface border-t border-border py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl italic text-ink text-center mb-10">
            Designed for families, therapists, and educators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-badge-free-bg flex items-center justify-center">
                <svg className="w-5 h-5 stroke-green stroke-2 fill-none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-ink mb-1.5">4 Schedule Types</h3>
              <p className="text-xs text-ink-2 leading-relaxed">
                Daily grids, weekly planners, custom columns, and First-Then boards
                for behavioral support.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-badge-paid-bg flex items-center justify-center">
                <svg className="w-5 h-5 stroke-accent stroke-2 fill-none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-ink mb-1.5">25+ Languages</h3>
              <p className="text-xs text-ink-2 leading-relaxed">
                Hindi, Tamil, Arabic, Spanish, French, and more. Bilingual mode
                available for dual-language households.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#EEF0FA] flex items-center justify-center">
                <svg className="w-5 h-5 stroke-ink-2 stroke-2 fill-none" viewBox="0 0 24 24">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-ink mb-1.5">Print-Ready A4</h3>
              <p className="text-xs text-ink-2 leading-relaxed">
                Export pixel-perfect PDFs sized for A4 paper. Laminate and use at
                home, school, or therapy sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-[#9A9690] px-7 py-4 flex items-center justify-between gap-4 flex-wrap text-xs max-md:px-4">
        <span className="font-serif text-base italic text-[#F5F2EC]">
          Grow Gently
        </span>
        <div className="flex items-center gap-5">
          <a href="mailto:visualschedulesofficial@gmail.com" className="text-[#9A9690] no-underline hover:text-[#F5F2EC] transition-colors">
            Contact
          </a>
          <span className="text-[#3A3830]">|</span>
          <span>Made with care for every child</span>
        </div>
      </footer>
    </div>
  );
}
