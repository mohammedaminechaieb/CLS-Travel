import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>('redisUrl')!, { maxRetriesPerRequest: 3, lazyConnect: false }),
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
