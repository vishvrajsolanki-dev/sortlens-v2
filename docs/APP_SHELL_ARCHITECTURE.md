# SortLens Application Shell Architecture

## 1. Architectural Overview

The SortLens application shell establishes the structural, visual, and state foundations of the application. It decouples high-level UI navigation and user dataset configuration from the low-level C99 WebAssembly core and the high-frequency deterministic playback engine.

```
                           ┌───────────────────────────────┐
                           │      React Application        │
                           │           (App.tsx)           │
                           └───────────────┬───────────────┘
                                           │
                         ┌─────────────────┴─────────────────┐
                         ▼                                   ▼
              ┌─────────────────────┐             ┌─────────────────────┐
              │    Zustand Store    │             │   CoreClient WASM   │
              │    (appStore.ts)    │             │     (loader.ts)     │
              └──────────┬──────────┘             └──────────┬──────────┘
                         │                                   │
                         ▼                                   ▼
              ┌─────────────────────────────────────────────────────────┐
              │                   AppShell Component                    │
              │  ┌─────────────────────────┬─────────────────────────┐  │
              │  │  Sidebar Navigation    │      AppHeader          │  │
              │  │  (PrimaryNavigation)    │  (EngineStatusBadge)    │  │
              │  ├─────────────────────────┴─────────────────────────┤  │
              │  │                   WorkspaceFrame                  │  │
              │  │  ┌───────────────────────┬──────────────────────┐  │  │
              │  │  │ Dataset Configuration │ Arena Layout Preview │  │  │
              │  │  ├───────────────────────┴──────────────────────┤  │  │
              │  │  │    Core Engine Diagnostic Console (Panel)    │  │  │
              │  │  └──────────────────────────────────────────────┘  │  │
              │  └───────────────────────────────────────────────────┘  │
              └─────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & File Mapping

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| `App` | [`src/app/App.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/app/App.tsx) | Application root. Bootstraps WebAssembly lifecycle asynchronously without blocking UI mount. |
| `AppShell` | [`src/components/layout/AppShell.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/layout/AppShell.tsx) | Master responsive grid container: manages sidebar, header, and workspace viewport. |
| `AppHeader` | [`src/components/layout/AppHeader.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/layout/AppHeader.tsx) | Header with breadcrumbs, sidebar toggles, and live `EngineStatusBadge`. |
| `PrimaryNavigation` | [`src/components/layout/PrimaryNavigation.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/layout/PrimaryNavigation.tsx) | Vertical navigation for the 5 product modules with active states and status badges. |
| `WorkspaceFrame` | [`src/components/layout/WorkspaceFrame.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/layout/WorkspaceFrame.tsx) | Dynamic section router rendering the active view with responsive boundaries. |
| `EngineStatusBadge` | [`src/components/status/EngineStatusBadge.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/status/EngineStatusBadge.tsx) | Accessible live status region (`role="status"`, `aria-live="polite"`). |
| `CoreDiagnosticPanel`| [`src/components/diagnostics/CoreDiagnosticPanel.tsx`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/src/components/diagnostics/CoreDiagnosticPanel.tsx) | Interactive workbench for real-time WASM shape analysis and sorting. |

---

## 3. UI State Architecture (`appStore.ts`)

SortLens uses Zustand (`src/state/appStore.ts`) strictly for cross-cutting application configuration:

### State Fields
- `activeSection`: `'arena' | 'analysis' | 'search' | 'scaling' | 'viva'`
- `sidebarCollapsed`: `boolean` (collapses sidebar to 64px icon bar)
- `mobileNavOpen`: `boolean` (controls slide-out drawer on viewports < 768px)
- `runtimeStatus`: `'uninitialized' | 'initializing' | 'ready' | 'error'`
- `runtimeError`: `string | null`
- `arraySize`: `number` (strictly clamped to application range `[2, 100]`)
- `datasetPattern`: `'random' | 'nearly_sorted' | 'reverse' | 'few_unique' | 'custom'`
- `judgeBy`: `JUDGE_COMPARISONS | JUDGE_WRITES | JUDGE_TOTAL`

### Boundary Invariants
1. **No Canvas Rendering State in Zustand**: High-frequency ticks (60–144 Hz) and event deltas must never route through Zustand actions. They remain encapsulated in `RaceCoordinator` and subscribe directionally.
2. **C Core as Single Source of Truth**: Operation counts, inversions, predictions, and hash collisions are computed inside WebAssembly and rendered, never duplicated or estimated in JS state.

---

## 4. Input-Size Constraint Resolution

The analysis in Section 2.1 resolves the discrepancy between the low-level API and the public application experience:

| Boundary | Valid Range | Rationales & Verification Evidence |
| :--- | :---: | :--- |
| **Low-Level C99 / WebAssembly API** | `[1, 100]` | In `analyzer.c`, `n <= 1` is handled safely without memory faults, returning trivial inversion counts (0) and 0 operations. The C core boundary is strictly $N \in [1, 100]$. |
| **Public Application & Arena Controls** | `[2, 100]` | `PROJECT_STATEMENT.md` (Unit 1: Arrays, Time & Space Complexity) states array representation as `size 2..100, values 1..99`. Pedagogically, sorting an array of size $N=1$ is trivial and cannot demonstrate comparisons, inversions, or algorithm competition. The UI slider and custom input validators therefore enforce $N \in [2, 100]$. |

---

## 5. Responsive Design Matrix

| Breakpoint | Sidebar Behavior | Header Behavior | Workspace Layout |
| :--- | :--- | :--- | :--- |
| **Wide Desktop (> 1024px)** | Persistent 240px sidebar (or 64px collapsed). | Breadcrumb + Engine Status badge. | 2-column grid: Arena visualization preview + telemetry cards. |
| **Tablet (768px – 1024px)** | Persistent collapsed (64px) or toggleable. | Compact breadcrumb. | Single-column stacked layout. |
| **Mobile (< 768px)** | Off-canvas drawer with touch backdrop. | Hamburger menu button appears. | Fluid full-width cards; zero horizontal overflow. |
