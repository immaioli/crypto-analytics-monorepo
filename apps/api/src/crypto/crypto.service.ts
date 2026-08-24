import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

import { BinanceClientService } from './services/binance-client.service.js';
import { CoinPaprikaClientService } from './services/coinpaprika-client.service.js';
import { CoinGeckoClientService } from './services/coingecko-client.service.js';
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
    private readonly coinpaprikaClient: CoinPaprikaClientService,
    private readonly coingeckoClient: CoinGeckoClientService,
    private readonly dictionary: CryptoDictionaryService,
    private readonly mathService: CryptoMathService,
  ) {
    // Strategy Pattern: Priority ordered
    this.providers = [this.coingeckoClient, this.binanceClient, this.coinpaprikaClient];
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
    this.logger.debug('Background Worker: Pre-fetching Top Coins and Populating Cache...');
    try {
      const topCoinIds = this.dictionary.getTopCoinIds(14);

      // Delay helper to avoid bursting APIs
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      for (const id of topCoinIds) {
        try {
          // Pre-fetch the summary which now populates 'coin_summary_id'
          await this.getCoinSummary(id);

          // Pre-fetch 30-day OHLC and History as they are the default views
          await this.getOhlc(id, '30');
          await this.getHistory(id, '30');

          // Small delay to respect rate limits between coins
          await delay(200);
        } catch (innerError) {
           this.logger.warn(`Failed to pre-fetch data for ${id} in background worker: ${(innerError as Error).message}`);
        }
      }

      // Re-fetch the markets to keep the actual "Top Coins" list fresh
      const rawMarketData = await this.tryWithFallback(provider => provider.getMarkets(14), 'getMarkets');
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

    // Only return cache if the image is NOT a ui-avatars placeholder
    if (cachedData && cachedData.length > 5) {
      return cachedData;
    }

    this.logger.log('Cache miss/bypass for Top Coins. Fetching synchronously...');
    // We pass 14 because we need 7 top volume and 7 top gainers = 14 total
    const rawMarketData = await this.tryWithFallback(provider => provider.getMarkets(14), 'getMarkets');
    const normalizedData = this.mathService.normalizeTopCoins(rawMarketData);
    await this.cacheManager.set(cacheKey, normalizedData, 65000);
    return normalizedData;
  }

  async getCoinSummary(id: string): Promise<CoinSummary> {
    const cacheKey = `coin_summary_${id}`;
    // Force a micro-cache duration so we don't get stuck with bad static avatars for long during test mode
    const cachedData = await this.cacheManager.get<CoinSummary>(cacheKey);
    if (cachedData && cachedData.image && !cachedData.image.includes('ui-avatars')) return cachedData;

    try {
      // Execute all three providers concurrently but safely
      const [cgResult, binanceResult, cpResult] = await Promise.allSettled([
        this.coingeckoClient.getCoinData(id),
        this.binanceClient.getCoinData(id),
        this.coinpaprikaClient.getCoinData(id)
      ]);

      // If all three failed completely, throw to hit the dictionary fallback
      if (cgResult.status === 'rejected' && binanceResult.status === 'rejected' && cpResult.status === 'rejected') {
        throw new Error('All providers failed to fetch coin data');
      }

      // We need a baseline to normalize. Prefer CoinGecko, then Binance, then CoinPaprika
      const baseRawData = cgResult.status === 'fulfilled' ? cgResult.value :
                          (binanceResult.status === 'fulfilled' ? binanceResult.value :
                          (cpResult.status === 'fulfilled' ? cpResult.value : null));

      const summary = this.mathService.normalizeCoinSummary(baseRawData);
      summary.capsules = [];

      // Extract details for Capsules
      if (cgResult.status === 'fulfilled') {
         summary.capsules.push({ label: 'Market Cap Rank', value: `#${cgResult.value.market_cap_rank}`, provider: 'coingecko' });
         if (cgResult.value.circulating_supply) summary.capsules.push({ label: 'Circulating Supply', value: cgResult.value.circulating_supply.toLocaleString(), provider: 'coingecko' });
         if (cgResult.value.max_supply) summary.capsules.push({ label: 'Max Supply', value: cgResult.value.max_supply.toLocaleString(), provider: 'coingecko' });
         summary.capsules.push({ label: '24h High', value: `$${cgResult.value.high_24h}`, provider: 'coingecko' });
         summary.capsules.push({ label: '24h Low', value: `$${cgResult.value.low_24h}`, provider: 'coingecko' });
      }

      if (binanceResult.status === 'fulfilled') {
         // Binance provides exact bid/ask and raw volume
         summary.capsules.push({ label: 'Binance Bid', value: `$${binanceResult.value.current_price.toLocaleString()}`, provider: 'binance' });
         summary.capsules.push({ label: '24h Volume', value: `$${binanceResult.value.total_volume.toLocaleString()}`, provider: 'binance' });
      }

      if (cpResult.status === 'fulfilled') {
         summary.capsules.push({ label: 'Change (1h)', value: `${cpResult.value.price_change_percentage_1h || 0}%`, provider: 'coinpaprika' });
         summary.capsules.push({ label: 'Change (12h)', value: `${cpResult.value.price_change_percentage_12h || 0}%`, provider: 'coinpaprika' });
         summary.capsules.push({ label: 'Change (7d)', value: `${cpResult.value.price_change_percentage_7d || 0}%`, provider: 'coinpaprika' });
      }

      // We need 30-day ATH/ATL from CoinGecko.
      try {
        const cleanId = id.includes('-') ? id.split('-')[1] || id : id;

        // Try to use cached month chart to avoid spamming the endpoint
        const monthChartCacheKey = `coins_${cleanId}_history_30`;
        let monthChart = await this.cacheManager.get<CoinHistory>(monthChartCacheKey);

        if (!monthChart) {
          const rawMonthChart = await this.coingeckoClient.getMarketChart(cleanId, '30' as SupportedPeriod);
          const monthly = this.mathService.extractMonthlyExtremes(rawMonthChart.prices);
          summary.ath = monthly.ath;
          summary.athDate = monthly.athDate;
          summary.atl = monthly.atl;
          summary.atlDate = monthly.atlDate;
        } else {
           const rawPrices: [number, number][] = monthChart.prices.map(p => [p.timestampMs, p.price]);
           const monthly = this.mathService.extractMonthlyExtremes(rawPrices);
           summary.ath = monthly.ath;
           summary.athDate = monthly.athDate;
           summary.atl = monthly.atl;
           summary.atlDate = monthly.atlDate;
        }
      } catch (rangeError) {
        this.logger.warn(`30-day extremes unavailable for ${id}: ${(rangeError as Error).message}`);
        summary.ath = 0;
        summary.athDate = undefined;
        summary.atl = 0;
        summary.atlDate = undefined;
      }

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
        priceChangePercentage24h: 0,
        ath: 0,
        atl: 0
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
