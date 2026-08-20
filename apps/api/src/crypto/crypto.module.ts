import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CryptoController } from './crypto.controller.js';
import { CryptoService } from './crypto.service.js';
import { BinanceClientService } from './services/binance-client.service.js';
import { CoinCapClientService } from './services/coincap-client.service.js';
import { CryptoDictionaryService } from './services/crypto-dictionary.service.js';
import { CryptoMathService } from './services/crypto-math.service.js';
import { BinanceGateway } from './gateways/binance.gateway.js';

const logger = new Logger('CacheConfig');

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
    }),
    CacheModule.registerAsync({
      useFactory: async () => {
        // If we are in the test environment, we use in-memory cache to avoid depending on a running Redis instance
        if (process.env.NODE_ENV === 'test') {
          return { ttl: 60000 };
        }

        try {
          const redisUrl = process.env.REDIS_URL;
          const redisHost = process.env.REDIS_HOST;

          // Prefer REDIS_URL (Upstash rediss://) over host/port.
          // Skip localhost so local machines without Redis do not crash on boot.
          const shouldUseRedis = Boolean(
            redisUrl || (redisHost && redisHost !== 'localhost')
          );

          if (!shouldUseRedis) {
            logger.log('Local environment detected: using in-memory cache to prevent Redis ECONNREFUSED.');
            return { ttl: 60000 };
          }

          const connectionUrl =
            redisUrl ??
            `redis://${redisHost}:${process.env.REDIS_PORT ?? 6379}`;

          const store = await redisStore({
            url: connectionUrl,
            socket: {
              reconnectStrategy: false,
            },
          });
          logger.log('Connected to Redis cache store.');
          return { store, ttl: 60000 };
        } catch (error) {
          logger.warn('Redis unavailable, falling back to in-memory cache.');
          return { ttl: 60000 };
        }
      },
    }),
  ],
  controllers: [CryptoController],
  providers: [
    CryptoService,
    BinanceClientService,
    CoinCapClientService,
    CryptoDictionaryService,
    CryptoMathService,
    BinanceGateway,
  ],
})
export class CryptoModule {}
