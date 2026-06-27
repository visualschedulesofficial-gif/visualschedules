"use client";

import { useState, useCallback } from "react";
import { A11yBar } from "./A11yBar";
import { TopNav } from "./TopNav";
import { MobileDrawer } from "./MobileDrawer";

interface AppShellProps {
  sidebar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, rightPanel, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const closeAll = useCallback(() => {
    setSidebarOpen(false);
    setRightPanelOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <a
        href="#canvas-wrap"
        className="absolute -left-[9999px] top-0 bg-white text-ink px-4 py-2 text-[13px] font-semibold z-[1000] focus:left-2 focus:top-2"
      >
        Skip to schedule
      </a>

      <div className="hidden md:block">
        <A11yBar />
      </div>

      <TopNav
        showBuilderControls={!!(sidebar || rightPanel)}
        onToggleSidebar={() => {
          setRightPanelOpen(false);
          setSidebarOpen((v) => !v);
        }}
        onToggleRightPanel={() => {
          setSidebarOpen(false);
          setRightPanelOpen((v) => !v);
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
        {sidebar && (
          <aside className="w-[285px] shrink-0 bg-surface border-r border-border flex-col overflow-hidden hidden md:flex">
            {sidebar}
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        {sidebar && (
          <MobileDrawer open={sidebarOpen} onClose={closeAll} side="left">
            {sidebar}
          </MobileDrawer>
        )}

        {/* Main canvas area — scales A4 to fit on mobile */}
        <main
          id="canvas-wrap"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-bg-muted flex flex-col items-center p-5 gap-6 md:p-5 max-md:p-2 max-md:pb-[72px]"
        >
          <div className="max-md:w-full max-md:origin-top max-md:scale-[var(--mobile-scale,0.45)] max-md:min-w-[794px]">
            {children}
          </div>
        </main>

        {/* Desktop right panel */}
        {rightPanel && (
          <aside className="w-[270px] shrink-0 bg-surface border-l border-border flex-col overflow-y-auto hidden md:flex">
            {rightPanel}
          </aside>
        )}

        {/* Mobile right panel drawer */}
        {rightPanel && (
          <MobileDrawer open={rightPanelOpen} onClose={closeAll} side="right">
            {rightPanel}
          </MobileDrawer>
        )}
      </div>

      {/* Mobile bottom action bar */}
      {(sidebar || rightPanel) && (
        <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-3 py-2 gap-2 z-[200] items-center safe-area-bottom">
          <button
            className="flex-1 text-[11px] tracking-wider uppercase py-2.5 px-1 border border-border bg-transparent text-[#4A4540] font-medium font-sans flex items-center justify-center gap-1.5 active:bg-surface-hover rounded-sm"
            onClick={() => {
              setRightPanelOpen(false);
              setSidebarOpen((v) => !v);
            }}
          >
            <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            Cards
          </button>
          <button
            className="flex-1 text-[11px] tracking-wider uppercase py-2.5 px-1 bg-ink text-white border border-ink font-medium font-sans flex items-center justify-center gap-1.5 active:bg-[#333] rounded-sm"
            onClick={() => {
              setSidebarOpen(false);
              setRightPanelOpen((v) => !v);
            }}
          >
            <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
            </svg>
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
