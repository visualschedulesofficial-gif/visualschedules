@import url('https://fonts.googleapis.com/css2?family=Playwrite+DE+Grund:wght@400&family=Inter:wght@400;500;600;700&display=swap');
@import "tailwindcss";

/* ── Design Tokens ── */
:root {
  --ink: #1C1B19;
  --ink-2: #5C5855;
  --ink-3: #6B6560;
  --accent: #8B5E2A;
  --accent-hover: #7A5224;
  --green: #2D6A2D;
  --border: #DDD9D0;
  --bg: #EDEADE;
  --bg-muted: #E8E4DC;
  --card: #FDFCFA;
  --surface: #FFFFFF;
  --surface-hover: #F8F7F4;
  --surface-pressed: #F5F2EE;
  --overlay: rgba(28, 27, 25, 0.55);

  --weekly-border: #C5D2B8;
  --weekly-head-bg: #E8EDE0;
  --weekly-head-text: #4A5A3E;
  --weekly-body-bg: #FAFBF7;
  --weekly-hover: #EFF2E8;
  --weekly-accent: #7A8F5E;

  --badge-free-bg: #EAF5EA;
  --badge-free-text: #2D6A2D;
  --badge-paid-bg: #FFF5EA;
  --badge-paid-text: #8B5E2A;

  /* Accent green family — one edit here now reaches every button, active
     state, and highlight across the whole app instead of hunting through
     individual component files. */
  --accent-soft: #EAF1E2;      /* light fill: soft buttons, community banner */
  --accent-strong: #4A5A3E;    /* solid fill: primary buttons, active pills */
  --accent-strong-hover: #6A7F4E;
  --input-border: #C9C4BB;     /* every text input / select border */
  --success: #4A8A4A;          /* placed checkmarks, success ticks */

  /* Dark header (TopNav) — its own small palette since it sits on a dark
     background, unlike the rest of the light-background app. */
  --nav-bg: #3E4A32;
  --nav-border: #33402A;
  --nav-active: #B7CE9E;
  --nav-muted: #C3D3AC;

  --font-serif: 'Playwrite DE Grund', Georgia, cursive;
  --font-sans: 'Inter', system-ui, sans-serif;

  color-scheme: light;
}

/* ── Tailwind Theme ── */
@theme inline {
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-ink-3: var(--ink-3);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-green: var(--green);
  --color-border: var(--border);
  --color-bg: var(--bg);
  --color-bg-muted: var(--bg-muted);
  --color-card: var(--card);
  --color-surface: var(--surface);
  --color-surface-hover: var(--surface-hover);
  --color-surface-pressed: var(--surface-pressed);

  --color-weekly-border: var(--weekly-border);
  --color-weekly-head-bg: var(--weekly-head-bg);
  --color-weekly-head-text: var(--weekly-head-text);
  --color-weekly-body-bg: var(--weekly-body-bg);
  --color-weekly-hover: var(--weekly-hover);
  --color-weekly-accent: var(--weekly-accent);

  --color-badge-free-bg: var(--badge-free-bg);
  --color-badge-free-text: var(--badge-free-text);
  --color-badge-paid-bg: var(--badge-paid-bg);
  --color-badge-paid-text: var(--badge-paid-text);

  --color-accent-soft: var(--accent-soft);
  --color-accent-strong: var(--accent-strong);
  --color-accent-strong-hover: var(--accent-strong-hover);
  --color-input-border: var(--input-border);
  --color-success: var(--success);

  --color-nav-bg: var(--nav-bg);
  --color-nav-border: var(--nav-border);
  --color-nav-active: var(--nav-active);
  --color-nav-muted: var(--nav-muted);

  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
}

/* ── Base Styles ── */
html {
  height: 100%;
  font-size: 14px;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: #1C1B19;
  font-weight: 400;
}

@layer base {
  select, input, textarea, button {
    color-scheme: light;
    font-family: inherit;
    font-size: inherit;
  }
}

/* ── Focus — WCAG 2.4.7 ── */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── Mobile Scale ── */
@media (max-width: 768px) {
  :root { --mobile-scale: 0.45; }
}
@media (min-width: 481px) and (max-width: 768px) {
  :root { --mobile-scale: 0.55; }
}

.safe-area-bottom {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}

/* ── Animations ── */
@keyframes cardLand {
  0%   { transform: scale(0.85); opacity: 0.3; }
  50%  { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}

/* ── Print ── */
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #FFFFFF !important;
  }
}


/* Blog post typography */
.blog-content h2 { font-family: var(--font-serif); font-size: 22px; color: #2C2C2C; margin: 1.6em 0 0.5em; }
.blog-content h3 { font-family: var(--font-serif); font-size: 18px; color: #2C2C2C; margin: 1.4em 0 0.4em; }
.blog-content p { margin: 0.8em 0; }
.blog-content ul { margin: 0.8em 0; padding-left: 1.4em; list-style: disc; }
.blog-content li { margin: 0.3em 0; }
.blog-content a { color: #4A5A3E; text-decoration: underline; }
.blog-content img { max-width: 100%; border-radius: 6px; margin: 1em 0; }
.blog-content strong { color: #2C2C2C; }
