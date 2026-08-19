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

        const host = process.env.REDIS_HOST ?? 'localhost';
        const port = Number(process.env.REDIS_PORT ?? 6379);

        try {
          // If Redis is explicitly configured with a different host (like running via Docker Compose), use it
          // Otherwise, force in-memory to prevent local dev environments crashing without Redis installed.
          if (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost') {
            const store = await redisStore({
              url: `redis://${host}:${port}`,
              socket: {
                reconnectStrategy: false // Don't crash loop on failure
              }
            });
            logger.log('Connected to Redis cache store.');
            return { store, ttl: 60000 };
          } else {
            logger.log('Local environment detected: using in-memory cache to prevent Redis ECONNREFUSED.');
            return { ttl: 60000 };
          }
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
