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
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_DEFAULT_REGION: Joi.string().required(),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  SQS_QUEUE_URL: Joi.string().uri().default('http://localhost:4566/000000000000/order-requests'),
});
