import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

import { BinanceClientService } from './services/binance-client.service.js';
import { CoinCapClientService } from './services/coincap-client.service.js';
import { CryptoMathService } from './services/crypto-math.service.js';
import { CryptoDictionaryService } from './services/crypto-dictionary.service.js';
import { ICryptoProvider } from './interfaces/crypto-provider.interface.js';

import {
  CoinSummary,
  OhlcCandle,
  SupportedPeriod,
  CoinHistory,
  CompareResponse,
  ComparedCoinSeries
} from '@dashboard-cripto/shared-types';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private providers: ICryptoProvider[];

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly binanceClient: BinanceClientService,
    private readonly coincapClient: CoinCapClientService,
    private readonly dictionary: CryptoDictionaryService,
    private readonly mathService: CryptoMathService,
  ) {
    // Strategy Pattern: Priority ordered
    this.providers = [this.binanceClient, this.coincapClient];
  }

  /**
   * Multiple Circuit Breaker for Crypto Providers
   */
  private async tryWithFallback<T>(
    operation: (provider: ICryptoProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any = null;

    for (const provider of this.providers) {
      const providerName = provider.constructor.name;
      try {
        const result = await operation(provider);
        return result;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Provider ${providerName} failed during ${operationName}. Reason: ${error.message}. Shifting to next...`);
      }
    }

    this.logger.error(`All providers failed for ${operationName}.`);
    throw new HttpException(
      { statusCode: HttpStatus.BAD_GATEWAY, message: 'All crypto providers failed', error: 'Bad Gateway' },
      HttpStatus.BAD_GATEWAY
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronTopCoinsUpdate() {
    this.logger.debug('Background Worker: Pre-fetching Top Coins...');
    try {
      const rawMarketData = await this.tryWithFallback(provider => provider.getMarkets(5), 'getMarkets');
      const normalizedData = this.mathService.normalizeTopCoins(rawMarketData);
      await this.cacheManager.set('coins_top_10', normalizedData, 65000);
      this.logger.debug('Background Worker: Top Coins cache updated successfully.');
    } catch (cronError) {
      this.logger.error('Background Worker Failed to update cache. Circuit Breaker will use stale data if available.', cronError);
    }
  }

  async getTopCoins(): Promise<CoinSummary[]> {
    const cacheKey = 'coins_top_10';
    const cachedData = await this.cacheManager.get<CoinSummary[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    this.logger.log('Cache miss for Top Coins. Fetching synchronously...');
    const rawMarketData = await this.tryWithFallback(provider => provider.getMarkets(5), 'getMarkets');
    const normalizedData = this.mathService.normalizeTopCoins(rawMarketData);
    await this.cacheManager.set(cacheKey, normalizedData, 65000);
    return normalizedData;
  }

  async getCoinSummary(id: string): Promise<CoinSummary> {
    const cacheKey = `coin_summary_${id}`;
    const cachedData = await this.cacheManager.get<CoinSummary>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const rawCoinData = await this.tryWithFallback(provider => provider.getCoinData(id), 'getCoinData');
      const summary = this.mathService.normalizeCoinSummary(rawCoinData);
      await this.cacheManager.set(cacheKey, summary, 60000);
      return summary;
    } catch (error) {
      this.logger.warn(`Could not fetch live summary for ${id}, using static dictionary fallback.`);

      const safeId = id.toLowerCase();
      const staticData = this.dictionary.getStaticData(safeId);

      return {
        id: safeId,
        symbol: staticData?.symbol || safeId,
        name: staticData?.name || safeId,
        image: staticData?.image || '',
        currentPrice: 0,
        marketCap: 0,
        marketCapRank: 0,
        totalVolume: 0,
        priceChangePercentage24h: 0
      };
    }
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<OhlcCandle[]> {
    const cacheKey = `coins_${id}_ohlc_${days}`;
    const cachedData = await this.cacheManager.get<OhlcCandle[]>(cacheKey);
    if (cachedData) return cachedData;

    const rawOhlcData = await this.tryWithFallback(provider => provider.getOhlc(id, days), 'getOhlc');
    const ohlcCandles = this.mathService.normalizeOhlc(rawOhlcData);
    await this.cacheManager.set(cacheKey, ohlcCandles, 60000);
    return ohlcCandles;
  }

  async getHistory(id: string, days: SupportedPeriod): Promise<CoinHistory> {
    const cacheKey = `coins_${id}_history_${days}`;
    const cachedData = await this.cacheManager.get<CoinHistory>(cacheKey);
    if (cachedData) return cachedData;

    const chartResponse = await this.tryWithFallback(provider => provider.getMarketChart(id, days), 'getMarketChart');
    const historyPoints = this.mathService.normalizeHistory(chartResponse.prices, chartResponse.total_volumes);

    const coinHistory: CoinHistory = { id, days, prices: historyPoints };
    await this.cacheManager.set(cacheKey, coinHistory, 60000);
    return coinHistory;
  }

  async compareCoins(ids: string[], days: SupportedPeriod): Promise<CompareResponse> {
    const sortedIds = [...ids].sort();
    const cacheKey = `coins_compare_${sortedIds.join(',')}_${days}`;

    const cachedData = await this.cacheManager.get<CompareResponse>(cacheKey);
    if (cachedData) return cachedData;

    const topCoins = await this.getTopCoins();
    const comparedCoinsData: ComparedCoinSeries[] = [];

    const coinHistories = await Promise.all(
      sortedIds.map(coinId => this.getHistory(coinId, days).catch(() => null))
    );

    for (let index = 0; index < sortedIds.length; index++) {
      const coinId = sortedIds[index];
      if (!coinId) continue;

      const coinHistory = coinHistories[index];

      let coinBasicInfo = topCoins.find(coin => coin.id === coinId);
      if (!coinBasicInfo) {
        try {
          coinBasicInfo = await this.getCoinSummary(coinId);
        } catch (_unusedError) {
          // Silently ignore — fallback ID will be used
        }
      }

      if (!coinHistory || coinHistory.prices.length === 0) {
        // Even if history failed, we should return the coin metadata so the frontend can render the button correctly
        comparedCoinsData.push({
          id: coinId,
          symbol: coinBasicInfo?.symbol || coinId,
          name: coinBasicInfo?.name || coinId,
          series: []
        });
        continue;
      }

      const indexedSeries = this.mathService.buildIndexedSeries(coinHistory.prices, coinBasicInfo, coinId);

      if (indexedSeries) comparedCoinsData.push(indexedSeries);
    }

    const compareResponse: CompareResponse = { days, coins: comparedCoinsData };
    await this.cacheManager.set(cacheKey, compareResponse, 60000);
    return compareResponse;
  }
}
