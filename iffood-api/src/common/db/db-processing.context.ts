import { AsyncLocalStorage } from 'async_hooks';

interface DbProcessingStore {
  totalMs: number;
}

export const dbProcessingStorage = new AsyncLocalStorage<DbProcessingStore>();

export function runWithDbProcessingContext<T>(fn: () => T): T {
  return dbProcessingStorage.run({ totalMs: 0 }, fn);
}

export function addDbProcessingMs(ms: number): void {
  const store = dbProcessingStorage.getStore();
  if (store) {
    store.totalMs += ms;
  }
}

export function getDbProcessingMs(): number {
  return dbProcessingStorage.getStore()?.totalMs ?? 0;
}
