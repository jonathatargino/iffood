import { DataSource, EntityManager } from 'typeorm';
import { addDbProcessingMs } from './db-processing.context';

async function runMeasured<T>(
  startedAt: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn();
    addDbProcessingMs(performance.now() - startedAt);
    return result;
  } catch (err) {
    addDbProcessingMs(performance.now() - startedAt);
    throw err;
  }
}

/**
 * Executa trabalho de banco medindo apenas o tempo após obter conexão do pool.
 * A espera em queryRunner.connect() fica fora da métrica (connection starvation).
 */
export async function measureDb<T>(
  dataSource: DataSource,
  fn: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    const startedAt = performance.now();
    return await runMeasured(startedAt, () => fn(queryRunner.manager));
  } finally {
    await queryRunner.release();
  }
}

/**
 * Transação medida: cronômetro inicia após connect(), não inclui fila do pool.
 */
export async function measureDbTransaction<T>(
  dataSource: DataSource,
  fn: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    const startedAt = performance.now();
    await queryRunner.startTransaction();

    try {
      const result = await fn(queryRunner.manager);
      await queryRunner.commitTransaction();
      addDbProcessingMs(performance.now() - startedAt);
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      addDbProcessingMs(performance.now() - startedAt);
      throw err;
    }
  } finally {
    await queryRunner.release();
  }
}
