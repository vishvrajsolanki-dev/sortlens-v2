# WebAssembly Verification & Runtime Contract

This document records the provenance, loading architecture, verified exports, and runtime contract for the WebAssembly module in SortLens Rebuild.

---

## 1. Artifact Provenance & Packaging

* **Source Files:** `src/core/c/sorts.c`, `analyzer.c`, `hashtable.c`, `stack.c`, `trace.c`, `search.c`, `api.c`, `sortlens.h`.
* **Artifact Path:** `src/core/wasm/core.js` (44,879 bytes).
* **Compiler:** Emscripten Compiler (`emcc`).
* **Original Compilation Configuration:**
  ```cmd
  emcc -O3 core/sorts.c core/analyzer.c core/hashtable.c core/stack.c core/trace.c core/search.c core/api.c \
      -s WASM=1 \
      -s SINGLE_FILE=1 \
      -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
      -s EXPORTED_FUNCTIONS="['_sl_set_value','_sl_analyze','_sl_inversions','_sl_inversion_ratio_x1000','_sl_dup_ratio_x1000','_sl_distinct','_sl_collisions','_sl_max_left_greater','_sl_hash_size','_sl_hash_chain_length','_sl_hash_chain_value','_sl_estimate','_sl_predicted','_sl_reason','_sl_run','_sl_comparisons','_sl_writes','_sl_max_depth','_sl_event_count','_sl_event_type','_sl_event_a','_sl_event_b','_sl_event_c','_sl_event_d','_sl_overflow','_sl_result_value','_sl_make_sorted','_sl_search','_sl_search_comparisons','_sl_search_steps_count','_sl_search_step_index','_sl_search_step_low','_sl_search_step_high']" \
      -o frontend/js/core.js
  ```
* **Binary Encoding:** Because `-s SINGLE_FILE=1` was specified, the compiled WebAssembly binary is directly inlined inside `core.js` via an embedded binary-decoded byte stream (`findWasmBinary()` with `binaryDecode`). No separate `.wasm` file is needed or referenced.

---

## 2. Cross-Runtime Loading Strategy

### Problem Discovered in Phase 1
`core.js` was compiled as a classic script without `-s MODULARIZE=1 -s EXPORT_ES6=1`.
* In pure web browsers, it operates smoothly in window scope because `ENVIRONMENT_IS_WEB = true` and `ENVIRONMENT_IS_NODE = false`.
* In modern Node.js and Vitest with `"type": "module"`, loading `core.js` directly as an ES module fails with `ReferenceError: require is not defined` / `ReferenceError: __dirname is not defined` because Emscripten's Node detection branch (`if (ENVIRONMENT_IS_NODE)`) invokes CommonJS primitives that do not exist in native ESM scope.

### The Universal Loader Solution (`src/core/adapter/loader.ts`)
To achieve robust execution in both browser and test/Node runtimes:
1. **In Browser Environment (`typeof window !== 'undefined'`):**
   * If `window.Module` with exports already exists, resolve immediately.
   * Otherwise, instantiate a controlled `Module` object with an `onRuntimeInitialized` promise handler.
   * Inject or execute the script cleanly within window context without polluting global namespace unnecessarily.
2. **In Node.js / JSDOM Environment (Vitest):**
   * Use Node's built-in `node:vm` context or provide sandboxed `require` (via `node:module.createRequire`) and `__dirname` context.
   * Handle the asynchronous `onRuntimeInitialized` lifecycle deterministically with timeout protection.

This strategy ensures identical, reproducible WebAssembly execution across development, CI testing, and browser production builds.

---

## 3. Verified Export Inventory

All 33 C functions declared in `sortlens.h` and exported via `api.c` are verified present on the initialized `Module` instance:

```text
[
  '_sl_analyze',
  '_sl_collisions',
  '_sl_comparisons',
  '_sl_distinct',
  '_sl_dup_ratio_x1000',
  '_sl_estimate',
  '_sl_event_a',
  '_sl_event_b',
  '_sl_event_c',
  '_sl_event_count',
  '_sl_event_d',
  '_sl_event_type',
  '_sl_hash_chain_length',
  '_sl_hash_chain_value',
  '_sl_hash_size',
  '_sl_inversion_ratio_x1000',
  '_sl_inversions',
  '_sl_make_sorted',
  '_sl_max_depth',
  '_sl_max_left_greater',
  '_sl_overflow',
  '_sl_predicted',
  '_sl_reason',
  '_sl_result_value',
  '_sl_run',
  '_sl_search',
  '_sl_search_comparisons',
  '_sl_search_step_high',
  '_sl_search_step_index',
  '_sl_search_step_low',
  '_sl_search_steps_count',
  '_sl_set_value',
  '_sl_writes',
  'ccall',
  'cwrap'
]
```

### Type Conversion Notice
* C `long long` integers (`sl_inversions`, `sl_estimate`, `sl_comparisons`, `sl_writes`) return JavaScript `bigint` (e.g., `1n`, `45n`). The typed adapter explicitly normalizes them to JavaScript `number` via `Number(...)`.
* C string pointer `sl_reason()` is converted to a JavaScript string via `Module.ccall('sl_reason', 'string', [], [])`.

---

## 4. Verification Verdict

The copied WebAssembly artifact `src/core/wasm/core.js` is **FULLY VERIFIED** and functional across both Node/Vitest and browser execution targets.
