export class CoreNotInitializedError extends Error {
  constructor(message = 'WebAssembly SortLens core has not been initialized. Call init() first.') {
    super(message);
    this.name = 'CoreNotInitializedError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class TraceOverflowError extends Error {
  constructor(algo: number, count: number) {
    super(`Trace queue overflowed for algorithm ${algo} after reaching ${count} events.`);
    this.name = 'TraceOverflowError';
  }
}

export class CoreRuntimeError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CoreRuntimeError';
  }
}
