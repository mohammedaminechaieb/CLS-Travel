import { MemoryStore } from './memory-store';

describe('MemoryStore', () => {
  let store: MemoryStore;
  beforeEach(() => {
    jest.useFakeTimers();
    store = new MemoryStore();
  });
  afterEach(() => {
    store.onModuleDestroy();
    jest.useRealTimers();
  });

  it('expires values after their TTL', () => {
    store.set('k', 'v', 60);
    expect(store.get('k')).toBe('v');
    jest.advanceTimersByTime(61_000);
    expect(store.get('k')).toBeNull();
  });

  it('getdel returns the value once (one-time tokens)', () => {
    store.set('reset', 'user-1', 3600);
    expect(store.getdel('reset')).toBe('user-1');
    expect(store.getdel('reset')).toBeNull();
  });

  it('sweeps expired entries to bound memory', () => {
    store.set('a', '1', 1);
    store.set('b', '2', 3600);
    store.sweep(Date.now() + 5_000);
    expect(store.size).toBe(1);
  });
});
