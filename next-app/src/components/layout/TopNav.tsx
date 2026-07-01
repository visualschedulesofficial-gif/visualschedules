"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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
    <nav className="h-[56px] bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 gap-3 relative md:h-[66px] md:px-7 md:gap-5 z-50">

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

      {/* Logo */}
      <Link
        href="/schedule"
        className="font-serif text-base md:text-2xl text-ink no-underline whitespace-nowrap shrink-0 leading-none"
      >
        Visual Schedules
      </Link>

      {/* Right — auth area */}
      <div className="flex items-center gap-2 shrink-0">
        {!user ? (
          // Not logged in — single Sign In button
          <Link
            href="/login"
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all whitespace-nowrap"
          >
            Sign In
          </Link>
        ) : (
          // Logged in — avatar + dropdown
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-hover transition-colors rounded-sm"
              aria-label="Account menu"
            >
              {/* Avatar circle */}
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[12px] font-semibold font-sans shrink-0">
                {initial}
              </div>
              {/* Email (desktop only) */}
              <span className="hidden md:block text-[12px] text-ink-2 font-sans max-w-[140px] truncate">
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
                  <p className="text-[10px] tracking-wider uppercase text-ink-3 font-medium mb-0.5">Signed in as</p>
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
