import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CryptoService } from './crypto.service.js';
import { Cache } from 'cache-manager';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BinanceClientService } from './services/binance-client.service.js';
import { CoinPaprikaClientService } from './services/coinpaprika-client.service.js';
import { CryptoMathService } from './services/crypto-math.service.js';

describe('CryptoService', () => {
  let service: CryptoService;
  let cacheManager: Cache;
  let binanceClient: BinanceClientService;
  let coinpaprikaClient: CoinPaprikaClientService;
  let mathService: CryptoMathService;

  beforeEach(() => {
    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
    } as any;

    binanceClient = {
      getMarkets: vi.fn(),
      getCoinData: vi.fn(),
      getOhlc: vi.fn(),
      getMarketChart: vi.fn(),
    } as any;

    coinpaprikaClient = {
      getMarkets: vi.fn(),
      getCoinData: vi.fn(),
      getOhlc: vi.fn(),
      getMarketChart: vi.fn(),
    } as any;

    mathService = new CryptoMathService();

    const dictionary = {
      getStaticData: vi.fn().mockReturnValue(null)
    } as any;

    service = new CryptoService(
      cacheManager,
      binanceClient,
      coinpaprikaClient,
      dictionary,
      mathService,
    );
  });

  describe('getOhlc', () => {
    it('returns formatted OHLC data from Binance and caches it', async () => {
      const mockOhlcData = [
        [1692057600000, 29000, 29500, 28500, 29200],
        [1692144000000, 29200, 29800, 29000, 29700],
      ];

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(binanceClient, 'getOhlc').mockResolvedValue(mockOhlcData);
      const setSpy = vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getOhlc('bitcoin', '7');

      expect(binanceClient.getOhlc).toHaveBeenCalledWith('bitcoin', '7');
      expect(result).toEqual(mockOhlcData);
      expect(setSpy).toHaveBeenCalledWith('coins_bitcoin_ohlc_7', result, 60000);
    });

    it('returns cached data if available', async () => {
      const cachedData = [
        [1692057600000, 29000, 29500, 28500, 29200]
      ];
      vi.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getOhlc('bitcoin', '7');

      expect(cacheManager.get).toHaveBeenCalledWith('coins_bitcoin_ohlc_7');
      expect(binanceClient.getOhlc).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('falls back to CoinPaprika when Binance fails', async () => {
      const mockOhlcData = [
        [1692057600000, 29000, 29500, 28500, 29200],
      ];

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(binanceClient, 'getOhlc').mockRejectedValue(new Error('Binance down'));
      vi.spyOn(coinpaprikaClient, 'getOhlc').mockResolvedValue(mockOhlcData);
      vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getOhlc('bitcoin', '7');

      expect(binanceClient.getOhlc).toHaveBeenCalled();
      expect(coinpaprikaClient.getOhlc).toHaveBeenCalledWith('bitcoin', '7');
      expect(result).toEqual(mockOhlcData);
    });

    it('throws Bad Gateway when ALL providers fail', async () => {
      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(binanceClient, 'getOhlc').mockRejectedValue(new Error('Binance down'));
      vi.spyOn(coinpaprikaClient, 'getOhlc').mockRejectedValue(new Error('CoinPaprika down'));

      await expect(service.getOhlc('bitcoin', '7')).rejects.toThrow(HttpException);
      await expect(service.getOhlc('bitcoin', '7')).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
    });
  });

  describe('getHistory', () => {
    it('normalizes history data correctly and caches it', async () => {
      const mockMarketChart = {
        prices: [
          [1692057600000, 29000] as [number, number],
          [1692144000000, 29200] as [number, number],
        ],
        total_volumes: [
          [1692057600000, 20000000] as [number, number],
          [1692144000000, 21000000] as [number, number],
        ],
      };

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(binanceClient, 'getMarketChart').mockResolvedValue(mockMarketChart);
      const setSpy = vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getHistory('bitcoin', '7');

      expect(binanceClient.getMarketChart).toHaveBeenCalledWith('bitcoin', '7');
      expect(result).toEqual({
        id: 'bitcoin',
        days: '7',
        prices: [
          { timestampMs: 1692057600000, price: 29000, volume: 20000000 },
          { timestampMs: 1692144000000, price: 29200, volume: 21000000 },
        ]
      });
      expect(setSpy).toHaveBeenCalledWith('coins_bitcoin_history_7', result, 60000);
    });
  });

  describe('compareCoins', () => {
    it('fetches basic info and history for multiple coins, re-indexing from base 0', async () => {
      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);

      vi.spyOn(service, 'getTopCoins').mockResolvedValue([
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', currentPrice: 100, marketCap: 100, marketCapRank: 1, totalVolume: 100, priceChangePercentage24h: 1, image: '' },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', currentPrice: 50, marketCap: 50, marketCapRank: 2, totalVolume: 50, priceChangePercentage24h: 1, image: '' }
      ]);

      vi.spyOn(service, 'getHistory').mockImplementation(async (id) => {
        if (id === 'bitcoin') {
          return {
            id: 'bitcoin', days: '7', prices: [
              { timestampMs: 1000, price: 20000, volume: 1 },
              { timestampMs: 2000, price: 22000, volume: 2 }, // +10%
              { timestampMs: 3000, price: 18000, volume: 3 }, // -10% from base
            ]
          };
        } else if (id === 'ethereum') {
          return {
            id: 'ethereum', days: '7', prices: [
              { timestampMs: 1000, price: 1000, volume: 1 },
              { timestampMs: 2000, price: 1050, volume: 2 }, // +5%
              { timestampMs: 3000, price: 1500, volume: 3 }, // +50%
            ]
          };
        }
        return { id, days: '7', prices: [] };
      });

      const setSpy = vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.compareCoins(['bitcoin', 'ethereum'], '7');

      expect(result.days).toBe('7');
      expect(result.coins).toHaveLength(2);

      const btcResult = result.coins.find(coin => coin.id === 'bitcoin')!;
      expect(btcResult.symbol).toBe('btc');
      expect(btcResult.name).toBe('Bitcoin');
      expect(btcResult.series).toEqual([
        { timestampMs: 1000, indexedValue: 0 },
        { timestampMs: 2000, indexedValue: 10 },
        { timestampMs: 3000, indexedValue: -10 },
      ]);

      const ethResult = result.coins.find(coin => coin.id === 'ethereum')!;
      expect(ethResult.symbol).toBe('eth');
      expect(ethResult.series).toEqual([
        { timestampMs: 1000, indexedValue: 0 },
        { timestampMs: 2000, indexedValue: 5 },
        { timestampMs: 3000, indexedValue: 50 },
      ]);

      expect(setSpy).toHaveBeenCalledWith('coins_compare_bitcoin,ethereum_7', result, 60000);
    });
  });
});
