import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CryptoController } from './crypto.controller.js';
import { CryptoService } from './crypto.service.js';
import { CoinGeckoClientService } from './services/coingecko-client.service.js';
import { CryptoMathService } from './services/crypto-math.service.js';

@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.COINGECKO_BASE_URL ?? 'https://api.coingecko.com/api/v3',
    }),
    CacheModule.registerAsync({
      useFactory: async () => {
        // Se estamos em ambiente de teste, usamos in-memory para não depender de redis rodando
        if (process.env.NODE_ENV === 'test') {
          return { ttl: 60000 };
        }

        const host = process.env.REDIS_HOST ?? 'localhost';
        const port = Number(process.env.REDIS_PORT ?? 6379);

        return {
          store: await redisStore({
            url: `redis://${host}:${port}`
          }),
          ttl: 60000 // 1 minuto padrao
        };
      },
    }),
  ],
  controllers: [CryptoController],
  providers: [CryptoService, CoinGeckoClientService, CryptoMathService],
})
export class CryptoModule {}
