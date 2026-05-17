import Redis, { Cluster, ClusterOptions, RedisOptions } from 'ioredis';
import type { ConnectionOptions } from 'tls';

export type RedisClient = Redis | Cluster;

export interface RedisConnectionConfig {
  cluster: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
}

export interface RedisEnvInput {
  REDIS_CLUSTER?: boolean | string;
  REDIS_HOST?: string;
  REDIS_PORT?: number | string;
  REDIS_URL?: string;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
  REDIS_TLS?: boolean | string;
}

function isElastiCacheClusterEndpoint(host: string): boolean {
  return host.startsWith('clustercfg.');
}

/**
 * TLS para ElastiCache/Valkey: certificado cobre o hostname do clustercfg, não os IPs
 * dos nós retornados por CLUSTER SLOTS — sem isso ocorre "Failed to refresh slots cache".
 */
function buildTlsOptions(configEndpointHost: string): ConnectionOptions {
  return {
    servername: configEndpointHost,
    checkServerIdentity: () => undefined,
  };
}

/** Ajusta cluster/TLS para endpoints ElastiCache (clustercfg.* exige modo cluster + TLS). */
export function applyRedisHostHeuristics(
  config: RedisConnectionConfig,
  env: RedisEnvInput,
): RedisConnectionConfig {
  let { cluster, tls, host } = config;

  if (isElastiCacheClusterEndpoint(host)) {
    if (env.REDIS_CLUSTER === 'false' || env.REDIS_CLUSTER === false) {
      console.warn(
        '[Redis] host clustercfg.* ignorou REDIS_CLUSTER=false — use cluster mode',
      );
    }
    cluster = true;
  }

  return { ...config, cluster, tls, host };
}

/** Resolve host/port a partir de REDIS_HOST ou REDIS_URL (dev local). */
export function resolveRedisConfig(env: RedisEnvInput): RedisConnectionConfig {
  const cluster =
    env.REDIS_CLUSTER === true ||
    env.REDIS_CLUSTER === 'true' ||
    env.REDIS_CLUSTER === '1';

  let host = env.REDIS_HOST?.trim();
  let port = Number(env.REDIS_PORT ?? 6379);
  const username = env.REDIS_USERNAME?.trim() || undefined;
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

  return applyRedisHostHeuristics(
    { cluster, host, port, username, password, tls },
    env,
  );
}

function authRedisOptions(config: RedisConnectionConfig): Pick<
  RedisOptions,
  'username' | 'password'
> {
  return {
    ...(config.username ? { username: config.username } : {}),
    ...(config.password ? { password: config.password } : {}),
  };
}

/** Opções por conexão a um nó do cluster (sem host/port — vêm do CLUSTER SLOTS). */
function clusterNodeRedisOptions(config: RedisConnectionConfig): RedisOptions {
  return {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    connectTimeout: 10_000,
    commandTimeout: 5_000,
    family: 4,
    ...authRedisOptions(config),
    ...(config.tls ? { tls: buildTlsOptions(config.host) } : {}),
  };
}

function standaloneRedisOptions(config: RedisConnectionConfig): RedisOptions {
  return {
    host: config.host,
    port: config.port,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: 10_000,
    ...authRedisOptions(config),
    ...(config.tls ? { tls: buildTlsOptions(config.host) } : {}),
  };
}

/**
 * Evita que o ioredis substitua hostnames por IP após CLUSTER SLOTS (quebra TLS no ElastiCache).
 */
function elasticacheDnsLookup(
  address: string,
  callback: (err: Error | null, address: string) => void,
): void {
  callback(null, address);
}

/**
 * Instancia ioredis em modo Cluster (ElastiCache clustercfg / Valkey) ou Standalone (dev).
 */
export function createRedisClient(config: RedisConnectionConfig): RedisClient {
  if (config.cluster) {
    const clusterOptions: ClusterOptions = {
      redisOptions: clusterNodeRedisOptions(config),
      dnsLookup: elasticacheDnsLookup,
      enableReadyCheck: false,
      scaleReads: 'master',
      slotsRefreshTimeout: 10_000,
      slotsRefreshInterval: 30_000,
      clusterRetryStrategy: (times) => Math.min(times * 200, 5_000),
    };

    return new Redis.Cluster(
      [{ host: config.host, port: config.port }],
      clusterOptions,
    );
  }

  return new Redis(standaloneRedisOptions(config));
}

const ERROR_LOG_THROTTLE_MS = 30_000;

type ClusterFailedError = Error & { lastNodeError?: Error };

export function formatRedisError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);

  const clusterErr = err as ClusterFailedError;
  const parts = [err.message];
  if (clusterErr.lastNodeError) {
    parts.push(`lastNode: ${clusterErr.lastNodeError.message}`);
  }
  return parts.join(' | ');
}

export function attachRedisErrorLogger(
  client: RedisClient,
  label = 'Redis',
): void {
  let lastLoggedAt = 0;

  client.on('error', (err: Error) => {
    const now = Date.now();
    if (now - lastLoggedAt < ERROR_LOG_THROTTLE_MS) return;
    lastLoggedAt = now;
    console.error(`[${label}] connection error:`, formatRedisError(err));
  });
}

/** Valida conectividade no bootstrap (loga causa raiz do CLUSTER SLOTS). */
export async function verifyRedisConnection(
  client: RedisClient,
  config: RedisConnectionConfig,
): Promise<void> {
  try {
    const pong = await client.ping();
    console.log(`[Redis] PING OK (${pong})`);
  } catch (err) {
    console.error(`[Redis] PING falhou: ${formatRedisError(err)}`);
    console.error(
      `[Redis] config: cluster=${config.cluster} host=${config.host}:${config.port} tls=${config.tls} user=${config.username ? 'sim' : 'não'}`,
    );
    if (config.cluster) {
      console.error(
        '[Redis] ElastiCache cluster: REDIS_TLS deve ser true se "Encryption in-transit" estiver ON; false se OFF. Confira SG (6379) e AUTH (REDIS_PASSWORD / REDIS_USERNAME).',
      );
    }
  }
}
