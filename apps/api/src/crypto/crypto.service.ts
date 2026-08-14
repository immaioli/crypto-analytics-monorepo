import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import {
  CoinSummary,
  OhlcCandle,
  SupportedPeriod,
  CoinHistory,
  HistoryPoint,
  CompareResponse,
  ComparedCoinSeries
} from '@dashboard-cripto/shared-types';

@Injectable()
export class CryptoService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getAuthHeaders() {
    const key = process.env.COINGECKO_API_KEY;
    if (key) {
      return { 'x-cg-demo-api-key': key };
    }
    return {};
  }

  async getTopCoins(): Promise<CoinSummary[]> {
    const cacheKey = 'coins_top_10';
    const cachedData = await this.cacheManager.get<CoinSummary[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('/coins/markets', {
          headers: this.getAuthHeaders(),
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
          },
        })
      );

      // Normalization conforming to the shared-types interface
      const data: CoinSummary[] = response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        priceChangePercentage24h: coin.price_change_percentage_24h,
      }));

      // Cache for 60 seconds
      await this.cacheManager.set(cacheKey, data, 60000);

      return data;
    } catch (error: any) {
      // Fallback: If Coingecko is down or rate-limited and we have no cache, throw readable error
      const message = error.response?.data?.status?.error_message || 'Failed to fetch from CoinGecko';
      throw new HttpException(
        { statusCode: HttpStatus.BAD_GATEWAY, message, error: 'Bad Gateway' },
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<OhlcCandle[]> {
    const cacheKey = `coins_${id}_ohlc_${days}`;
    const cachedData = await this.cacheManager.get<OhlcCandle[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`/coins/${id}/ohlc`, {
          headers: this.getAuthHeaders(),
          params: {
            vs_currency: 'usd',
            days,
          },
        })
      );

      const data: OhlcCandle[] = response.data;

      // Cache for 60 seconds
      await this.cacheManager.set(cacheKey, data, 60000);

      return data;
    } catch (error: any) {
      const message = error.response?.data?.status?.error_message || 'Failed to fetch from CoinGecko';
      throw new HttpException(
        { statusCode: HttpStatus.BAD_GATEWAY, message, error: 'Bad Gateway' },
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  async getHistory(id: string, days: SupportedPeriod): Promise<CoinHistory> {
    const cacheKey = `coins_${id}_history_${days}`;
    const cachedData = await this.cacheManager.get<CoinHistory>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`/coins/${id}/market_chart`, {
          headers: this.getAuthHeaders(),
          params: {
            vs_currency: 'usd',
            days,
          },
        })
      );

      const prices = response.data.prices as [number, number][];
      const volumes = response.data.total_volumes as [number, number][];

      const historyPoints: HistoryPoint[] = prices.map((pricePoint, index) => {
        return {
          timestampMs: pricePoint[0],
          price: pricePoint[1],
          // CoinGecko returns prices and volumes with matching lengths and timestamps usually
          volume: volumes[index] ? volumes[index][1] : 0,
        };
      });

      const data: CoinHistory = {
        id,
        days,
        prices: historyPoints,
      };

      // Cache for 60 seconds
      await this.cacheManager.set(cacheKey, data, 60000);

      return data;
    } catch (error: any) {
      const message = error.response?.data?.status?.error_message || 'Failed to fetch from CoinGecko';
      throw new HttpException(
        { statusCode: HttpStatus.BAD_GATEWAY, message, error: 'Bad Gateway' },
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  async compareCoins(ids: string[], days: SupportedPeriod): Promise<CompareResponse> {
    // Sort ids so the cache key is deterministic regardless of query parameter order
    const sortedIds = [...ids].sort();
    const cacheKey = `coins_compare_${sortedIds.join(',')}_${days}`;

    const cachedData = await this.cacheManager.get<CompareResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Article I strict separation: Backend does the complex indexing logic
    // We need basic info for symbols/names, and history for prices
    const topCoins = await this.getTopCoins();

    const coinsData: ComparedCoinSeries[] = [];

    // Process all requests in parallel
    const histories = await Promise.all(
      sortedIds.map(id => this.getHistory(id, days).catch(() => null))
    );

    for (let i = 0; i < sortedIds.length; i++) {
      const id = sortedIds[i];
      const history = histories[i];

      if (!history || history.prices.length === 0) continue;

      const basicInfo = topCoins.find(c => c.id === id);

      const basePrice = history.prices[0].price;

      // Map prices to relative percentages compared to basePrice (index 0)
      const series = history.prices.map(point => {
        // Percentage difference formula: ((current - base) / base) * 100
        const indexedValue = basePrice === 0
          ? 0
          : ((point.price - basePrice) / basePrice) * 100;

        return {
          timestampMs: point.timestampMs,
          indexedValue
        };
      });

      coinsData.push({
        id,
        symbol: basicInfo?.symbol || id,
        name: basicInfo?.name || id,
        series,
      });
    }

    const data: CompareResponse = {
      days,
      coins: coinsData,
    };

    // Cache for 60 seconds
    await this.cacheManager.set(cacheKey, data, 60000);

    return data;
  }
}
