# PROJECT_SPEC.md

## Problem Statement

Students learn sorting algorithms' Big-O complexity in isolation, but rarely see how the *actual shape* of a dataset (how sorted it already is, how many duplicates it has, how big it is) determines which algorithm wins in practice. SortLens makes that connection concrete: it reads a dataset's shape first, predicts a winner, then races five instrumented sorting algorithms to check itself.

## Objectives

1. Correctly implement and instrument bubble, selection, insertion, quick, and merge sort, counting comparisons and writes for each.
2. Compute inversion ratio and duplicate ratio for any input array and use them to predict a likely winner via a fixed rule table.
3. Present the prediction, the race, and the outcome through a browser dashboard an evaluator can follow in under two minutes.
4. Log enough runs to report the classifier's real accuracy — including admitting when it's wrong.

## Core Features

**Must have**
- Five sorting engines in C, each instrumented with comparison and write counters
- Inversion-ratio / duplicate-ratio classifier in C, driving a fixed prediction rule table
- Flask API bridging the C core to the browser (`/api/analyze`, `/api/race`)
- Single-page dashboard: control panel, prediction panel, five live race lanes, scoreboard

**Should have**
- Run history in SQLite (pattern, size, predicted vs. actual winner) shown as a simple accuracy log
- Four dataset-pattern generators: random, nearly sorted, reverse sorted, few unique values

**Optional / only if time allows**
- Step-by-step operation-trace animation (bars move in sync with the real recorded C execution, not a simulated pace)
- CSV upload for a user-supplied dataset instead of a generated one

The Must-Have set alone is a complete, demonstrable project. Should-have and Optional features are never dependencies of it.

## Syllabus → Feature Mapping

| Syllabus Topic | Where It's Used |
|---|---|
| Array representation & operations (Unit 1) | The dataset itself; every sort engine operates on a plain C array |
| Time/space complexity (Unit 1) | Instrumentation (comparison/write counts) is the empirical stand-in for complexity, discussed directly at viva |
| Bubble / Selection / Insertion / Quick / Merge sort (Unit 6) | The five racing engines — this is the graded core of the project |
| Merge sort's divide-and-conquer structure (Unit 6) | Reused, unmodified, to count inversions in O(n log n) for the classifier |

## Viva Preparation

**Basic**
- *What does this do?* Predicts which sort wins from data shape, races five instrumented sorts to check itself.
- *Why these five algorithms?* They're exactly Unit 6's sorting techniques.

**Engineering concepts**
- *What's an inversion, and why does it predict insertion sort's performance?* A pair out of order; insertion sort's comparison count is proportional to the inversion count, so few inversions means very little work for it.
- *Why does merge sort win on high-duplicate or fully-reversed data?* Its O(n log n) behavior doesn't depend on input order, unlike quicksort, which can degrade on adversarial or repetitive data.
- *Why count comparisons/writes instead of just timing?* Wall-clock time is hardware- and noise-dependent; operation counts are the real complexity signal and reproduce identically on any machine.

**Implementation**
- *Why is the core in C, not Python?* It matches the syllabus's practical language directly and keeps the graded logic transparent instead of hiding it behind a high-level library.
- *Why Flask if the core is C?* Flask is only a thin bridge to the browser — it contains no engineering logic, and that separation is deliberate.
- *How does the frontend animate without reimplementing sorting in JavaScript?* It only plays back operation counts (and, optionally, the recorded operation trace) that the C core already computed — no duplicate logic exists anywhere.

**Design decisions**
- *Why cap dataset size at 70?* Keeps compute and animation time reasonable for a live demo; it's a UX choice, not a limitation of the algorithms.
- *Why SQLite, not a "real" database?* No concurrent users, no server needed — it's the simplest tool that satisfies the actual requirement.

**Limitations**
- The classifier is a hand-derived rule table, not a learned model — it can be wrong on unusual data shapes, and the demo shows this honestly when it happens.
- Dataset size is capped for demo purposes only; the algorithms themselves have no such limit.

**Future scope**
- Let users upload their own CSV datasets instead of only generated patterns.
- Extend the classifier to report a confidence level instead of a single hard prediction.
