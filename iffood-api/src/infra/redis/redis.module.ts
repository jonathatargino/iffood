import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  attachRedisErrorLogger,
  createRedisClient,
  RedisClient,
  resolveRedisConfig,
} from './redis.client';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RedisClient => {
        const config = resolveRedisConfig({
          REDIS_CLUSTER: configService.get('REDIS_CLUSTER'),
          REDIS_HOST: configService.get('REDIS_HOST'),
          REDIS_PORT: configService.get('REDIS_PORT'),
          REDIS_URL: configService.get('REDIS_URL'),
          REDIS_PASSWORD: configService.get('REDIS_PASSWORD'),
          REDIS_TLS: configService.get('REDIS_TLS'),
        });

        const mode = config.cluster ? 'cluster' : 'standalone';
        console.log(
          `[Redis] modo=${mode} host=${config.host}:${config.port} tls=${config.tls}`,
        );

        const client = createRedisClient(config);
        attachRedisErrorLogger(client);
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
