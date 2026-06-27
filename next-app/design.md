# Visual Schedules — Design System

> Single source of truth for the visual language. Designers edit this file;
> developers sync changes to `tailwind.config.ts` and `src/app/globals.css`.

---

## 1. Color Primitives

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | `#1C1B19` | Primary text, headings, dark UI elements |
| `ink-2` | `#5C5855` | Secondary text, muted labels |
| `ink-3` | `#6B6560` | Tertiary text, placeholders |
| `accent` | `#8B5E2A` | Brand accent, CTAs, links, focus rings |
| `accent-hover` | `#7A5224` | Accent on hover/press |
| `green` | `#2D6A2D` | Success, free badge, positive states |
| `border` | `#DDD9D0` | Default borders, dividers |
| `bg` | `#EDEADE` | Page/app background (warm off-white) |
| `bg-muted` | `#E8E4DC` | Canvas/inset backgrounds |
| `card` | `#FDFCFA` | Card surfaces (near-white) |
| `surface` | `#FFFFFF` | Panels, nav, modals, inputs |
| `surface-hover` | `#F8F7F4` | Surface on hover |
| `surface-pressed` | `#F5F2EE` | Surface on press |
| `overlay` | `rgba(28, 27, 25, 0.55)` | Modal backdrop |

### Category-specific colors (Weekly schedule)

| Token | Hex | Usage |
|-------|-----|-------|
| `weekly-border` | `#C5D2B8` | Weekly grid borders |
| `weekly-head-bg` | `#E8EDE0` | Weekly column header background |
| `weekly-head-text` | `#4A5A3E` | Weekly day names |
| `weekly-body-bg` | `#FAFBF7` | Weekly column body |
| `weekly-hover` | `#EFF2E8` | Weekly drag-over state |
| `weekly-accent` | `#7A8F5E` | Weekly active/focus accent |

### Badge colors

| Token | Hex | Usage |
|-------|-----|-------|
| `badge-free-bg` | `#EAF5EA` | Free category badge background |
| `badge-free-text` | `#2D6A2D` | Free badge text |
| `badge-paid-bg` | `#FFF5EA` | Paid category badge background |
| `badge-paid-text` | `#8B5E2A` | Paid badge text |

---

## 2. Typography

### Font Families

| Token | Family | Weight | Usage |
|-------|--------|--------|-------|
| `font-serif` | Playfair Display | 400 italic | Logo, A4 page titles, branding, plan prices |
| `font-sans` | Atkinson Hyperlegible Next | 400, 500, 600, 700 | Body, UI, card labels, buttons |

> **Why Atkinson Hyperlegible?** Designed for maximum legibility for low-vision
> readers. Essential for our special-needs audience. Never substitute.

### Type Scale

| Name | Size | Weight | Letter-spacing | Use |
|------|------|--------|---------------|-----|
| `logo` | 1.5rem (24px) | 400 italic | 0 | Nav brand |
| `logo-mobile` | 1rem (16px) | 400 italic | 0 | Nav brand <480px |
| `a4-title` | 22px | 400 italic | 0 | A4 page title (serif) |
| `heading` | 14px | 400 | 0 | Modal headings |
| `body` | 14px (root) | 400 | 0 | Default body text |
| `card-label` | 17px | 400 | 0 | Placed card labels on A4 |
| `card-label-weekly` | 13px | 400 | 0 | Weekly card labels |
| `tile-label` | 13px | 400 | 0 | Library tile labels |
| `button` | 11px | 500 | 0.08em | Buttons, nav actions |
| `label` | 11px | 500 | 0.09em | Section labels, uppercase |
| `caption` | 12px | 400-500 | 0.02-0.05em | Small text, badges |
| `tiny` | 10px | 400 | 0.04em | Column sub-labels |

### Accessibility Text Scaling

Users can scale text from 80% to 140% via the accessibility bar. The scale
applies to `html { font-size }` and all `rem`-based sizes follow.

Default: `14px` (100%). Steps: 80%, 90%, 100%, 110%, 120%, 130%, 140%.

---

## 3. Spacing

Base unit: `4px`. All spacing should use multiples of this base.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (icon-to-text) |
| `space-2` | 8px | Grid gaps, small padding |
| `space-3` | 12px | Medium gaps |
| `space-4` | 16px | Section padding |
| `space-5` | 20px | Panel padding |
| `space-6` | 24px | Large gaps |
| `space-8` | 32px | A4 page padding (landscape) |
| `space-9` | 36px | A4 page padding top (portrait) |
| `space-12` | 48px | A4 page side padding (portrait) |

---

## 4. Layout

### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `desktop` | > 900px | 3-panel: sidebar + canvas + right panel |
| `tablet` | 481-900px | Canvas full-width, panels as drawers |
| `mobile` | <= 480px | Compact nav (56px), smaller fonts |

### Panel Dimensions

| Panel | Width | Min | Max | Mobile |
|-------|-------|-----|-----|--------|
| Sidebar | 285px | 220px | 480px | Fixed 290px (max 88vw), drawer from left |
| Right panel | 270px | 220px | 480px | Fixed 280px (max 88vw), drawer from right |
| Canvas | flex:1 | — | — | Full width |

### Nav Heights

| Element | Desktop | Mobile (<480px) |
|---------|---------|-----------------|
| A11y bar | ~30px | ~30px |
| Top nav | 66px | 56px |
| Mobile bottom bar | — | 58px |

### Z-index Scale

| Layer | Value |
|-------|-------|
| Drawers / panels | 300 |
| Overlay (mobile) | 299 |
| Mobile bottom bar | 200 |
| Modal backdrop | 500 |
| Skip link | 1000 |

---

## 5. A4 Print Specifications

### Page Dimensions (at 96 DPI)

| Orientation | Width | Height | Padding |
|-------------|-------|--------|---------|
| Portrait | 794px | 1123px | 36px top, 48px sides, 0 bottom |
| Landscape | 1123px | 794px | 28px top, 32px sides, 24px bottom |

### Grid Specifications (Daily Schedule — Portrait)

| Columns | Cell Width | Cell Height | Rows | Total Slots |
|---------|-----------|-------------|------|-------------|
| 2 | 345px | 282px | 3 | 6 |
| 3 | 227px | 186px | 4 | 12 |
| 4 | 168px | 137px | 6 | 24 |

### Grid Gap: 8px

### Card Slot Anatomy

```
+------------------+
|                  |  70% — image area (object-fit: contain)
|     [image]      |
|                  |
+------------------+
|   Card Label     |  30% — label area (border-top: 1.5px #F0F0F0)
+------------------+
```

### Weekly/Custom/FirstThen (Landscape)

- Weekly: 7 columns (1 per day), green-themed borders
- Custom: 2-5 columns, user-named headers
- FirstThen: 2-3 large columns, 1 card max per column

### Footer

```
[Grow Gently (serif italic, 13px, #AAA)]      [visualschedule.app (12px, #AAA)]
```
Border-top: 1px solid #E8E4DC, padding: 6px 0 16px.

---

## 6. Components

### Button Variants

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `default` | transparent | `#4A4540` | `border` | border→ink, text→ink |
| `primary` | `ink` | white | `ink` | bg→#333 |
| `accent` | `accent` | white | `accent` | bg→accent-hover |
| `ghost` | none | `ink-2` | none | text→ink |

All buttons: 11px, uppercase, letter-spacing 0.08em, weight 500, font-sans.
Padding: 0.42rem 1rem (default), 0.55rem full-width.

### Input Fields

- Background: `#F8F7F4`
- Border: 1px solid `border`
- Focus: border-color → `accent`
- Font: 13px, font-sans, color `ink`
- Padding: 0.42rem 0.65rem (small), 0.5rem 0.65rem (default)

### Modal

- Backdrop: `overlay`
- Container: white, width 90%, max-width 400px, padding 1.75rem
- Header: flex between, border-bottom `border`, 14px weight 400
- Body: 13px, color `ink-2`, line-height 1.7

### Library Tile (Sidebar Card)

```
+------------------+
|                  |  Square (aspect-ratio: 1) — white bg
|     [image]      |  img: object-fit contain
|                  |
+------------------+  border-top: 1px #EEE
|   Tile Label     |  13px, center, #2C2C2C
+------------------+
```
- Border: 1px `border`
- Hover: box-shadow 0 3px 10px rgba(0,0,0,0.1), translateY(-1px)
- Locked: opacity 0.5, cursor not-allowed, no hover effect
- Lock icon: absolute top-right, 12px stroke `ink-3`

### Drop Zone (Empty)

- Border: 1.5px dashed #CCC
- Hover/dragover: border-color → accent, bg → #FEFCF8
- Hint: plus icon (18px, #CCC) + "Drop" text (12px, #CCC)

### Drop Zone (Filled)

- Border: 1.5px solid #E0E0E0
- Remove button: absolute top-right, 18px circle, hidden until hover
- Remove hover: bg #111, color white

---

## 7. Motion & Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| Border color | 180ms | ease |
| Background | 180ms | ease |
| Box shadow | 150ms | ease |
| Transform (hover lift) | 150ms | ease |
| Drawer slide | 250ms | ease |
| Opacity | 150ms | ease |

---

## 8. Accessibility Requirements

### Focus

- Style: 2px solid `accent`, offset 2px
- Apply via `:focus-visible` (not `:focus` — avoid on mouse click)

### Touch Targets

- Minimum: 44x44px (WCAG 2.5.5)
- Drop zones on mobile: min-height 80px
- Buttons: at least 0.42rem vertical padding

### Contrast Ratios (WCAG AA minimum 4.5:1)

| Pair | Ratio | Pass |
|------|-------|------|
| ink (#1C1B19) on bg (#EDEADE) | 11.7:1 | AAA |
| ink-2 (#5C5855) on surface (#FFF) | 5.7:1 | AA |
| accent (#8B5E2A) on surface (#FFF) | 5.1:1 | AA |
| white on ink (#1C1B19) | 17.2:1 | AAA |

### Screen Reader

- Skip-to-content link (visually hidden, shows on focus)
- ARIA labels on all interactive elements without visible text
- Live regions for dynamic content (card placed/removed)

---

## 9. Black Card Variant

When "Black" card style is active:

| Element | Value |
|---------|-------|
| Card background | `ink` (#1C1B19) |
| Image area background | `#2A2825` + brightness(0.92) filter |
| Label area background | `ink` |
| Label text color | white |
| Label border-top | `#333` |

Must print correctly (force `print-color-adjust: exact`).

---

## 10. Site Footer

- Background: `ink` (#1C1B19)
- Text: `#9A9690`
- Brand: Playfair Display, 1rem italic, `#F5F2EC`
- Links: `#9A9690`, hover → `#F5F2EC`
- Padding: 1.1rem 1.75rem (desktop), 0.85rem 1rem (mobile)
- Hidden in print
