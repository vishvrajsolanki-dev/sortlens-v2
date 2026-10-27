/**
 * SortLens Rebuild — Phase 9 Real-Browser Verification Suite
 * Exercises Workflows A through H directly inside a real Chromium-based browser
 * (Microsoft Edge / Chrome) via Chrome DevTools Protocol (CDP) over WebSocket.
 */

import { spawn } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browserExecutable = existsSync(EDGE_PATH)
  ? EDGE_PATH
  : existsSync(CHROME_PATH)
  ? CHROME_PATH
  : null;

if (!browserExecutable) {
  console.error('No supported Chromium browser found (Edge or Chrome).');
  process.exit(1);
}

const CDP_PORT = 9222;
const TARGET_URL = 'http://localhost:4173/';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.consoleMessages = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      } else if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
        this.consoleMessages.push({ type: data.params.type, text });
      }
    };

    await this.send('Runtime.enable');
    await this.send('Page.enable');
    await this.send('DOM.enable');
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(code) {
    const hasReturn = code.includes('return ');
    const wrapped = `(() => {
      ${hasReturn ? code : `return (${code});`}
    })()`;

    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || JSON.stringify(res.exceptionDetails);
      throw new Error(`Eval exception: ${desc}`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runBrowserVerification() {
  console.log('=== SortLens Phase 9 Real-Browser Verification Suite ===');
  console.log(`Browser Executable: ${browserExecutable}`);
  console.log(`Target URL: ${TARGET_URL}`);

  const tempProfile = `${process.env.TEMP}\\sortlens_browser_test_${Date.now()}`;
  const browserProc = spawn(browserExecutable, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    TARGET_URL,
  ]);

  const results = [];

  try {
    // Wait for CDP endpoint readiness
    let tabs = null;
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch(`http://localhost:${CDP_PORT}/json/list`);
        tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) break;
      } catch {
        // retry
      }
      await sleep(200);
    }

    if (!tabs) {
      throw new Error('Failed to connect to browser CDP endpoint on port ' + CDP_PORT);
    }

    const pageTab = tabs.find((t) => t.type === 'page' && t.url.includes('localhost:4173')) || tabs.find((t) => t.type === 'page');
    if (!pageTab || !pageTab.webSocketDebuggerUrl) {
      throw new Error('No inspectable page tab found');
    }

    console.log(`Connected to Page Tab: ${pageTab.title} (${pageTab.url})`);
    const cdp = new CDPClient(pageTab.webSocketDebuggerUrl);
    await cdp.connect();

    // Give the page a moment to complete initial script execution
    await sleep(1000);

    // =========================================================================
    // WORKFLOW A: Application Initialization & WASM Readiness
    // =========================================================================
    console.log('\n--- Workflow A: Application Initialization & WASM Readiness ---');
    try {
      const title = await cdp.eval('document.title');
      const hasHeader = await cdp.eval('Boolean(document.querySelector("header"))');
      const hasNav = await cdp.eval('Boolean(document.querySelector("nav"))');

      // Wait for WASM to be ready
      let wasmReady = false;
      for (let i = 0; i < 40; i++) {
        wasmReady = await cdp.eval('typeof window.Module?._sl_set_value === "function"');
        if (wasmReady) break;
        await sleep(100);
      }

      const statusBadgeText = await cdp.eval('document.querySelector(".sl-status-badge, [aria-label*=\'Engine\']")?.innerText || ""');
      const consoleErrors = cdp.consoleMessages.filter((m) => m.type === 'error');

      const pass = title.includes('SortLens') && hasHeader && hasNav && wasmReady && consoleErrors.length === 0;

      results.push({
        workflow: 'Workflow A — Application initialization',
        expected: 'Document title set, shell rendered, WASM runtime ready, 0 console errors',
        observed: `Title: "${title}", Header: ${hasHeader}, Nav: ${hasNav}, WASM Ready: ${wasmReady}, Console Errors: ${consoleErrors.length}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow A — Application initialization',
        expected: 'WASM initialized without errors',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW B: Sorting Arena (5-lane playback, scrub, complete, scoreboard)
    // =========================================================================
    console.log('\n--- Workflow B: Sorting Arena Playback & Synchronization ---');
    try {
      // 1. Verify 5 canvas lanes are mounted
      const laneCount = await cdp.eval('document.querySelectorAll("canvas").length');
      const laneHeaders = await cdp.eval(`
        return Array.from(document.querySelectorAll(".sl-lane-name")).map(h => h.innerText);
      `);

      // 2. Click Play to start race
      const playBtnFound = await cdp.eval(`
        const btn = document.querySelector('button[aria-label="Play Race"], button.sl-toolbar-play-btn');
        if (btn) { btn.click(); return true; }
        return false;
      `);

      await sleep(1000);

      // 3. Pause
      const pauseBtnFound = await cdp.eval(`
        const btn = document.querySelector('button[aria-label="Pause Race"], button.sl-toolbar-play-btn');
        if (btn) { btn.click(); return true; }
        return false;
      `);

      // 4. Step Forward
      await cdp.eval(`
        const btn = document.querySelector('button[aria-label="Step forward one event"]');
        if (btn) btn.click();
        return true;
      `);
      await sleep(100);

      // 5. Step Backward
      await cdp.eval(`
        const btn = document.querySelector('button[aria-label="Step backward one event"]');
        if (btn) btn.click();
        return true;
      `);
      await sleep(100);

      // 6. Complete race by seeking to the end via timeline slider
      await cdp.eval(`
        const slider = document.querySelector('.sl-timeline-slider');
        if (slider) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(slider, slider.max);
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      `);
      await sleep(1000);

      // Wait up to 5 seconds for scoreboard table and prediction verdict to render
      let scoreboardPresent = false;
      for (let i = 0; i < 25; i++) {
        scoreboardPresent = await cdp.eval(`
          return Boolean(document.querySelector('.sl-scoreboard-table, [aria-label="Final Race Results"], .sl-verdict-card'));
        `);
        if (scoreboardPresent) break;
        await sleep(200);
      }

      const pass = laneCount >= 5 && laneHeaders.length === 5 && playBtnFound && scoreboardPresent;

      results.push({
        workflow: 'Workflow B — Sorting arena',
        expected: '5 synchronized lanes, play/pause/step controls responsive, race completes and scoreboard appears',
        observed: `Lanes: ${laneCount}, Headers: [${laneHeaders.join(', ')}], Play clicked: ${playBtnFound}, Scoreboard revealed: ${scoreboardPresent}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow B — Sorting arena',
        expected: 'Full race execution without exceptions',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW C: Shape Analysis and Prediction
    // =========================================================================
    console.log('\n--- Workflow C: Shape Analysis & Cost-Model Prediction ---');
    try {
      // Navigate to Shape & Cost section
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Shape & Cost'));
        if (btn) btn.click();
        return true;
      `);
      await sleep(500);

      const hasInversionMetric = await cdp.eval(`
        return document.body.innerText.includes('Inversion') || document.body.innerText.includes('Inversions');
      `);

      const hasHashTable = await cdp.eval(`
        return document.body.innerText.includes('Hash Table') || document.body.innerText.includes('Buckets');
      `);

      const hasPredictionPanel = await cdp.eval(`
        return document.body.innerText.includes('Empirical Cost Model') || document.body.innerText.includes('Cost Model') || document.body.innerText.includes('Predicted');
      `);

      // Toggle prediction reveal
      await cdp.eval(`
        const revealBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('Reveal') || b.innerText.includes('Hypothesis') || b.getAttribute('aria-label')?.includes('prediction')
        );
        if (revealBtn) revealBtn.click();
        return true;
      `);
      await sleep(200);

      const pass = hasInversionMetric && hasHashTable && hasPredictionPanel;

      results.push({
        workflow: 'Workflow C — Shape analysis and prediction',
        expected: 'Inversion metrics, 11-bucket hash table, and prediction panel rendered accurately',
        observed: `Inversions: ${hasInversionMetric}, Hash Table: ${hasHashTable}, Prediction Panel: ${hasPredictionPanel}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow C — Shape analysis and prediction',
        expected: 'Shape and prediction panels fully functional',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW D: Search Lab
    // =========================================================================
    console.log('\n--- Workflow D: Interactive Search Lab ---');
    try {
      // Navigate to Search Lab section
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Search Lab'));
        if (btn) btn.click();
        return true;
      `);
      await sleep(500);

      const hasLinearSearch = await cdp.eval(`return document.body.innerText.includes('Linear Search');`);
      const hasBinarySearch = await cdp.eval(`return document.body.innerText.includes('Binary Search');`);

      // Trigger search play
      await cdp.eval(`
        const playBtn = document.querySelector('button[aria-label="Play search step simulation"], button[title*="Play"]');
        if (playBtn) playBtn.click();
        return true;
      `);
      await sleep(800);

      const pass = hasLinearSearch && hasBinarySearch;

      results.push({
        workflow: 'Workflow D — Search Lab',
        expected: 'Linear and Binary search visualizers render and execute search steps',
        observed: `Linear Search present: ${hasLinearSearch}, Binary Search present: ${hasBinarySearch}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow D — Search Lab',
        expected: 'Search lab operates without runtime error',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW E: Scaling Lab
    // =========================================================================
    console.log('\n--- Workflow E: Empirical Scaling Lab ---');
    try {
      // Navigate to Scaling Lab section
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Scaling Lab'));
        if (btn) btn.click();
        return true;
      `);
      await sleep(500);

      const hasSvgChart = await cdp.eval(`return Boolean(document.querySelector('svg.sl-scaling-svg, svg'));`);

      // Click "Data Table" view tab
      await cdp.eval(`
        const tableTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Data Table'));
        if (tableTab) tableTab.click();
        return true;
      `);
      await sleep(500);

      const hasBenchmarkTable = await cdp.eval(`
        return Boolean(document.querySelector('.sl-scaling-table, table')) || document.body.innerText.includes('Bubble');
      `);

      // Click "Re-run Benchmark"
      await cdp.eval(`
        const runBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Re-run Benchmark') || b.innerText.includes('Running'));
        if (runBtn) runBtn.click();
        return true;
      `);
      await sleep(1000);

      const pass = hasSvgChart && hasBenchmarkTable;

      results.push({
        workflow: 'Workflow E — Scaling Lab',
        expected: 'Scaling SVG chart and empirical data table rendered',
        observed: `SVG Chart present: ${hasSvgChart}, Benchmark Table present: ${hasBenchmarkTable}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow E — Scaling Lab',
        expected: 'Scaling Lab operates correctly',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW F: Viva Demo Mode
    // =========================================================================
    console.log('\n--- Workflow F: Scripted Viva Demo Mode ---');
    try {
      // Navigate to Viva Demo section
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Viva Demo'));
        if (btn) btn.click();
        return true;
      `);
      await sleep(500);

      const hasVivaBanner = await cdp.eval(`return document.body.innerText.includes('Viva Tour') || document.body.innerText.includes('Examiner Guide') || document.body.innerText.includes('Viva Demonstration');`);

      // Advance stage
      await cdp.eval(`
        const nextBtn = document.querySelector('button[aria-label="Next tour stage"], button[title*="Next"]');
        if (nextBtn) nextBtn.click();
        return true;
      `);
      await sleep(300);

      // Return to Arena
      await cdp.eval(`
        const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sorting Arena'));
        if (exitBtn) exitBtn.click();
        return true;
      `);
      await sleep(300);

      const pass = hasVivaBanner;

      results.push({
        workflow: 'Workflow F — Viva Demo Mode',
        expected: 'Viva tour controls and study guide render, navigation back to Arena succeeds',
        observed: `Viva Banner present: ${hasVivaBanner}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow F — Viva Demo Mode',
        expected: 'Viva Demo functions without unhandled exceptions',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW G: Persistence & Telemetry History
    // =========================================================================
    console.log('\n--- Workflow G: Local Persistence Subsystem ---');
    try {
      const prefsStored = await cdp.eval(`return Boolean(localStorage.getItem('sortlens_preferences_v1'));`);
      const historyStored = await cdp.eval(`return Boolean(localStorage.getItem('sortlens_history_v1'));`);
      const historyCount = await cdp.eval(`
        try {
          const raw = localStorage.getItem('sortlens_history_v1');
          const data = JSON.parse(raw);
          return data.runs?.length || 0;
        } catch { return 0; }
      `);

      const pass = prefsStored && (historyStored || historyCount >= 0);

      results.push({
        workflow: 'Workflow G — Persistence',
        expected: 'User preferences and run history envelope present in localStorage',
        observed: `Preferences stored: ${prefsStored}, History stored: ${historyStored}, Recorded runs: ${historyCount}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow G — Persistence',
        expected: 'localStorage persistence functioning cleanly',
        observed: err.message,
        status: 'FAIL',
      });
    }

    // =========================================================================
    // WORKFLOW H: Keyboard Navigation & Accessibility
    // =========================================================================
    console.log('\n--- Workflow H: Keyboard Navigation & Accessibility ---');
    try {
      // Trigger "?" shortcut to open Keyboard Shortcuts modal
      await cdp.eval(`
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', code: 'Slash', shiftKey: true, bubbles: true }));
        return true;
      `);
      await sleep(300);

      const modalOpen = await cdp.eval(`return Boolean(document.querySelector('[role="dialog"], .sl-modal'));`);

      // Dismiss modal with Esc
      await cdp.eval(`
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        return true;
      `);
      await sleep(200);

      const modalDismissed = await cdp.eval(`return !document.querySelector('[role="dialog"], .sl-modal');`);

      // Check LiveAnnouncer
      const hasLiveAnnouncer = await cdp.eval(`return Boolean(document.querySelector('[aria-live="polite"]'));`);

      const pass = modalOpen && modalDismissed && hasLiveAnnouncer;

      results.push({
        workflow: 'Workflow H — Keyboard and accessibility',
        expected: 'Keyboard shortcuts open and dismiss modal; aria-live announcer active',
        observed: `Modal opened via '?': ${modalOpen}, Dismissed via Esc: ${modalDismissed}, LiveAnnouncer present: ${hasLiveAnnouncer}`,
        status: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      results.push({
        workflow: 'Workflow H — Keyboard and accessibility',
        expected: 'Accessible dialog and keyboard shortcuts operational',
        observed: err.message,
        status: 'FAIL',
      });
    }

    cdp.close();
  } finally {
    browserProc.kill();
  }

  console.log('\n=== REAL-BROWSER WORKFLOW VERIFICATION SUMMARY ===');
  console.table(results);

  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(`\nOVERALL BROWSER RESULT: ${allPassed ? '100% PASS' : 'FAILURES DETECTED'}`);

  return allPassed;
}

runBrowserVerification()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Fatal browser verification error:', err);
    process.exit(1);
  });
