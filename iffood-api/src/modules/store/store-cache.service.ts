import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';
import { FindAllStoreFilters } from './dto/store.core.dto';
import { PaginatedStoresResponseDto } from './dto/store.response.dto';

/** TTL em segundos para a listagem de lojas */
const STORE_LIST_TTL = 30;

@Injectable()
export class StoreCacheService {
  private readonly logger = new Logger(StoreCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | Cluster) {}

  /**
   * Gera uma chave de cache determinística a partir dos filtros da query.
   * Todos os parâmetros relevantes são incluídos para evitar colisões entre
   * páginas ou combinações de filtros diferentes.
   */
  buildKey(filters: FindAllStoreFilters): string {
    // Hash tag {store} — todas as chaves no mesmo slot (Redis Cluster / Valkey)
    const parts = [
      `{store}:list`,
      `p=${filters.page}`,
      `ps=${filters.pageSize}`,
      `n=${filters.name ?? ''}`,
      `wd=${filters.weekday ?? ''}`,
      `h=${filters.hours ?? ''}`,
    ];
    return parts.join(':');
  }

  async get(key: string): Promise<PaginatedStoresResponseDto | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as PaginatedStoresResponseDto;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[cache miss] erro ao ler chave "${key}": ${message}`);
      return null;
    }
  }

  async set(key: string, value: PaginatedStoresResponseDto): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', STORE_LIST_TTL);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[cache write] erro ao gravar chave "${key}": ${message}`,
      );
    }
  }

  /**
   * Invalida todas as entradas de listagem de lojas no cache.
   * Deve ser chamado ao criar, atualizar ou deletar uma loja.
   */
  async invalidateAll(): Promise<void> {
    try {
      const keys = await this.redis.keys('{store}:list*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(
          `[cache invalidate] ${keys.length} chave(s) removidas.`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[cache invalidate] erro: ${message}`);
    }
  }
}
