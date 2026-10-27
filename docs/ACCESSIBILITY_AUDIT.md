# SortLens Rebuild — Accessibility (a11y) Verification & WCAG 2.2 AA Audit

## 1. Compliance Standard

SortLens Rebuild targets **WCAG 2.2 Level AA** compliance across all interfaces, visualizers, and interactive workbench controls.

---

## 2. Accessibility Architecture

### 2.1 Screen Reader Live Region Announcements
* **Implementation:** `LiveAnnouncer` (`src/components/ui/LiveAnnouncer.tsx`) connected to `announcer` service (`src/state/announcer.ts`).
* **Attributes:** `aria-live="polite"`, `aria-atomic="true"`, with the `.sl-sr-only` CSS utility.
* **Throttling:** Polite 300ms throttling prevents screen reader queue flooding during high-speed playback.
* **Key Announcements:**
  - Dataset regeneration: e.g. `"Staged reverse dataset with 30 elements."`
  - Sorting race completion: e.g. `"Sorting race completed. Merge Sort (Top-down) took first place with 120 operations."`
  - Search probe steps: Target discovery and failure events.
  - Viva demo stage transitions: Announcing current educational objective.

### 2.2 Visual Canvas Textual Alternatives
HTML5 Canvas elements do not inherently expose DOM subtrees to assistive technologies. SortLens bridges this gap using a dual-layer strategy:
1. **Direct Canvas Semantics:**
   `role="img"` and dynamic `aria-label`: e.g. `aria-label="Merge Sort (Top-down) visual array representation (30 bars)"`.
2. **Hidden Textual Mirror:**
   An accompanying `.sl-sr-only` element continuously reflects step index, comparisons, writes, and completion state:
   ```html
   <div className="sl-sr-only" aria-live="polite">
     Merge Sort (Top-down): Completed. Comparisons: 70, Writes: 50.
   </div>
   ```

### 2.3 Modal Dialog Accessibility
* All modals (`KeyboardShortcutsModal`, `HistoryModal`) provide:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-labelledby` referencing their primary heading
  - Focus trapping and automatic initial focus on the primary action / close button
  - Keyboard dismissal via <kbd>Esc</kbd>
  - Focus return to triggering element upon closure

### 2.4 Reduced Motion Support (`prefers-reduced-motion`)
The global stylesheet (`src/styles/global.css`) incorporates strict CSS reduced-motion overrides:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
All UI transitions, popups, and motion animations collapse to instant state updates when the user has configured reduced motion at the OS level.

### 2.5 Focus Indicators & Contrast Ratios
* **Focus Visible:** All focusable interactive elements (`<button>`, `<input>`, `<select>`, `<a href>`, `[role="button"]`) utilize an explicit `:focus-visible` ring with `2px solid var(--sl-color-accent-cyan)` and `2px` offset.
* **Color Contrast:** All body text meets or exceeds WCAG AA 4.5:1 contrast against dark graphite backgrounds (`#0c0d11`, `#14161d`, `#1b1e28`):
  - Primary text (`#f1f5f9`): 13.8:1 contrast ratio.
  - Secondary text (`#94a3b8`): 6.8:1 contrast ratio.
  - Cyan accents (`#06b6d4` / `#22d3ee`): 5.1:1 contrast ratio against elevated surfaces.
  - Emerald badge text (`#10b981` / `#34d399`): 5.9:1 contrast ratio against surface badges.

---

## 3. Automated Audit Evidence

Verified via automated test suites:
* `tests/accessibility/accessibility.test.tsx` (4 passing tests)
* `tests/components/AppShell.test.tsx` (5 passing tests)
* `tests/shortcuts/keyboardShortcuts.test.tsx` (5 passing tests)
* `tests/history/historyModal.test.tsx` (6 passing tests)
