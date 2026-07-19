"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";

const NAV_LINKS = [
  { href: "/schedule", label: "Create Schedule" },
  { href: "/downloads", label: "Downloads" },
  { href: "/blog", label: "Blog" },
];

interface User {
  id: string;
  email: string;
  role: string;
}

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
  const [user, setUser] = useState<User | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read session + subscription on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
        if (data.user) {
          // Check subscription status
          fetch("/api/user/subscription")
            .then((r) => r.json())
            .then((sub) => setHasSubscription(!!sub.subscription))
            .catch(() => setHasSubscription(false));
        }
      })
      .catch(() => setUser(null));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    setDropdownOpen(false);
    window.location.href = "/schedule";
  }

  // Initial letter for avatar
  const initial = user?.email?.[0]?.toUpperCase() || "?";

  return (
    <nav className="bg-nav-bg border-b border-nav-border flex shrink-0 relative z-50 max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:px-0 md:h-[66px] md:px-7 md:gap-5 md:items-center md:justify-between">

      {/* Left — mobile sidebar toggle (builder only) */}
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

      {/* Logo — desktop only; mobile gets the app icon bar instead */}
      <Link
        href="/schedule"
        className="hidden md:block font-serif text-2xl text-accent-soft no-underline whitespace-nowrap shrink-0 leading-none"
      >
        Visual Schedules
      </Link>

      {/* Mobile app-style icon bar */}
      <MobileIconBar user={user} />

      {/* Right — site nav + auth area (desktop only) */}
      <div className="hidden md:flex items-center gap-4 shrink-0 min-w-0">
        <SiteNavLinks />
        {!user ? (
          // Not logged in — single Sign In button
          <Link
            href="/login"
            className="text-[12px] tracking-wider uppercase px-4 py-[0.42rem] border border-[#8FA378] text-accent-soft no-underline font-medium font-sans hover:bg-accent-soft hover:text-nav-bg transition-all whitespace-nowrap"
          >
            Sign In
          </Link>
        ) : (
          // Logged in — avatar + dropdown
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent-strong transition-colors rounded-sm"
              aria-label="Account menu"
            >
              {/* Avatar circle */}
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[12px] font-semibold font-sans shrink-0">
                {initial}
              </div>
              {/* Email (desktop only) */}
              <span className="hidden md:block text-[12px] text-[#D8E3C8] font-sans max-w-[140px] truncate">
                {user.email}
              </span>
              {/* Chevron */}
              <svg
                className={`w-3.5 h-3.5 stroke-ink-2 stroke-2 fill-none transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface border border-border shadow-lg z-[200]">
                {/* Email header */}
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-[12px] tracking-wider uppercase text-ink-3 font-medium mb-0.5">Signed in as</p>
                  <p className="text-[12px] text-ink truncate font-sans">{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/schedules"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-ink no-underline hover:bg-surface-hover transition-colors font-sans"
                  >
                    <svg className="w-4 h-4 stroke-ink-2 stroke-[1.5] fill-none shrink-0" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    My Schedules
                  </Link>

                  <Link
                    href="/plans"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-ink no-underline hover:bg-surface-hover transition-colors font-sans"
                  >
                    <svg className="w-4 h-4 stroke-ink-2 stroke-[1.5] fill-none shrink-0" viewBox="0 0 24 24">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    {hasSubscription ? "My Plan" : "Buy Plans"}
                  </Link>
                </div>

                {/* Divider + Logout */}
                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-[#C53030] hover:bg-[#FEF0F0] transition-colors font-sans text-left"
                  >
                    <svg className="w-4 h-4 stroke-[#C53030] stroke-[1.5] fill-none shrink-0" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right — mobile right panel toggle (builder only) */}
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


function SiteNavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-3 min-w-0">
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href || (link.href !== "/schedule" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative text-[14px] px-1 py-1 no-underline font-bold font-sans whitespace-nowrap tracking-tight transition-colors after:content-[""] after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[3px] after:rounded-full after:transition-all ${
              active
                ? "text-white after:bg-nav-active"
                : "text-nav-muted hover:text-accent-soft after:bg-transparent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}


// Two-level app header (mobile): brand + search on top, tab row beneath.
// Search only appears on the builder and feeds the card search directly.
function MobileIconBar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const uiSearch = useScheduleState((s) => s.uiSearch);
  const setUiSearch = useScheduleState((s) => s.setUiSearch);
  const [searchOpen, setSearchOpen] = useState(false);
  const onBuilder = pathname === "/schedule";

  const tabs = [
    { href: "/schedule", label: "Create", active: pathname === "/schedule" },
    { href: "/downloads", label: "Downloads", active: pathname?.startsWith("/downloads") || false },
    { href: "/blog", label: "Blog", active: pathname?.startsWith("/blog") || false },
    user
      ? { href: "/schedules", label: "My Space", active: pathname === "/schedules" }
      : { href: "/login", label: "Sign in", active: pathname === "/login" },
  ];

  return (
    <div className="flex md:hidden flex-col w-full bg-nav-bg">
      {/* Level 1 — brand + search */}
      <div className="flex items-center justify-between h-[46px] px-4">
        {searchOpen ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              autoFocus
              type="search"
              value={uiSearch}
              onChange={(e) => setUiSearch(e.target.value)}
              placeholder="Search cards…"
              className="flex-1 min-w-0 py-1.5 px-3 border border-border bg-white font-sans text-[15px] text-ink rounded-full"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setUiSearch("");
              }}
              className="shrink-0 w-9 h-9 flex items-center justify-center text-[18px] text-[#D8E3C8]"
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <Link href="/schedule" className="font-serif text-[18px] text-accent-soft no-underline leading-none">
              Visual Schedules
            </Link>
            {onBuilder && (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 -mr-2 flex items-center justify-center text-accent-soft"
                aria-label="Search cards"
              >
                <svg className="w-[21px] h-[21px] stroke-current stroke-[2] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      {/* Level 2 — tabs */}
      <div className="flex items-stretch gap-1 px-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 pt-1.5 pb-2 text-[16px] font-sans font-bold no-underline whitespace-nowrap tracking-tight border-b-[3px] rounded-t-[2px] transition-colors ${
              t.active
                ? "text-white border-nav-active"
                : "text-nav-muted border-transparent"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
