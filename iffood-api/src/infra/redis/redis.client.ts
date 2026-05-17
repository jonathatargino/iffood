import Redis, { Cluster, ClusterOptions, RedisOptions } from 'ioredis';

export type RedisClient = Redis | Cluster;

export interface RedisConnectionConfig {
  cluster: boolean;
  host: string;
  port: number;
  password?: string;
  tls: boolean;
}

export interface RedisEnvInput {
  REDIS_CLUSTER?: boolean | string;
  REDIS_HOST?: string;
  REDIS_PORT?: number | string;
  REDIS_URL?: string;
  REDIS_PASSWORD?: string;
  REDIS_TLS?: boolean | string;
}

/** Resolve host/port a partir de REDIS_HOST ou REDIS_URL (dev local). */
export function resolveRedisConfig(env: RedisEnvInput): RedisConnectionConfig {
  const cluster =
    env.REDIS_CLUSTER === true ||
    env.REDIS_CLUSTER === 'true' ||
    env.REDIS_CLUSTER === '1';

  let host = env.REDIS_HOST?.trim();
  let port = Number(env.REDIS_PORT ?? 6379);
  let password = env.REDIS_PASSWORD?.trim() || undefined;
  let tls = env.REDIS_TLS === true || env.REDIS_TLS === 'true';

  if (!host && env.REDIS_URL) {
    const parsed = new URL(env.REDIS_URL);
    host = parsed.hostname;
    port = Number(parsed.port || 6379);
    if (!password && parsed.password) password = parsed.password;
    if (!tls && parsed.protocol === 'rediss:') tls = true;
  }

  if (!host) host = 'localhost';

  return { cluster, host, port, password, tls };
}

function baseRedisOptions(config: RedisConnectionConfig): RedisOptions {
  return {
    host: config.host,
    port: config.port,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    ...(config.password ? { password: config.password } : {}),
    ...(config.tls ? { tls: {} } : {}),
  };
}

/**
 * Instancia ioredis em modo Cluster (ElastiCache clustercfg / Valkey) ou Standalone (dev).
 * Em cluster, use o hostname de configuração AWS sem prefixo redis://.
 */
export function createRedisClient(config: RedisConnectionConfig): RedisClient {
  if (config.cluster) {
    const clusterOptions: ClusterOptions = {
      redisOptions: baseRedisOptions(config),
      enableReadyCheck: true,
      scaleReads: 'master',
      slotsRefreshTimeout: 5000,
      slotsRefreshInterval: 10_000,
    };

    return new Redis.Cluster(
      [{ host: config.host, port: config.port }],
      clusterOptions,
    );
  }

  return new Redis(baseRedisOptions(config));
}

export function attachRedisErrorLogger(
  client: RedisClient,
  label = 'Redis',
): void {
  client.on('error', (err: Error) => {
    console.error(`[${label}] connection error:`, err.message);
  });
}
