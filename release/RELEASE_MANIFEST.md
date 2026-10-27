# SortLens Release Manifest (v1.0.0)

**Generated:** October 2026  
**Build Target:** `sortlens-rebuild` Static Web Application  
**Package Version:** `0.1.0` (Production Release v1.0.0)  
**Git Working Tree:** Independent Rebuild Workspace (Original `sortlens` pristine on branch `v2`)

---

## 1. System & Toolchain Environment

| Component | Verified Specification |
| :--- | :--- |
| **Operating System** | Windows 10/11 x64 (AMD64) |
| **Node.js Runtime** | v24.12.0 |
| **Package Manager** | npm v11.6.2 |
| **C99 Compiler** | MinGW-w64 GCC 15.2.0 |
| **WebAssembly Target** | Emscripten SDK (embedded base64, `-s SINGLE_FILE=1`) |
| **Frontend Framework** | React v19.3.1 |
| **Type System** | TypeScript v7.0.2 (Strict Mode) |
| **Build Bundler** | Vite v8.3.5 |
| **State Management** | Zustand v5.0.15 |
| **Animation Engine** | Motion v14.5.0 + HTML5 Canvas 2D |
| **Test Runner** | Vitest v5.0.5 |
| **Package Lockfile** | `package-lock.json` (Present, fully locked) |

---

## 2. Verification & Validation Metrics

| Test Domain | Execution Command | Result | Metrics |
| :--- | :--- | :--- | :--- |
| **TypeScript Compilation** | `npm run typecheck` | **PASS** | 0 errors (`tsc --noEmit`) |
| **Automated Test Suite** | `npm run test` | **PASS** | 31 test suites, 214 tests passing (100% pass rate) |
| **Native C99 Tests** | `npm run test:native` | **PASS** | 6/6 test suites passed (`tests/c/test_core.c`) |
| **Empirical Calibration** | `npm run calibrate:native` | **PASS** | 96.50% prediction accuracy across 1,000 synthetic trials |
| **Native/WASM Parity** | `npm run test:parity` | **PASS** | 100% match across all 8 test corpus cases |
| **Real-Browser Automation** | `npm run test:browser` | **PASS** | 8/8 workflows (A–H) passed in Microsoft Edge v155 via CDP |
| **Production Static Build** | `npm run build` | **PASS** | Built in 564ms |

---

## 3. Staged Production Artifacts

### 3.1 Static Directory: `release/SortLens-static/`

| File Relative Path | Size (Bytes) | Size (Gzip) | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| `index.html` | 490 B | 320 B | `250842D452BE4DE0C983F180AB5FC0AA9FD0495131FFC3534DA6529B1B00937F` |
| `assets/index-Bg_Cwofg.css` | 42,634 B | 7.29 kB | `351CE0E43751DF5B4405C4C2D9EA7F7819C74F44A85541E10D41B42CF2AD3448` |
| `assets/index-CivxPR-1.js` | 348,184 B | 104.51 kB | `A03411D90FB5B6E35E20375B5170AD5F4ED950B5C9FF753024F8B58A5E89930C` |
| `assets/__vite-browser-external-cjWwuEFt.js` | 92 B | 100 B | `6B7BC5B7E260D24C89F0196B60B9F6258BC9FF0DA83A5B6A864578F7B2B69A82` |
| `wasm/core.js` | 44,879 B | 15.22 kB | `452F9CFBC778E3653964CF28C424685C1C14A3DBAAABC68069237CA0218AC6EB` |

### 3.2 Compressed Distribution Archive: `release/SortLens-static-v1.0.0.zip`

* **File Path:** `release/SortLens-static-v1.0.0.zip`
* **File Size:** 133,193 Bytes (~130 kB)
* **SHA-256 Checksum:** `E1C1947291B5A211498B5CF282756BF6758F18601332340196688BEDDE9235D5`
* **Contents:**
  - `index.html`
  - `wasm/core.js`
  - `assets/index-Bg_Cwofg.css`
  - `assets/index-CivxPR-1.js`
  - `assets/__vite-browser-external-cjWwuEFt.js`

---

## 4. Authoritative C99 Source Hashes

All 8 foundational C99 algorithmic engine files preserved in `src/core/c/` match their baseline hashes from `docs/SOURCE_MANIFEST.md`:

| File | SHA-256 Checksum |
| :--- | :--- |
| `src/core/c/sortlens.h` | `E2489FDDC138E1C7A127F35D79802C4E6AA3F64F85400319B1912DD84AB5E262` |
| `src/core/c/sorts.c` | `6A25B5089DF510DCED4E45D6F7D2F614CA039C049358F49013A8FDCB61399543` |
| `src/core/c/analyzer.c` | `4B975C99D72B1296F710D8CB0BD243C16023450C088E3AB3AE3450ED70B0FC2B` |
| `src/core/c/hashtable.c` | `CF7CB554EE0C3DD3917BA8F9A359A2CAFD33E5D77E56A877EABDA6296A824E42` |
| `src/core/c/stack.c` | `5E3977E76B679555B96D2747EB1EE64F6D9CDCE6F15BFDC62BFCB185FF147B16` |
| `src/core/c/trace.c` | `C1569C6191B5131EC0D1E741FE3E4251FBB6AFE9DFA8C8E780479A258C58292A` |
| `src/core/c/search.c` | `598594AB8879CACC041CBDF08532F6271817F2CA41AF1CDBF12E801E73DF393E` |
| `src/core/c/api.c` | `4A36F20236D559784A98ED86B4B4F26D48CBF23261B9E36D5E624FD5F49912A5` |

---

## 5. Security & Privacy Audit

* **External Network Calls:** 0 (Completely offline, self-contained application).
* **Telemetry Reporting:** 0 (No third-party analytics, tracking scripts, or beacons).
* **Storage Envelope:** Strictly browser `localStorage` under keys `sortlens_preferences_v1` and `sortlens_history_v1`.
* **Hardcoded Credentials / Secrets:** None.
* **Original Repository Status:** Pristine and untouched on branch `v2`.
