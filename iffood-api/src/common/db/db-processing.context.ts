import { AsyncLocalStorage } from 'async_hooks';

interface DbProcessingStore {
  totalMs: number;
}

export const dbProcessingStorage = new AsyncLocalStorage<DbProcessingStore>();

/**
 * Inicia acumulador por requisição HTTP.
 * enterWith persiste o contexto nas continuações async do handler NestJS/RxJS
 * (run() síncrono perde o store antes das queries TypeORM terminarem).
 */
export function beginDbProcessing(): DbProcessingStore {
  const store = { totalMs: 0 };
  dbProcessingStorage.enterWith(store);
  return store;
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
