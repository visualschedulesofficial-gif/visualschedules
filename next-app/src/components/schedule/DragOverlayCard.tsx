"use client";

interface DragOverlayCardProps {
  label: string;
}

export function DragOverlayCard({ label }: DragOverlayCardProps) {
  return (
    <div className="w-[90px] bg-white border border-accent/80 rounded shadow-[0_16px_32px_rgba(0,0,0,0.18),0_4px_12px_rgba(139,94,42,0.2)] pointer-events-none rotate-[3deg]">
      <div className="w-full aspect-square bg-white flex items-center justify-center rounded-t">
        <svg
          className="w-6 h-6 stroke-accent/70 stroke-[1.5] fill-none"
          viewBox="0 0 24 24"
          strokeLinecap="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div className="px-1 py-1 bg-white border-t border-accent/20 text-[12px] text-ink text-center leading-tight font-sans font-medium rounded-b">
        {label}
      </div>
    </div>
  );
}
