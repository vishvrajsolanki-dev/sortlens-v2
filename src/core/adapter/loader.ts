import type { RawWasmModule } from './types';
import { CoreRuntimeError } from './errors';

let cachedModule: RawWasmModule | null = null;
let initPromise: Promise<RawWasmModule> | null = null;

function isNodeRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    Boolean(process.versions?.node)
  );
}

/**
 * Loads and initializes the WebAssembly SortLens C99 core.
 * Safe across both browser (Vite) and Node/JSDOM (Vitest) environments.
 */
export async function loadWasmModule(): Promise<RawWasmModule> {
  if (cachedModule) {
    return cachedModule;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise<RawWasmModule>((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      reject(new CoreRuntimeError('Timeout waiting for WebAssembly core initialization (5000ms).'));
    }, 5000);

    const onReady = (m: RawWasmModule) => {
      clearTimeout(timeoutTimer);
      cachedModule = m;
      resolve(m);
    };

    if (isNodeRuntime()) {
      // Node.js or Vitest / JSDOM execution
      loadInNodeEnvironment(onReady, (err) => {
        clearTimeout(timeoutTimer);
        reject(new CoreRuntimeError('Failed to load WASM module in Node environment', err));
      });
    } else {
      // Browser execution
      loadInBrowserEnvironment(onReady, (err) => {
        clearTimeout(timeoutTimer);
        reject(new CoreRuntimeError('Failed to load WASM module in browser environment', err));
      });
    }
  });

  return initPromise;
}

function loadInNodeEnvironment(
  onReady: (m: RawWasmModule) => void,
  onError: (err: unknown) => void
): void {
  try {
    // Dynamic import to avoid bundling node:fs / node:vm into browser builds
    Promise.all([
      import('node:fs'),
      import('node:path'),
      import('node:vm'),
      import('node:module'),
    ])
      .then(([fs, path, vm, modulePkg]) => {
        const corePath = path.resolve(__dirname, '../wasm/core.js');
        const coreCode = fs.readFileSync(corePath, 'utf8');

        const customModule: Record<string, unknown> = {
          onRuntimeInitialized: () => {
            onReady(context.Module as unknown as RawWasmModule);
          },
          print: () => {},
          printErr: (msg: string) => console.error('[WASM core err]', msg),
          onAbort: (msg: string) => onError(new Error(`WASM Aborted: ${msg}`)),
        };

        const requireFn = modulePkg.createRequire(import.meta.url);

        const context: Record<string, unknown> = {
          Module: customModule,
          console,
          setTimeout,
          clearTimeout,
          require: requireFn,
          __dirname: path.dirname(corePath),
          __filename: corePath,
          process,
          Buffer,
          WebAssembly,
          TextDecoder,
          TextEncoder,
          URL,
        };
        context.globalThis = context;
        context.global = context;

        vm.runInNewContext(coreCode, context);
      })
      .catch(onError);
  } catch (err) {
    onError(err);
  }
}

function loadInBrowserEnvironment(
  onReady: (m: RawWasmModule) => void,
  onError: (err: unknown) => void
): void {
  try {
    const win = window as unknown as Window & { Module?: Record<string, unknown> };

    if (win.Module && typeof win.Module['_sl_set_value'] === 'function') {
      onReady(win.Module as unknown as RawWasmModule);
      return;
    }

    win.Module = {
      ...win.Module,
      onRuntimeInitialized: () => {
        onReady(win.Module as unknown as RawWasmModule);
      },
      print: () => {},
      printErr: (msg: string) => console.error('[WASM core err]', msg),
      onAbort: (msg: string) => onError(new Error(`WASM Aborted: ${msg}`)),
    };

    // Check if script is already present
    const existingScript = document.querySelector('script[data-sortlens-wasm]');
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-sortlens-wasm', 'true');
    script.src = import.meta.env?.PROD ? '/wasm/core.js' : '/src/core/wasm/core.js';
    script.async = true;
    script.onerror = (e) => onError(new Error(`Failed to load script ${script.src}: ${String(e)}`));
    document.head.appendChild(script);
  } catch (err) {
    onError(err);
  }
}
