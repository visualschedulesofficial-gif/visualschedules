"use client";

// Floating "join us" icons, bottom-right of the builder. A soft ripple runs
// now and then so parents notice them without it being noisy.

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.465 3.488";
const YT_PATH = "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z";
const IG_PATH = "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z";
const PIN_PATH = "M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.379-.293 1.194-.333 1.361-.052.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z";

const LINKS = [
  {
    href: "https://chat.whatsapp.com/F452loR5KUE5RzcffScGw5",
    label: "WhatsApp community",
    tile: "bg-[#25D366]",
    icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="#fff"><path d={WA_PATH} /></svg>,
  },
  {
    href: "https://www.youtube.com/@VisualSchedulesOfficial",
    label: "YouTube",
    tile: "bg-[#FF0000]",
    icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="#fff"><path d={YT_PATH} /></svg>,
  },
  {
    href: "https://www.instagram.com/visual_schedule_official/",
    label: "Instagram",
    tile: "bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]",
    icon: <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="#fff"><path d={IG_PATH} /></svg>,
  },
  {
    href: "https://in.pinterest.com/visualschedulesofficial/_profile/",
    label: "Pinterest",
    tile: "bg-white",
    icon: <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill="#E60023"><path d={PIN_PATH} /></svg>,
  },
  {
    href: "mailto:visualschedulesofficial@gmail.com",
    label: "Email visualschedulesofficial@gmail.com",
    tile: "bg-white",
    icon: (
      <svg viewBox="0 0 24 18" className="w-[24px] h-[18px]">
        <path fill="#4285F4" d="M1.6 18h3.8V8.7L0 4.6v11.8C0 17.3.7 18 1.6 18z" />
        <path fill="#34A853" d="M18.6 18h3.8c.9 0 1.6-.7 1.6-1.6V4.6l-5.4 4.1z" />
        <path fill="#FBBC04" d="M18.6 1.6v7.1L24 4.6V2.4c0-2-2.3-3.1-3.8-1.9z" />
        <path fill="#EA4335" d="M5.4 8.7V1.6L12 6.5l6.6-4.9v7.1L12 13.6z" />
        <path fill="#C5221F" d="M0 2.4v2.2l5.4 4.1V1.6L3.8.5C2.3-.7 0 .4 0 2.4z" />
      </svg>
    ),
  },
];

export function SocialDock() {
  return (
    <div className="vs-dock group fixed right-4 bottom-4 z-[80] hidden md:flex flex-col items-end gap-2">
      <span
        role="tooltip"
        className="pointer-events-none absolute right-[calc(100%+12px)] top-[70px] whitespace-nowrap rounded-xl bg-ink text-white text-[13px] font-semibold px-3.5 py-2 shadow-lg opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0"
      >
        Join us for free updates and resources
        <span className="absolute top-1/2 -right-[5px] -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-ink" />
      </span>
      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {LINKS.map((l, i) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={l.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              aria-label={l.label}
              title={l.label}
              style={{ ["--d" as string]: `${i * 0.18}s` }}
              className={`vs-ripple relative w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shadow-[0_3px_10px_rgba(30,42,36,0.18)] border border-black/5 transition-transform duration-150 hover:scale-110 hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-weekly-accent ${l.tile}`}
            >
              {l.icon}
            </a>
          </li>
        ))}
      </ul>
      <span className="text-[11px] text-ink-3 pr-0.5">
        With thanks to{" "}
        <a href="https://dataorc.in" target="_blank" rel="noopener noreferrer" className="underline text-ink-2 hover:text-ink">DataOrc</a>
      </span>
    </div>
  );
}
