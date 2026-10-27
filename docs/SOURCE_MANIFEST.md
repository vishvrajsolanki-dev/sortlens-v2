# Source Manifest: SortLens Rebuild

This manifest tracks every file migrated from the original repository (`DS MINI PROJECT/sortlens/`) into the rebuild workspace (`DS MINI PROJECT/sortlens-rebuild/`).
All source and test files were copied without transformation, and binary SHA-256 hashes are verified identical.

## 1. Algorithmic C99 Core Sources (`src/core/c/`)

| Original Relative Path | New Relative Path | Original SHA-256 | Copied SHA-256 | Status | Verification Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `core/sortlens.h` | `src/core/c/sortlens.h` | `E2489FDDC138E1C7A127F35D79802C4E6AA3F64F85400319B1912DD84AB5E262` | `E2489FDDC138E1C7A127F35D79802C4E6AA3F64F85400319B1912DD84AB5E262` | Matched | Verified (Native gcc) | Master C99 header, structs, events, signatures |
| `core/sorts.c` | `src/core/c/sorts.c` | `6A25B5089DF510DCED4E45D6F7D2F614CA039C049358F49013A8FDCB61399543` | `6A25B5089DF510DCED4E45D6F7D2F614CA039C049358F49013A8FDCB61399543` | Matched | Verified (Native gcc) | 5 syllabus sorts (Bubble, Selection, Insertion, Lomuto Quick, Merge) |
| `core/analyzer.c` | `src/core/c/analyzer.c` | `4B975C99D72B1296F710D8CB0BD243C16023450C088E3AB3AE3450ED70B0FC2B` | `4B975C99D72B1296F710D8CB0BD243C16023450C088E3AB3AE3450ED70B0FC2B` | Matched | Verified (Native gcc) | Inversions, max_left_greater, cost model |
| `core/hashtable.c` | `src/core/c/hashtable.c` | `CF7CB554EE0C3DD3917BA8F9A359A2CAFD33E5D77E56A877EABDA6296A824E42` | `CF7CB554EE0C3DD3917BA8F9A359A2CAFD33E5D77E56A877EABDA6296A824E42` | Matched | Verified (Native gcc) | 11-bucket separate chaining hash table for duplicates |
| `core/stack.c` | `src/core/c/stack.c` | `5E3977E76B679555B96D2747EB1EE64F6D9CDCE6F15BFDC62BFCB185FF147B16` | `5E3977E76B679555B96D2747EB1EE64F6D9CDCE6F15BFDC62BFCB185FF147B16` | Matched | Verified (Native gcc) | Array-based call stack for recursion depth tracking |
| `core/trace.c` | `src/core/c/trace.c` | `C1569C6191B5131EC0D1E741FE3E4251FBB6AFE9DFA8C8E780479A258C58292A` | `C1569C6191B5131EC0D1E741FE3E4251FBB6AFE9DFA8C8E780479A258C58292A` | Matched | Verified (Native gcc) | Array-based circular trace event queue (Practical 5) |
| `core/search.c` | `src/core/c/search.c` | `598594AB8879CACC041CBDF08532F6271817F2CA41AF1CDBF12E801E73DF393E` | `598594AB8879CACC041CBDF08532F6271817F2CA41AF1CDBF12E801E73DF393E` | Matched | Verified (Native gcc) | Linear and Binary search step generators |
| `core/api.c` | `src/core/c/api.c` | `4A36F20236D559784A98ED86B4B4F26D48CBF23261B9E36D5E624FD5F49912A5` | `4A36F20236D559784A98ED86B4B4F26D48CBF23261B9E36D5E624FD5F49912A5` | Matched | Verified (Native gcc) | Flat primitive exported C/WASM API interface |

## 2. Test & Calibration Sources (`tests/c/`, `tools/`)

| Original Relative Path | New Relative Path | Original SHA-256 | Copied SHA-256 | Status | Verification Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `tests/test_core.c` | `tests/c/test_core.c` | `139E755730D5EB5467532502970B0C20CDE5219D9091B344D8B68ADD0AB29707` | `139E755730D5EB5467532502970B0C20CDE5219D9091B344D8B68ADD0AB29707` | Matched | Verified (6/6 pass) | Core test harness: sorts, counts, trace replay, hash table, search, stack |
| `tools/calibrate.c` | `tools/calibrate.c` | `1EA3AD6B2D60A3A28CDDF78B266572CE156A4B113CE502435D23F079A6BB5D80` | `1EA3AD6B2D60A3A28CDDF78B266572CE156A4B113CE502435D23F079A6BB5D80` | Matched | Verified (96.50% acc) | Evaluates 1,000 synthetic arrays across 5 patterns, sizes 10..100 |

## 3. WebAssembly Generated Artifacts (`src/core/wasm/`)

| Original Relative Path | New Relative Path | Original SHA-256 | Copied SHA-256 | Status | Verification Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/js/core.js` | `src/core/wasm/core.js` | `452F9CFBC778E3653964CF28C424685C1C14A3DBAAABC68069237CA0218AC6EB` | `452F9CFBC778E3653964CF28C424685C1C14A3DBAAABC68069237CA0218AC6EB` | Matched | **UNVERIFIED (Phase 1 Target)** | Emscripten single-file artifact with embedded base64 wasm binary. Rebuild command documented. |
| `frontend/js/coreApi.js` | `src/core/wasm/coreApi.js` | `83E9E1E09DF33BFCA493936BF42622B20445BA78C7506BB2D235A6292A8303F4` | `83E9E1E09DF33BFCA493936BF42622B20445BA78C7506BB2D235A6292A8303F4` | Matched | **UNVERIFIED (Phase 1 Target)** | Legacy JS wrapper. Preserved as reference for Phase 1 typed TypeScript adapter. |

### WebAssembly Provenance Note
* `core.js` was compiled by Emscripten using `-s SINGLE_FILE=1`, which embeds the compiled `.wasm` bytecode as a Base64 string directly inside the JS glue file.
* Build command from `build.bat`:
  ```cmd
  emcc -O3 core/sorts.c core/analyzer.c core/hashtable.c core/stack.c core/trace.c core/search.c core/api.c ^
      -s WASM=1 ^
      -s SINGLE_FILE=1 ^
      -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" ^
      -s EXPORTED_FUNCTIONS="['_sl_set_value','_sl_analyze','_sl_inversions','_sl_inversion_ratio_x1000','_sl_dup_ratio_x1000','_sl_distinct','_sl_collisions','_sl_max_left_greater','_sl_hash_size','_sl_hash_chain_length','_sl_hash_chain_value','_sl_estimate','_sl_predicted','_sl_reason','_sl_run','_sl_comparisons','_sl_writes','_sl_max_depth','_sl_event_count','_sl_event_type','_sl_event_a','_sl_event_b','_sl_event_c','_sl_event_d','_sl_overflow','_sl_result_value','_sl_make_sorted','_sl_search','_sl_search_comparisons','_sl_search_steps_count','_sl_search_step_index','_sl_search_step_low','_sl_search_step_high']" ^
      -o frontend/js/core.js
  ```
* Per Phase 0 rules, this artifact is explicitly labeled **UNVERIFIED** until full runtime bridge tests are executed in Phase 1.

## 4. Reference Documentation (`docs/reference/`)

| Original Relative Path | New Relative Path | Original SHA-256 | Copied SHA-256 | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `docs/ARCHITECTURE.md` | `docs/reference/ARCHITECTURE.md` | `2E95386256396FF51BBF12E59FD8A27AB7ABF567148E6645B61557A4A8C5779B` | `2E95386256396FF51BBF12E59FD8A27AB7ABF567148E6645B61557A4A8C5779B` | Matched | System architecture v2 specification |
| `docs/PROJECT_SPEC.md` | `docs/reference/PROJECT_SPEC.md` | `8E7E30DDA793B26101F3BE0BCA0DCBB9B9ACFF4979AC080F2CF7DCE1B56ED7B8` | `8E7E30DDA793B26101F3BE0BCA0DCBB9B9ACFF4979AC080F2CF7DCE1B56ED7B8` | Matched | Detailed feature specifications |
| `docs/PROJECT_STATEMENT.md` | `docs/reference/PROJECT_STATEMENT.md` | `F128CBE5AD6DC3FC4A6500D40E40B5BB3838C4591C06018E3698E54D50947F01` | `F128CBE5AD6DC3FC4A6500D40E40B5BB3838C4591C06018E3698E54D50947F01` | Matched | Course 102040304 syllabus problem statement |
| `docs/CALIBRATION.md` | `docs/reference/CALIBRATION.md` | `25CA9F830F0893160EAD69C7E7E5639A4DC52984ED0473DBC03EE8F752EC3CCD` | `25CA9F830F0893160EAD69C7E7E5639A4DC52984ED0473DBC03EE8F752EC3CCD` | Matched | Empirical cost model formulas and benchmark results |
| `docs/COUNTING_RULES.md` | `docs/reference/COUNTING_RULES.md` | `27B6CA338EF686E9051B5CBE97C76002980BD628FF0DE7A069EEC2E1AE3FE8CE` | `27B6CA338EF686E9051B5CBE97C76002980BD628FF0DE7A069EEC2E1AE3FE8CE` | Matched | Strict comparison and write accounting rules |
| `docs/TESTING.md` | `docs/reference/TESTING.md` | `08CCDC2A7E507908527C10138B95279BA6346919552E9F32A8EDC4EA54099CA5` | `08CCDC2A7E507908527C10138B95279BA6346919552E9F32A8EDC4EA54099CA5` | Matched | Test methodology and assertion specifications |
| `docs/VIVA_NOTES.md` | `docs/reference/VIVA_NOTES.md` | `3EF316E4B8AFA2AECC9C55225FAA39CC85D2FE60FFC6C3A6A248118AD8081349` | `3EF316E4B8AFA2AECC9C55225FAA39CC85D2FE60FFC6C3A6A248118AD8081349` | Matched | Academic defense Q&A for CVM University |
