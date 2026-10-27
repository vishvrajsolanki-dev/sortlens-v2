# ARCHITECTURE.md

## System Architecture

```text
USER (browser)
   ↓
FRONTEND — static HTML/CSS/JS (Stitch-designed, refined via Antigravity/Codex)
   ↓  fetch() → JSON
BACKEND API — Python (Flask), one thin file
   ↓  subprocess call, array + config piped in
CORE ENGINEERING LOGIC — C (sortlens_core binary)
   • 5 instrumented sort engines
   • inversion / duplicate classifier
   ↓  JSON result on stdout
BACKEND — parses JSON, optionally logs the run to SQLite
   ↓  JSON API response
FRONTEND — renders prediction panel, animated race, scoreboard
```

No microservices, containers, message queues, or cloud infrastructure. Runnable locally with `make && python app.py`.

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Core engineering logic | **C** | Matches the syllabus's practical language; keeps graded logic inspectable, not hidden behind a library |
| Backend/API | **Python (Flask)** | Thinnest possible bridge between a compiled C binary and a browser — no HTTP server written by hand in C, which the syllabus doesn't require |
| Database | **SQLite** | Zero-config, single file, matches the should-have run-history scope exactly |
| Frontend | **HTML/CSS/JS (static)** | No build tooling needed; works directly with Stitch AI output; fetch() is enough |
| Visualization | Vanilla JS, driven by the C core's real op counts | What's shown is always what was actually computed — no sorting logic duplicated in JS |
| Development | GCC + Make, pip/venv, any static file server | Standard, free, already familiar from lab practicals |
| Deployment/demo | Local run on the presenting laptop | No hosting needed for a viva demo |

**Academic/core technology:** C. **Supporting technology:** Python (backend) and JS (frontend) — these exist only to make the C engine demonstrable.

## API Contract

### `POST /api/analyze`
- Input: `{ "pattern": "random"|"nearly"|"reverse"|"dup", "size": int }`
- Validation: `size` in 10–70; `pattern` one of the four listed; else 400
- Processing: Python generates the array for the pattern (not engineering logic, kept out of C deliberately); calls the C binary's classify mode via subprocess
- Output: `{ array, inversion_ratio, duplicate_ratio, predicted_algo, reason }`
- Errors: invalid input → 400; C binary failure → 500 with a generic message

### `POST /api/race`
- Input: `{ "array": [int, ...], "pattern": string, "size": int }` (pattern/size passed through only for logging)
- Validation: array length 10–70, all values integers in range
- Processing: calls the C binary's race mode via subprocess, array piped on stdin
- Output: `{ results: { bubble: {comparisons, writes, elapsed_ms}, selection: {...}, insertion: {...}, quick: {...}, merge: {...} } }` (plus `ops` per algorithm if trace mode is built)
- Errors: same pattern as above; logs the run to SQLite on success

### `GET /api/history`
- Output: `{ runs: [{ timestamp, pattern, size, predicted_algo, actual_winner, confirmed }, ...] }`, most recent first, capped at ~50

No other endpoints — do not add `/api/reset`, `/api/config`, or similar without a real need appearing during build.

## Database / Storage

SQLite, single file `backend/sortlens.db`, one table, `runs`:

| Field | Type | Purpose |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Row id |
| `timestamp` | TEXT | When the run happened |
| `pattern` | TEXT | Dataset pattern used |
| `size` | INTEGER | Dataset size |
| `inversion_ratio` | REAL | Logged for later accuracy analysis |
| `duplicate_ratio` | REAL | Same |
| `predicted_algo` | TEXT | What the classifier predicted |
| `actual_winner` | TEXT | Algorithm with fewest comparisons that run |
| `confirmed` | INTEGER (0/1) | Whether prediction matched outcome |

No relationships needed — one flat table is the whole schema.

## Data Flow

```text
USER INPUT (pattern, size)
    ↓
FRONTEND VALIDATION
    ↓
API — POST /api/analyze
    ↓
BACKEND VALIDATION (re-checked server-side, never trust the client alone)
    ↓
DATASET GENERATION (Python) + CLASSIFICATION (C — Unit 1 reasoning applied here)
    ↓
API RESPONSE — prediction shown
    ↓
USER clicks Race → API — POST /api/race
    ↓
SORTING ENGINES (C — Unit 6 algorithms, fully instrumented)
    ↓
RESULT LOGGING (SQLite)
    ↓
API RESPONSE — counts/timing per algorithm
    ↓
FRONTEND VISUALIZATION (race lanes animate, scoreboard renders, verdict stated)
```

## Frontend Architecture

Single screen — no multi-page navigation needed:

```text
Dashboard
├── Control panel     — pattern buttons, size slider, Generate/Race buttons
├── Prediction panel   — inversion %, duplicate %, size, predicted winner + reason
├── Race lanes (×5)    — one bar-chart lane per algorithm, live comparison/write counters
└── Scoreboard         — ranked results table, prediction confirmed/missed verdict
```

| Aspect | Detail |
|---|---|
| Inputs | Pattern choice, dataset size (10–70), playback speed |
| Outputs | Predicted winner + reasoning, live per-algorithm counters, final ranked scoreboard |
| Empty state | Before "Generate": placeholder bars + "Generate a dataset to see a prediction." |
| Error state | API failure → inline banner: "Couldn't reach the analysis engine. Check that the backend is running." |
| Loading state | Buttons disabled + small spinner while awaiting API responses |

## Stitch AI Design Specification

Lab-instrument / race-telemetry aesthetic — an engineering diagnostic tool, not a marketing dashboard. Dark graphite background with a faint grid, monospace numerals for all data, one warm accent color reserved only for the prediction/verdict signal. No glassmorphism, no decorative gradients, no hero section, no marketing copy.

| Axis | Direction |
|---|---|
| Layout | Single column, top to bottom: controls → prediction → five stacked race lanes → scoreboard. Left-aligned. |
| Typography | One geometric sans (display/UI) + one monospace (all numeric readouts) |
| Spacing | Generous between panels (24–32px); tight inside data readouts |
| Component style | Flat panels, 1px hairline borders, ~8–10px radius, no drop shadows |
| Color philosophy | Near-black base, five muted lane colors, one warm accent reserved for the prediction signal only |
| Data visualization | Horizontal bar-chart lanes; bars pulse on comparison, flash lane color on write/swap |
| Responsive | Lanes stack cleanly on narrow screens; control row wraps |

**Stitch master prompt:**

```
Design a single-page web dashboard called "SortLens" for a sorting-algorithm
racing tool used in a live academic demo. Aesthetic: a dark lab-instrument /
race-telemetry panel, not a SaaS marketing dashboard — think oscilloscope
readout meets race timing board. Near-black graphite background with a
subtle grid texture. One warm amber accent color used ONLY to highlight a
"predicted winner" signal — nowhere else. Five algorithm lanes each get
their own muted, distinguishable accent color (coral, violet, cyan, green,
steel blue) used only inside that lane's bar chart.

Typography: one geometric sans-serif for headings and UI labels, one
monospace face for every numeric readout (counts, percentages, timings).
No all-caps labels, no decorative gradients, no drop shadows, no hero
section, no marketing copy — this is a working tool, not a landing page.

Layout, single column, top to bottom:
1. Compact header: tool name + one-sentence description.
2. Control panel: four pattern-choice buttons (Random / Nearly sorted /
   Reverse sorted / Few unique values), a size slider, a speed slider,
   and two buttons ("Generate data", "Race").
3. Prediction panel: three small numeric readouts (inversion ratio,
   duplicate ratio, element count) on the left, a large predicted-winner
   name with a one-sentence reason on the right, in the amber accent.
4. Five stacked "race lane" rows, one per sorting algorithm, each with:
   algorithm name + colored dot, live comparison/write counters in
   monospace, and a horizontal bar-chart area that will animate.
5. A results table (scoreboard) with rank, algorithm, comparisons,
   writes, compute time, and a "predicted" marker column.

Keep it dense, technical, and legible — flat panels with 1px hairline
borders and 8–10px corner radius, no shadows. Fully responsive down to a
360px-wide mobile view, with the control row wrapping and lanes stacking
without losing readability.
```

## Folder Structure

```text
sortlens/
├── core/                    # C — the graded academic core
│   ├── sortlens.c           # 5 sort engines + classifier + CLI modes
│   ├── sortlens.h
│   └── Makefile
├── backend/                 # Python — thin bridge only
│   ├── app.py
│   ├── requirements.txt
│   └── sortlens.db          # created at runtime, not committed
├── frontend/                # static HTML/CSS/JS — Stitch → Antigravity/Codex output
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/
│   └── test_core.py         # invokes the compiled C binary on known arrays, asserts expected counts
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── AGENT_CONTEXT.md
│   └── TESTING.md
└── README.md
```
