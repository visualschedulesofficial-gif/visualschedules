# Visual Schedules — Project Conventions

## What This Is

A Next.js SaaS app for creating visual schedules for special needs children.
Deployed on Cloudflare Pages with D1 (SQL) and R2 (object storage).

Product: https://visualschedule.app
Brand: Grow Gently

## Architecture

- **Framework:** Next.js 16 (App Router) on Cloudflare via `@opennextjs/cloudflare`
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Storage:** Cloudflare R2 for images (cards, thumbnails, avatars)
- **Auth:** Better Auth with magic link (passwordless)
- **State:** Zustand (schedule editor state)
- **DnD:** @dnd-kit/core + @dnd-kit/sortable
- **CSS:** Tailwind CSS 4 with custom theme from `design.md` tokens
- **Payments:** Gumroad license key verification

## Rendering Strategy

| Route Pattern | Rendering | Reason |
|--------------|-----------|--------|
| `/` (landing) | SSG | Static marketing page |
| `/login`, `/verify` | SSR | Session-aware redirects |
| `/schedules` | SSR | Personalized list from D1 |
| `/schedule`, `/schedule/[id]` | CSR | Heavy interactivity (DnD, canvas) |
| `/admin/*` | SSR | Data tables, role-gated |
| `/api/*` | Edge | D1/R2 bindings |

## Directory Structure

```
src/
├── app/            # Routes (pages + API)
├── components/
│   ├── ui/         # Primitives: Button, Input, Modal, Select, Toast
│   ├── schedule/   # Schedule builder: Canvas, Grids, DropZone, PlacedCard
│   ├── layout/     # AppShell, Sidebar, MobileDrawer, A11yBar
│   └── admin/      # Admin-specific components
├── lib/
│   ├── db/         # Drizzle schema + named query functions
│   ├── r2/         # R2 upload/fetch helpers
│   ├── auth/       # Better Auth configuration
│   ├── gumroad/    # License verification
│   ├── email/      # Magic link email sending
│   └── constants.ts
├── hooks/          # React hooks (useScheduleState, useDragDrop, etc.)
└── types/          # TypeScript type definitions
```

## Conventions

### Naming

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Components: Named exports, not default exports
- Database queries: `src/lib/db/queries/{entity}.ts` — one file per entity
- Types: `src/types/{entity}.ts`

### Components

- All UI primitives in `src/components/ui/` — reuse before creating new ones
- Schedule components are client components (`"use client"`)
- Admin and layout components can be server components where possible
- No prop drilling beyond 2 levels — use Zustand or context

### Styling

- Use Tailwind utility classes. Design tokens defined in `design.md` and mapped in `globals.css`
- No inline style objects except for A4 page dimensions (pixel-precise print layout)
- Responsive: mobile-first, breakpoints at 480px and 900px
- Dark mode: NOT supported — this is a light-only app (warm/earthy palette)

### Data

- Schedule placed-card data stored as JSON blob in D1 `schedules.data` column
- Card translations are normalized: `card_translations` table with (card_id, lang, label)
- Card images stored in R2 at `cards/{card_id}/{variant}.webp`
- Never embed base64 images in code — always reference R2 URLs

### Auth

- Magic link only (no passwords, no OAuth)
- Session cookie-based, 30-day expiry
- Admin role: `users.role = 'admin'`
- Protect routes with middleware or server-side session check
- API routes: validate session, return 401 if missing

### Performance

- Card images: WebP format, served via R2 custom domain with immutable cache
- Card data API: edge-cached with `Cache-Control: public, s-maxage=3600`
- Schedule builder: all state changes are client-side (Zustand), save debounced to API
- Lazy load non-critical components (modals, export, admin)

## Critical Constants

```typescript
// A4 at 96 DPI
const A4_PORTRAIT = { width: 794, height: 1123 };
const A4_LANDSCAPE = { width: 1123, height: 794 };

// Grid specs for Daily schedule
const GRID_SPECS = {
  2: { cols: 2, cellW: 345, cellH: 282, rows: 3, slots: 6 },
  3: { cols: 3, cellW: 227, cellH: 186, rows: 4, slots: 12 },
  4: { cols: 4, cellW: 168, cellH: 137, rows: 6, slots: 24 },
};

// Limits
const MAX_WEEKLY_CARDS = 5;   // per day per page
const MAX_CUSTOM_CARDS = 6;   // per column per page
const MAX_FT_CARDS = 1;       // per column (first-then)
const FREE_SCHEDULE_LIMIT = 3; // free tier max saved schedules
```

## What NOT To Do

- Do NOT add dark mode or color scheme switching
- Do NOT change font families (Playfair Display + Atkinson Hyperlegible are accessibility choices)
- Do NOT use `rem` for A4 page internals (they must be pixel-precise for print)
- Do NOT normalize schedule data into separate tables (JSON blob is intentional)
- Do NOT add password auth or OAuth (magic link only)
- Do NOT use `@cloudflare/next-on-pages` (use `@opennextjs/cloudflare` instead)
- Do NOT store images as base64 (legacy approach — always use R2)
- Do NOT add comments explaining WHAT code does — only WHY when non-obvious

## Testing

- Component tests: Vitest + React Testing Library
- E2E: Playwright (test schedule creation flow, export, auth)
- API: Vitest with miniflare for D1/R2 mocks
- Visual regression: optional (Chromatic or Percy)

## Deployment

```bash
# Local dev
npm run dev                    # Next.js dev server
npx wrangler d1 migrations apply visual-schedules-db --local  # Local D1

# Build for Cloudflare
npx opennextjs-cloudflare      # Builds .worker output
npx wrangler pages deploy      # Deploy to Cloudflare Pages

# Database migrations
npx drizzle-kit generate       # Generate migration SQL
npx wrangler d1 migrations apply visual-schedules-db  # Apply to remote
```

## Environment Variables

```
# .dev.vars (local development)
CLOUDFLARE_D1_BINDING=DB
CLOUDFLARE_R2_BINDING=ASSETS
R2_PUBLIC_URL=https://assets.visualschedule.app
BETTER_AUTH_SECRET=<random-32-char>
BETTER_AUTH_URL=http://localhost:3000
GUMROAD_PRODUCT_PERMALINK=<gumroad-product-id>
RESEND_API_KEY=<for-magic-link-emails>
```
