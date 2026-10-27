import { describe, it, expect } from 'vitest';
import { createCoreClient } from '../adapter/createCoreClient';
import { CoreNotInitializedError } from '../adapter/errors';

describe('WebAssembly Core Runtime & Initialization', () => {
  it('throws CoreNotInitializedError if client is used before init()', () => {
    const client = createCoreClient();
    expect(client.isReady()).toBe(false);
    expect(() => client.setInputArray([1, 2, 3])).toThrow(CoreNotInitializedError);
    expect(() => client.analyze([1, 2, 3])).toThrow(CoreNotInitializedError);
    expect(() => client.runSort(0)).toThrow(CoreNotInitializedError);
  });

  it('initializes successfully and reports isReady() === true', async () => {
    const client = createCoreClient();
    await client.init();
    expect(client.isReady()).toBe(true);
  });

  it('handles multiple calls to init() idempotently', async () => {
    const client = createCoreClient();
    await client.init();
    await client.init(); // second call should resolve immediately
    expect(client.isReady()).toBe(true);
  });
});
