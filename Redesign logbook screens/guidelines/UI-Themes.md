# Pickleball App — UI Theme Specification

Two parallel themes. **Every screen must be buildable in either theme by swapping tokens only.** Content, layout structure, and component order never change between themes.

---

## Theme 1 — Sport Dark

Athletic, data-forward, high-contrast. Inspired by performance trackers (Strava, Nike Training). Dark ground with a single electric accent.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0C0C0C` | Page / phone background |
| `--surface` | `#111111` | Cards, modals |
| `--surface-raised` | `#181818` | Nested cards, inner cells |
| `--border` | `#1E1E1E` | Card borders |
| `--border-subtle` | `#2A2A2A` | Dividers, input borders |
| `--accent` | `#C5F22A` | Primary CTA, active states, key numbers |
| `--accent-fg` | `#0C0C0C` | Text on accent backgrounds |
| `--accent-muted` | `#C5F22A18` | Accent tint backgrounds |
| `--accent-border` | `#C5F22A40` | Accent outline |
| `--text-primary` | `#FFFFFF` | Headings, important values |
| `--text-secondary` | `#CCCCCC` | Body text, descriptions |
| `--text-muted` | `#888888` | Labels, captions (min for AA contrast on `--bg`) |
| `--text-disabled` | `#555555` | Disabled, very subtle info |
| `--warn` | `#F97316` | "Work on" skills, difficult mood |
| `--danger` | `#EF4444` | Struggling mood |
| `--success` | `#22C55E` | Good mood, trending up |
| `--neutral-mood` | `#94A3B8` | Neutral/OK mood |
| `--excellent-mood` | `#8B5CF6` | Excellent/great mood |

### Typography

```
Display / Headings:   Barlow Condensed
  — Weight: 700–800 (ExtraBold)
  — Case: UPPERCASE
  — Letter-spacing: -0.01em to +0.06em depending on context
  — Usage: screen titles, FAB label, stats numbers, save buttons

Body / UI:            DM Sans
  — Weight: 400 (normal), 500 (medium), 600 (semibold)
  — Letter-spacing: default
  — Usage: all body copy, labels, form fields, nav labels

Section labels:       DM Sans, 10px, weight 400, #888, tracking 0.18em, UPPERCASE
Data numbers:         Barlow Condensed, bold tabular-nums
```

### Spacing & Shape

```
Border radius:
  Cards:       rounded-2xl (16px)
  Chips:       rounded-full
  Buttons:     rounded-xl (12px) for secondary, rounded-full for FAB/primary CTA
  Inner cells: rounded-xl (12px)

Card padding:  p-4 (16px)
Section gap:   space-y-3 (12px) between cards
Page padding:  px-5 (20px) horizontal

Dividers:      1px, #1A1A1A
```

### Component Patterns

**Cards**
```
bg: #111
border: 1px solid #1E1E1E
border-radius: 16px (rounded-2xl)
padding: 16px
shadow: none
```

**Primary Button / FAB**
```
bg: #C5F22A
color: #0C0C0C
font: Barlow Condensed, 700, UPPERCASE, tracking 0.07em
border-radius: 9999px (fully rounded)
padding: py-3 px-7
shadow: 0 0 0 4px #0C0C0C, 0 6px 20px rgba(197,242,42,0.4)   ← ring for FAB overlap
hover: opacity 0.9 or scale(1.03)
```

**Secondary / Ghost Button**
```
bg: transparent
border: 1px solid #C5F22A40
color: #C5F22A
border-radius: 11px (rounded-xl)
padding: py-2.5 px-4
hover: bg #C5F22A08
```

**Chip (unselected)**
```
bg: transparent
border: 1px solid #2A2A2A
color: #888
border-radius: 9999px
padding: px-3 py-2
min-height: 40px (touch target)
```

**Chip (selected)**
```
bg: #C5F22A
border: 1px solid #C5F22A
color: #0C0C0C
font-weight: 700
```

**Segment / Tab (unselected)**
```
bg: transparent
color: #666
```

**Segment / Tab (selected)**
```
bg: #1E1E1E
color: #FFFFFF
```

**Bottom Navigation**
```
bg: #0C0C0C
border-top: 1px solid #1A1A1A
height: 58px
padding-top: 28px   ← leaves room for FAB overlap
icon size: 16px (size-4)
label: 9px, Barlow Condensed uppercase when active
active color: #C5F22A
inactive color: #555555
```

**Skill frequency badge**
```
bg: #C5F22A18  (accent tint)
color: #C5F22A
font: bold tabular-nums, 11px
border-radius: 4px
padding: px-1.5 py-0.5
```

---

## Theme 2 — Warm & Friendly

Approachable, personal, encouraging. Warm cream ground with soft lavender-rose gradient accents. Designed to feel like a supportive training journal.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#FAF7F4` | Page / phone background |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-raised` | `#FAF7F4` | Inner form fields, nested areas |
| `--border` | `transparent` | Cards rely on shadow not border |
| `--border-subtle` | `#EDE6F6` | Dividers, input borders, filter tabs |
| `--gradient-primary` | `linear-gradient(135deg, #B48ACA, #CF8FAD)` | Primary CTA buttons, FAB |
| `--gradient-summary` | `linear-gradient(135deg, #EDE6F6, #F6E6EE)` | Summary / hero cards |
| `--accent-purple` | `#B48ACA` | Primary accent (strong skills, active states) |
| `--accent-rose` | `#CF8FAD` | Secondary accent (challenging, work-on) |
| `--accent-purple-muted` | `#EDE6F6` | Purple tint backgrounds |
| `--accent-rose-muted` | `#F6E6EE` | Rose tint backgrounds |
| `--text-primary` | `#2C2233` | Deep plum — headings, key values |
| `--text-secondary` | `#5A4E6E` | Body copy, descriptions |
| `--text-muted` | `#9B8FA6` | Labels, captions |
| `--text-disabled` | `#BFB3CC` | Section headers, inactive nav |
| `--text-caption` | `#D0C6DA` | Hints, placeholder text |
| `--warn` | `#F97316` | "Work on" skills, difficult mood (universal) |
| `--danger` | `#EF4444` | Struggling mood (universal) |
| `--success` | `#22C55E` | Good mood, trending up (universal) |
| `--neutral-mood` | `#94A3B8` | Neutral/OK mood (universal) |
| `--excellent-mood` | `#8B5CF6` | Excellent/great mood (universal) |
| `--coach-cta` | `#27A060` | Price numbers, positive financial info |

> Note: Mood colors (`--danger`, `--warn`, `--neutral-mood`, `--success`, `--excellent-mood`) are **identical in both themes**. Universally understood semantic colors must not be re-skinned.

### Typography

```
Display / Accent headings:  Playfair Display
  — Weight: 600 (SemiBold)
  — Style: italic
  — Usage: screen titles ("Your Logbook"), large stat numbers (hours)

Body / UI:                  Nunito
  — Weight: 400, 500, 600, 700
  — Usage: all body copy, buttons, labels, form fields, nav

Section labels:             Nunito, 10px, weight 600 (semibold), #BFB3CC, tracking wider UPPERCASE
Data numbers:               Playfair Display, bold tabular-nums
Encouraging copy / micro:   Nunito italic for mood confirmation messages
```

### Spacing & Shape

```
Border radius:
  Cards:       rounded-3xl (24px)  ← notably rounder than V1
  Chips:       rounded-full
  Buttons:     rounded-2xl (16px) for secondary, rounded-full for FAB/primary CTA
  Inner cells: rounded-2xl (16px)

Card padding:  p-4 (16px)
Section gap:   space-y-3 (12px) between cards
Page padding:  px-6 (24px) horizontal  ← 4px wider than V1 for airier feel

Dividers:      border-[#EDE6F6] when needed; prefer card separation by spacing alone
```

### Component Patterns

**Cards**
```
bg: #FFFFFF
border: none
border-radius: 24px (rounded-3xl)
padding: 16px
shadow: 0 2px 12px rgba(168,124,184,0.08)  ← warm lavender tint in shadow
```

**Summary / Hero Card**
```
bg: linear-gradient(135deg, #EDE6F6, #F6E6EE)
border: none
border-radius: 24px
padding: 20px
```

**Primary Button / FAB**
```
bg: linear-gradient(135deg, #B48ACA, #CF8FAD)
color: #FFFFFF
font: Nunito, 700
border-radius: 9999px (fully rounded)
padding: py-3 px-7
shadow: 0 0 0 4px #FAF7F4, 0 6px 20px rgba(168,124,184,0.45)  ← ring for FAB overlap
hover: opacity 0.9 or scale(1.03)
```

**Secondary / Ghost Button**
```
Inline version:
bg: linear-gradient(135deg, #B48ACA, #CF8FAD)
color: #FFFFFF
border-radius: 16px (rounded-2xl)
padding: py-2.5 px-4

Ghost version (if needed):
bg: transparent
border: 1px solid #B48ACA40
color: #B48ACA
```

**Chip (unselected)**
```
bg: #FFFFFF
border: 1px solid #EDE6F6
color: #BFB3CC
border-radius: 9999px
padding: px-3 py-2
min-height: 40px (touch target)
```

**Chip (selected — strong skills context)**
```
bg: #B48ACA
border: 1px solid #B48ACA
color: #FFFFFF
```

**Chip (selected — challenging skills context)**
```
bg: #CF8FAD
border: 1px solid #CF8FAD
color: #FFFFFF
```

**Segment / Tab (unselected)**
```
bg: transparent
color: #BFB3CC
```

**Segment / Tab (selected)**
```
bg: #EDE6F6
color: #2C2233
```

**Bottom Navigation**
```
bg: #FFFFFF
border-top: 1px solid #EDE6F6
height: 58px
padding-top: 28px  ← leaves room for FAB overlap
icon size: 16px (size-4)
label: 9px, Nunito
active color: #B48ACA
inactive color: #C8C0D4
```

**Skill frequency badge**
```
Strong: bg #EDE6F6, color #A87CB8
Challenging: bg #F6E6EE, color #CF8FAD
font: bold tabular-nums, 11px
border-radius: 9999px (rounded-full)
padding: px-1.5 py-0.5
```

---

## Shared Rules (Both Themes)

### Mood Color Scale
These colors are **never themed** — they must always read as universal semantic indicators.

| Mood | Color | Hex |
|---|---|---|
| Struggling | Red | `#EF4444` |
| Difficult | Orange | `#F97316` |
| Neutral / OK | Slate gray | `#94A3B8` |
| Good | Green | `#22C55E` |
| Excellent / Great | Purple | `#8B5CF6` |

Use these on: mood dots in session cards, dot timeline nodes, vertical accent bars on session rows.

### Mood Timeline Pattern
Render as a connected dot timeline (not bars), oldest left → newest right:
- 5 dots, each `size-5` (20px) rounded-full, colored per mood scale above
- Connected by a horizontal hairline between dots
- Label below each dot in the dot's color, `9px font-bold`
- Trend sentence below: "Trending upward — keep the momentum" in `#22C55E` when last session ≥ previous

### Donut Chart (Summary Card)
- Library: recharts `PieChart > Pie` with `innerRadius`
- Dimensions: 88×88px
- Inner radius: 28px, outer radius: 43px
- `strokeWidth: 0` (no segment gaps)
- `startAngle={90} endAngle={-270}` (starts at top)
- Center text overlay: absolute positioned, hours in theme display font
- Segment colors: V1 uses `[#C5F22A, #2A2A2A]`, V2 uses `[#B48ACA, #F6E6EE]` (secondary is muted, not pure white)

### FAB Positioning
The FAB floats at the content/nav seam using a zero-height `div`:

```tsx
<div className="relative h-0 z-20 flex justify-center" style={{ flexShrink: 0 }}>
  <button
    style={{ position: "absolute", top: "-22px", height: 44 }}
    // box-shadow includes a 4px ring in the phone background color:
    // V1: boxShadow: "0 0 0 4px #0C0C0C, 0 6px 20px rgba(197,242,42,0.4)"
    // V2: boxShadow: "0 0 0 4px #FAF7F4, 0 6px 20px rgba(168,124,184,0.45)"
  >
    <Plus /> LOG SESSION  {/* V1: Barlow Condensed CAPS */}
    <Plus /> Log a session {/* V2: Nunito */}
  </button>
</div>
```

The nav's `padding-top: 28px` absorbs the lower half of the FAB without obstruction.

### Content Parity
All data is defined once in `src/app/data/logbook.ts` and imported by both themes. **Never duplicate session data or statistics inline.** If V1 shows a stat, V2 must show the same stat in the same position. Only presentational properties (color, font, radius) differ.

### Calories
Calculated as `hours × 450 cal/hr`. Display as `≈ {n.toLocaleString()} cal burned` in the summary card, positioned below the total hours.

### Accessibility Floor
- All body text on `--bg` must maintain ≥ 4.5:1 contrast (AA)
- V1: minimum legible text is `#888` on `#0C0C0C` (~5:1) — do not go darker
- V2: `#9B8FA6` on `#FAF7F4` passes at large sizes; use `#5A4E6E` for body copy
- Chip/button touch targets: minimum 40px height (`py-2` + label line-height)
- Interactive state must signal via more than color alone (border, scale, or underline)
