import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const coreCode = fs.readFileSync('src/core/wasm/core.js', 'utf8');

new Promise((resolve, reject) => {
  const customModule = {
    print: console.log,
    printErr: console.error,
    onAbort: (msg) => {
      console.error('Module Aborted:', msg);
      reject(new Error(msg));
    },
    onRuntimeInitialized: () => {
      resolve(context.Module);
    }
  };

  const context = {
    Module: customModule,
    console,
    setTimeout,
    clearTimeout,
    require,
    __dirname: path.resolve('src/core/wasm'),
    __filename: path.resolve('src/core/wasm/core.js'),
    process,
    Buffer,
    WebAssembly,
    TextDecoder,
    TextEncoder,
    URL
  };
  context.globalThis = context;
  context.global = context;
  context.window = undefined;

  vm.runInNewContext(coreCode, context);
  setTimeout(() => reject(new Error('Timeout after 3s waiting for onRuntimeInitialized')), 3000);
})
  .then((m) => {
    console.log('SUCCESS! onRuntimeInitialized fired via VM context.');
    console.log('_sl_set_value:', typeof m._sl_set_value);
    m._sl_set_value(0, 10);
    m._sl_set_value(1, 5);
    m._sl_analyze(2, 0);
    console.log('Inversions:', m._sl_inversions());
    console.log('Predicted algo:', m._sl_predicted());
    const reasonPtr = m._sl_reason();
    console.log('Reason:', m.UTF8ToString(reasonPtr));
    m._sl_run(0, 2, 0);
    console.log('Bubble comparisons:', m._sl_comparisons(0));
    console.log('Bubble writes:', m._sl_writes(0));
    console.log('Sorted array [0]:', m._sl_result_value(0, 0), '[1]:', m._sl_result_value(0, 1));
    process.exit(0);
  })
  .catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
