"use client";

import { useEffect, useRef } from "react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  children: React.ReactNode;
}

export function MobileDrawer({ open, onClose, side, children }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-[rgba(28,27,25,0.45)] z-[299] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={drawerRef}
        className={`
          fixed top-[56px] bottom-[52px] w-[300px] max-w-[85vw] z-[300]
          bg-surface transition-transform duration-[250ms] ease-out
          md:hidden
          ${side === "left" ? "left-0 border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.14)]" : "right-0 border-l border-border shadow-[-4px_0_24px_rgba(0,0,0,0.14)]"}
          ${open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full"
          }
        `}
      >
        {children}
      </div>
    </>
  );
}
