// coreApi.js - Lightweight JavaScript wrapper for WebAssembly SortLens Core
// Exposes clean, plain-object interfaces for analysis, sorts, traces, and searches.

var SortLensCore = (function() {
    var isReady = false;
    var readyCallbacks = [];

    // Check if Module is already initialized
    function checkReady() {
        if (typeof Module !== 'undefined' && Module._sl_set_value) {
            isReady = true;
            for (var i = 0; i < readyCallbacks.length; i++) {
                readyCallbacks[i]();
            }
            readyCallbacks = [];
        } else {
            setTimeout(checkReady, 30);
        }
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('load', checkReady);
    }
    checkReady();

    function onReady(cb) {
        if (isReady) {
            cb();
        } else {
            readyCallbacks.push(cb);
        }
    }

    // Set input array and run shape analysis + cost model
    function analyze(arr, judgeBy) {
        if (!isReady) throw new Error("Core WASM not ready");
        var n = arr.length;
        for (var i = 0; i < n; i++) {
            Module._sl_set_value(i, arr[i]);
        }
        Module._sl_analyze(n, judgeBy);

        var estimates = [];
        for (var a = 0; a < 5; a++) {
            estimates.push(Number(Module._sl_estimate(a)));
        }

        var reasonPtr = Module._sl_reason();
        var reasonStr = Module.UTF8ToString ? Module.UTF8ToString(reasonPtr) : "Predicted based on shape analysis.";

        return {
            inversions: Number(Module._sl_inversions()),
            inversionRatio: Module._sl_inversion_ratio_x1000() / 1000.0,
            duplicateRatio: Module._sl_dup_ratio_x1000() / 1000.0,
            distinct: Module._sl_distinct(),
            collisions: Module._sl_collisions(),
            maxLeftGreater: Module._sl_max_left_greater(),
            estimates: estimates,
            predictedAlgo: Module._sl_predicted(),
            reason: reasonStr
        };
    }

    // Run a specific algorithm and extract counters and event trace
    function runSort(algo, n, record) {
        if (!isReady) throw new Error("Core WASM not ready");
        Module._sl_run(algo, n, record ? 1 : 0);

        var comparisons = Number(Module._sl_comparisons(algo));
        var writes = Number(Module._sl_writes(algo));
        var maxDepth = Module._sl_max_depth(algo);
        var overflow = Module._sl_overflow(algo);
        var eventCount = Module._sl_event_count(algo);

        var events = [];
        if (record) {
            for (var k = 0; k < eventCount; k++) {
                events.push({
                    type: Module._sl_event_type(algo, k),
                    a: Module._sl_event_a(algo, k),
                    b: Module._sl_event_b(algo, k),
                    c: Module._sl_event_c(algo, k),
                    d: Module._sl_event_d(algo, k)
                });
            }
        }

        var finalArray = [];
        for (var i = 0; i < n; i++) {
            finalArray.push(Module._sl_result_value(algo, i));
        }

        return {
            algo: algo,
            comparisons: comparisons,
            writes: writes,
            maxDepth: maxDepth,
            overflow: overflow,
            eventCount: eventCount,
            events: events,
            finalArray: finalArray
        };
    }

    // Query hash table chains for animation/visualization
    function getHashTableData() {
        var size = Module._sl_hash_size();
        var buckets = [];
        for (var b = 0; b < size; b++) {
            var len = Module._sl_hash_chain_length(b);
            var chain = [];
            for (var k = 0; k < len; k++) {
                chain.push(Module._sl_hash_chain_value(b, k));
            }
            buckets.push(chain);
        }
        return buckets;
    }

    // Prepare sorted array for Search Lab and perform search
    function makeSorted(n) {
        Module._sl_make_sorted(n);
    }

    function search(kind, target, n) {
        var foundIndex = Module._sl_search(kind, target, n);
        var comparisons = Module._sl_search_comparisons();
        var numSteps = Module._sl_search_steps_count();
        var steps = [];
        for (var k = 0; k < numSteps; k++) {
            steps.push({
                index: Module._sl_search_step_index(k),
                low: Module._sl_search_step_low(k),
                high: Module._sl_search_step_high(k)
            });
        }
        return {
            foundIndex: foundIndex,
            comparisons: comparisons,
            steps: steps
        };
    }

    var api = {
        onReady: onReady,
        isReady: function() { return isReady; },
        analyze: analyze,
        runSort: runSort,
        getHashTableData: getHashTableData,
        makeSorted: makeSorted,
        search: search
    };

    if (typeof globalThis !== 'undefined') {
        globalThis.SortLensCore = api;
    }
    return api;
})();
