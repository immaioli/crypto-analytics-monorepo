import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CryptoService } from './crypto.service.js';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CryptoService', () => {
  let service: CryptoService;
  let httpService: HttpService;
  let cacheManager: Cache;

  beforeEach(() => {
    httpService = {
      get: vi.fn(),
    } as any;

    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
    } as any;

    service = new CryptoService(httpService, cacheManager);
  });

  describe('getOhlc', () => {
    it('returns formatted OHLC data and caches it', async () => {
      const mockCoingeckoResponse = {
        data: [
          [1692057600000, 29000, 29500, 28500, 29200],
          [1692144000000, 29200, 29800, 29000, 29700],
        ],
      };

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(httpService, 'get').mockReturnValue(of(mockCoingeckoResponse as any));
      const setSpy = vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getOhlc('bitcoin', '7');

      expect(httpService.get).toHaveBeenCalledWith('/coins/bitcoin/ohlc', expect.objectContaining({
        params: { vs_currency: 'usd', days: '7' }
      }));
      expect(result).toEqual([
        [1692057600000, 29000, 29500, 28500, 29200],
        [1692144000000, 29200, 29800, 29000, 29700],
      ]);
      expect(setSpy).toHaveBeenCalledWith('coins_bitcoin_ohlc_7', result, 60000);
    });

    it('returns cached data if available', async () => {
      const cachedData = [
        [1692057600000, 29000, 29500, 28500, 29200]
      ];
      vi.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getOhlc('bitcoin', '7');

      expect(cacheManager.get).toHaveBeenCalledWith('coins_bitcoin_ohlc_7');
      expect(httpService.get).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('throws Bad Gateway on coingecko error', async () => {
      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(httpService, 'get').mockReturnValue(throwError(() => ({
        response: { data: { status: { error_message: 'Rate limit' } } }
      })));

      await expect(service.getOhlc('bitcoin', '7')).rejects.toThrow(HttpException);
      await expect(service.getOhlc('bitcoin', '7')).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
        response: { message: 'Rate limit' }
      });
    });
  });

  describe('getHistory', () => {
    it('normalizes history data correctly and caches it', async () => {
      const mockCoingeckoResponse = {
        data: {
          prices: [
            [1692057600000, 29000],
            [1692144000000, 29200],
          ],
          market_caps: [
            [1692057600000, 500000000],
            [1692144000000, 510000000],
          ],
          total_volumes: [
            [1692057600000, 20000000],
            [1692144000000, 21000000],
          ],
        }
      };

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(httpService, 'get').mockReturnValue(of(mockCoingeckoResponse as any));
      const setSpy = vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getHistory('bitcoin', '7');

      expect(httpService.get).toHaveBeenCalledWith('/coins/bitcoin/market_chart', expect.objectContaining({
        params: { vs_currency: 'usd', days: '7' }
      }));

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

      // We mock the getTopCoins method just to get the coin basic info for symbol/name
      // To test the logic independently, we mock httpService.get directly.
      // But it's easier to mock the sub-methods since we use them.
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

      const btcResult = result.coins.find(c => c.id === 'bitcoin')!;
      expect(btcResult.symbol).toBe('btc');
      expect(btcResult.name).toBe('Bitcoin');
      expect(btcResult.series).toEqual([
        { timestampMs: 1000, indexedValue: 0 },
        { timestampMs: 2000, indexedValue: 10 },
        { timestampMs: 3000, indexedValue: -10 },
      ]);

      const ethResult = result.coins.find(c => c.id === 'ethereum')!;
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
