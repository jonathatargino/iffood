import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'ci')
    .default('development'),
  PORT: Joi.number().default(3006),
  DB_URL: Joi.string().uri().required(),
  DB_TYPE: Joi.string().valid('postgres', 'mysql').default('postgres'),
  SUPABASE_URL: Joi.string().min(32).required(),
  AWS_BUCKET_NAME: Joi.string().required(),
  AWS_REGION: Joi.string().required(),
  AWS_DEFAULT_REGION: Joi.string().required(),
  /** Dev local: fallback quando REDIS_HOST não está definido. */
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  /** Hostname puro (sem redis://). Obrigatório em produção com ElastiCache cluster. */
  REDIS_HOST: Joi.string().hostname().optional(),
  REDIS_PORT: Joi.number().port().default(6379),
  /** true = ioredis Cluster (clustercfg.*.cache.amazonaws.com). false = standalone. */
  REDIS_CLUSTER: Joi.boolean().default(false),
  /** ElastiCache RBAC / ACL (Valkey 7+). */
  REDIS_USERNAME: Joi.string().optional().allow(''),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_TLS: Joi.boolean().default(false),
  /** LocalStack apenas; em produção omitir para o SDK usar o endpoint regional da AWS. */
  SQS_ENDPOINT: Joi.string().uri().optional().allow(''),
  SQS_QUEUE_URL: Joi.string().uri().default('http://localhost:4566/000000000000/order-requests'),
});
