# SortLens Design System Specification

## 1. Design Vision & Philosophy

SortLens is an engineering laboratory and academic visualization environment for sorting and searching algorithms.
The interface is designed to feel:
- **Technical & Scientific**: Purposeful instrumentation, high information density without clutter.
- **Precise & Composed**: Monospace telemetry, exact pixel borders, mathematical consistency.
- **Dark Graphite Surfaces**: Restrained dark surfaces (`#0c0d11` to `#252937`) that direct focus to the visual arena.
- **Zero Gamification**: No cartoon mascots, XP points, streaks, or confetti. Every visual element conveys empirical data.

---

## 2. Design Tokens Reference

All design tokens are defined as CSS Custom Properties in [`src/styles/tokens.css`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/styles/tokens.css).

### 2.1 Surface & Border Palette

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--sl-color-bg-base` | `#0c0d11` | Application viewport background |
| `--sl-color-bg-subtle` | `#12141a` | Sidebar and header surface |
| `--sl-color-surface-1` | `#171922` | Standard panels and cards |
| `--sl-color-surface-2` | `#1e212d` | Sub-panels, elevated containers, input backgrounds |
| `--sl-color-surface-elevated` | `#252937` | Modals, active states, dropdowns |
| `--sl-color-border-subtle` | `#232733` | Structural dividers, panel borders |
| `--sl-color-border-base` | `#2c3140` | Interactive control borders |
| `--sl-color-border-strong` | `#3f465c` | Emphasized card borders, hover borders |
| `--sl-color-border-hover` | `#4d5570` | Focus and hover accent borders |

### 2.2 Purposeful Telemetry Accents

Color is never purely decorative. Each accent represents a specific data-structure concept:

| Accent Token | Hex | Meaning & Scope |
| :--- | :--- | :--- |
| `--sl-color-accent-amber` | `#f59e0b` | **Empirical Cost Model Prediction Signal**. Strictly reserved for the classifier's predicted winner and inversion/duplicate threshold indicators. |
| `--sl-color-accent-cyan` | `#06b6d4` | **Comparisons & Active Pointers**. Highlighting array indices being compared, inspection pointers, and core brand accents. |
| `--sl-color-accent-emerald` | `#10b981` | **Sorted State & Parity Match**. Indicating sorted subarrays, verified native parity, and ready runtime status. |
| `--sl-color-accent-rose` | `#f43f5e` | **Writes & Swaps**. Mutation events, memory writes, and critical runtime errors. |
| `--sl-color-accent-indigo` | `#6366f1` | **Active Ranges & Call Stack Depth**. Subarray partitioning in Lomuto Quick Sort and recursion call-tree depth. |

### 2.3 Typography Hierarchy

SortLens pairs a clean system sans-serif font for structure with a highly legible monospace stack for all numeric data:

```css
--sl-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--sl-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

| Type Token | Size | Line Height | Application |
| :--- | :--- | :--- | :--- |
| `--sl-text-xs` | 11px (0.6875rem) | 1.4 | Badges, telemetry metric labels, metadata |
| `--sl-text-sm` | 13px (0.8125rem) | 1.5 | Button labels, secondary descriptions, table cells |
| `--sl-text-base` | 15px (0.9375rem) | 1.5 | Body text, input labels, default controls |
| `--sl-text-lg` | 17px (1.0625rem) | 1.4 | Panel titles, subsection headings |
| `--sl-text-xl` | 20px (1.25rem) | 1.3 | Major section titles, primary telemetry numbers |
| `--sl-text-2xl` | 24px (1.5rem) | 1.2 | Page titles, telemetry summary counters |

### 2.4 Spacing & Geometry

- **Base 4px Scale**:
  `--sl-space-1` (4px), `--sl-space-2` (8px), `--sl-space-3` (12px), `--sl-space-4` (16px), `--sl-space-5` (20px), `--sl-space-6` (24px), `--sl-space-8` (32px), `--sl-space-12` (48px).
- **Corner Radii**:
  `--sl-radius-xs` (2px), `--sl-radius-sm` (4px), `--sl-radius-md` (6px), `--sl-radius-lg` (8px), `--sl-radius-xl` (12px).
- **Surface Elevation**:
  Panels and controls use tonal shifts and 1px borders rather than heavy drop shadows to preserve contrast and avoid muddy blur.

### 2.5 Motion & Transitions

- Fast: `120ms cubic-bezier(0.2, 0, 0, 1)` (button hovers, badge toggles)
- Normal: `220ms cubic-bezier(0.2, 0, 0, 1)` (sidebar collapse, section transitions)
- Slow: `350ms cubic-bezier(0.2, 0, 0, 1)` (drawer open/close)
- **Reduced Motion**: Automatically sets transition durations to `0.01ms` when `prefers-reduced-motion: reduce` is detected.

---

## 3. Component Library Guidelines

1. [**`Button`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/ui/Button.tsx): Variants `primary` (cyan), `secondary` (surface-2 with border), `ghost`, `danger`. Sizes `sm`, `md`, `lg`. Accessible disabled styling with `aria-hidden` icons.
2. [**`IconButton`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/ui/IconButton.tsx): Enforces mandatory `ariaLabel` prop for screen readers. Fallback tooltip via `title`.
3. [**`Badge`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/ui/Badge.tsx): Monospace badge with optional dot indicator. Variants: `neutral`, `amber`, `cyan`, `emerald`, `rose`, `indigo`.
4. [**`Panel`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/ui/Panel.tsx): Structured surface container with header, subtitle, badge slot, action slot, and optional footer.
5. [**`Tooltip`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/ui/Tooltip.tsx): Accessible CSS/ARIA tooltip connecting target via `aria-describedby` when visible.
6. [**`SectionHeading`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/ui/SectionHeading.tsx): Standardized section title row with badge, action slot, and subtitle.
7. [**`EngineStatusBadge`**](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/status/EngineStatusBadge.tsx): Live runtime status pill with `role="status"` and `aria-live="polite"`.

---

## 4. Accessibility & Responsive Breakpoints

- **Target Standard**: WCAG 2.2 AA.
- **Focus Rings**: Accessible 2px cyan outline (`--sl-color-focus-ring: #38bdf8`) with 2px offset.
- **Color Independence**: Status badges pair distinct text labels with dot indicators and borders.
- **Breakpoints**:
  - `> 1024px`: Desktop multi-column workspace with persistent sidebar.
  - `768px – 1024px`: Collapsed sidebar or responsive single-column layout.
  - `< 768px`: Mobile drawer overlay with touch-friendly navigation and full-width panels. Zero horizontal overflow.
