import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

import { BinanceClientService } from './services/binance-client.service.js';
import { CoinGeckoClientService } from './services/coingecko-client.service.js';
import { BybitClientService } from './services/bybit-client.service.js';
import { OkxClientService } from './services/okx-client.service.js';
import { CoinLoreClientService } from './services/coinlore-client.service.js';
import { CryptoMathService } from './services/crypto-math.service.js';
import { CryptoDictionaryService } from './services/crypto-dictionary.service.js';
import { ICryptoProvider } from './interfaces/crypto-provider.interface.js';

import {
  CoinSummary,
  OhlcCandle,
  SupportedPeriod,
  CoinHistory,
  CompareResponse,
  ComparedCoinSeries,
  ProviderCapsule
} from '@dashboard-cripto/shared-types';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private providers: ICryptoProvider[];

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly binanceClient: BinanceClientService,
    private readonly coingeckoClient: CoinGeckoClientService,
    private readonly bybitClient: BybitClientService,
    private readonly okxClient: OkxClientService,
    private readonly coinloreClient: CoinLoreClientService,
    private readonly dictionary: CryptoDictionaryService,
    private readonly mathService: CryptoMathService,
  ) {
    // Circuit breaker: CoinGecko (fundamentals) → Binance (real-time) → Bybit → OKX
    this.providers = [this.coingeckoClient, this.binanceClient, this.bybitClient, this.okxClient];
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
      // Execute all providers concurrently. CoinLore is enrichment-only (no ICryptoProvider).
      const [cgResult, binanceResult, bybitResult, okxResult, loreResult] = await Promise.allSettled([
        this.coingeckoClient.getCoinData(id),
        this.binanceClient.getCoinData(id),
        this.bybitClient.getCoinData(id),
        this.okxClient.getCoinData(id),
        this.coinloreClient.getCoinData(id)
      ]);

      const allFailed = [cgResult, binanceResult, bybitResult, okxResult]
        .every(r => r.status === 'rejected');
      if (allFailed) throw new Error('All providers failed to fetch coin data');

      // Baseline: CoinGecko (fundamentals) → Binance (real-time) → Bybit → OKX
      const baseRawData = cgResult.status === 'fulfilled' ? cgResult.value :
                          (binanceResult.status === 'fulfilled' ? binanceResult.value :
                          (bybitResult.status === 'fulfilled' ? bybitResult.value :
                          (okxResult.status === 'fulfilled' ? okxResult.value : null)));

      const summary = this.mathService.normalizeCoinSummary(baseRawData);
      summary.capsules = [];

      // Emit ALL provider fields as capsules, grouped by category.
      if (cgResult.status === 'fulfilled') {
        this.appendCgCapsules(summary.capsules, cgResult.value);
      }

      if (binanceResult.status === 'fulfilled') {
        this.appendBinanceCapsules(summary.capsules, binanceResult.value);
      }

      // RealTime capsules: whichever exchange responded with raw ticker fields first (circuit breaker order)
      const exchangeResult = binanceResult.status === 'fulfilled' ? binanceResult.value :
                             (bybitResult.status === 'fulfilled' ? bybitResult.value :
                             (okxResult.status === 'fulfilled' ? okxResult.value : null));
      const exchangeProvider: 'binance' | 'bybit' | 'okx' | null =
        binanceResult.status === 'fulfilled' ? 'binance' :
        (bybitResult.status === 'fulfilled' ? 'bybit' :
        (okxResult.status === 'fulfilled' ? 'okx' : null));

      if (exchangeResult && exchangeProvider) {
        this.appendExchangeCapsules(summary.capsules, exchangeResult, exchangeProvider);
      }

      // Bybit and OKX individually also contribute their full raw fields beyond the exchange winner
      if (bybitResult.status === 'fulfilled' && exchangeProvider !== 'bybit') {
        this.appendBybitCapsules(summary.capsules, bybitResult.value);
      }
      if (okxResult.status === 'fulfilled' && exchangeProvider !== 'okx') {
        this.appendOkxCapsules(summary.capsules, okxResult.value);
      }

      // CoinLore enrichment — supply detail + adjusted volume + risk cross-validation
      if (loreResult.status === 'fulfilled') {
        this.appendCoinLoreCapsules(summary.capsules, loreResult.value);
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
        atl: 0,
        capsules: []
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

  // ---------------------------------------------------------------------------
  // Capsule builders — one per provider.
  // Each helper emits EVERY relevant field the upstream returned, skipping
  // only null/undefined/NaN values. Capsules are tagged with their category so
  // the Deep Dive tab can group them by Real-Time / Metadata / RiskAndValidation.
  // ---------------------------------------------------------------------------

  private appendCgCapsules(out: ProviderCapsule[], cg: any): void {
    if (!cg) return;

    // Metadata — fundamentals & supply
    if (cg.market_cap_rank != null) {
      out.push({ label: 'Market Cap Rank', value: `#${cg.market_cap_rank}`, provider: 'coingecko', category: 'metadata' });
    }
    if (cg.market_cap != null) {
      out.push({ label: 'Market Cap', value: `$${Number(cg.market_cap).toLocaleString()}`, provider: 'coingecko', category: 'metadata' });
    }
    if (cg.circulating_supply != null) {
      out.push({ label: 'Circulating Supply', value: cg.circulating_supply.toLocaleString(), provider: 'coingecko', category: 'metadata' });
    }
    if (cg.max_supply != null) {
      out.push({ label: 'Max Supply', value: cg.max_supply.toLocaleString(), provider: 'coingecko', category: 'metadata' });
    }
    if (cg.total_supply != null) {
      out.push({ label: 'Total Supply', value: cg.total_supply.toLocaleString(), provider: 'coingecko', category: 'metadata' });
    }
    if (cg.ath != null) {
      out.push({ label: 'ATH Price', value: `$${Number(cg.ath).toLocaleString()}`, provider: 'coingecko', category: 'metadata' });
    }
    if (cg.ath_change_percentage != null) {
      out.push({ label: 'ATH Change', value: `${cg.ath_change_percentage.toFixed(2)}%`, provider: 'coingecko', category: 'metadata' });
    }
    if (cg.ath_date) {
      out.push({ label: 'ATH Date', value: new Date(cg.ath_date).toLocaleDateString(), provider: 'coingecko', category: 'metadata' });
    }
    if (cg.atl != null) {
      out.push({ label: 'ATL Price', value: `$${Number(cg.atl).toLocaleString()}`, provider: 'coingecko', category: 'metadata' });
    }
    if (cg.atl_change_percentage != null) {
      out.push({ label: 'ATL Change', value: `${cg.atl_change_percentage.toFixed(2)}%`, provider: 'coingecko', category: 'metadata' });
    }
    if (cg.atl_date) {
      out.push({ label: 'ATL Date', value: new Date(cg.atl_date).toLocaleDateString(), provider: 'coingecko', category: 'metadata' });
    }

    // Risk & Volatility — extended % fields from /coins/markets with price_change_percentage
    if (cg.price_change_percentage_1h_in_currency != null) {
      out.push({ label: 'Change 1h', value: `${cg.price_change_percentage_1h_in_currency.toFixed(2)}%`, provider: 'coingecko', category: 'riskAndValidation' });
    }
    if (cg.price_change_percentage_24h != null) {
      out.push({ label: 'Change 24h', value: `${cg.price_change_percentage_24h.toFixed(2)}%`, provider: 'coingecko', category: 'riskAndValidation' });
    }
    if (cg.price_change_percentage_7d_in_currency != null) {
      out.push({ label: 'Change 7d', value: `${cg.price_change_percentage_7d_in_currency.toFixed(2)}%`, provider: 'coingecko', category: 'riskAndValidation' });
    }
    if (cg.price_change_percentage_14d_in_currency != null) {
      out.push({ label: 'Change 14d', value: `${cg.price_change_percentage_14d_in_currency.toFixed(2)}%`, provider: 'coingecko', category: 'riskAndValidation' });
    }
    if (cg.price_change_percentage_30d_in_currency != null) {
      out.push({ label: 'Change 30d', value: `${cg.price_change_percentage_30d_in_currency.toFixed(2)}%`, provider: 'coingecko', category: 'riskAndValidation' });
    }
  }

  private appendBinanceCapsules(out: ProviderCapsule[], bn: any): void {
    if (!bn) return;
    const lastPrice = bn.lastPrice ?? bn.current_price;
    if (lastPrice != null) {
      out.push({ label: 'Current Price', value: `$${Number(lastPrice).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
    if (bn.priceChange != null) {
      out.push({ label: '24h Change', value: `${bn.priceChange} USD`, provider: 'binance', category: 'realTime' });
    }
    if (bn.priceChangePercent != null) {
      out.push({ label: '24h % Change', value: `${bn.priceChangePercent}%`, provider: 'binance', category: 'realTime' });
    } else if (bn.price_change_percentage_24h != null) {
      out.push({ label: '24h % Change', value: `${bn.price_change_percentage_24h.toFixed(2)}%`, provider: 'binance', category: 'realTime' });
    }
    if (bn.highPrice != null) {
      out.push({ label: '24h High', value: `$${Number(bn.highPrice).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
    if (bn.lowPrice != null) {
      out.push({ label: '24h Low', value: `$${Number(bn.lowPrice).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
    if (bn.bidPrice != null) {
      out.push({ label: 'Bid Price', value: `$${Number(bn.bidPrice).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
    if (bn.askPrice != null) {
      out.push({ label: 'Ask Price', value: `$${Number(bn.askPrice).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
    if (bn.volume != null) {
      out.push({ label: 'Base Volume', value: bn.volume.toLocaleString(), provider: 'binance', category: 'realTime' });
    }
    if (bn.quoteVolume != null) {
      out.push({ label: 'Quote Volume', value: `$${Number(bn.quoteVolume).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
    if (bn.total_volume != null) {
      out.push({ label: '24h Volume', value: `$${Number(bn.total_volume).toLocaleString()}`, provider: 'binance', category: 'realTime' });
    }
  }

  private appendExchangeCapsules(out: ProviderCapsule[], ex: any, provider: 'binance' | 'bybit' | 'okx'): void {
    if (!ex) return;

    // Map per-exchange field names to a normalized capsule label.
    const lastPrice = ex.lastPrice ?? ex.last ?? ex.current_price;
    if (lastPrice != null) {
      out.push({ label: `${providerLabel(provider)} Price`, value: `$${Number(lastPrice).toLocaleString()}`, provider, category: 'realTime' });
    }

    const priceChange = ex.priceChange ?? (ex.last != null && ex.open24h != null ? ex.last - ex.open24h : undefined);
    if (priceChange != null) {
      out.push({ label: `${providerLabel(provider)} 24h Change`, value: `${priceChange} USD`, provider, category: 'realTime' });
    }

    // Bybit sends price24hPcnt as a fraction (0.05 = 5%), OKX as raw %. Normalize.
    let pct24h = ex.priceChangePercent ?? ex.price_change_percentage_24h;
    if (provider === 'bybit' && pct24h != null && Math.abs(pct24h) < 1) pct24h = pct24h * 100;
    if (pct24h != null) {
      out.push({ label: `${providerLabel(provider)} 24h %`, value: `${Number(pct24h).toFixed(2)}%`, provider, category: 'realTime' });
    }

    const high24h = ex.highPrice ?? ex.highPrice24h ?? ex.high24h;
    if (high24h != null) {
      out.push({ label: `${providerLabel(provider)} 24h High`, value: `$${Number(high24h).toLocaleString()}`, provider, category: 'realTime' });
    }

    const low24h = ex.lowPrice ?? ex.lowPrice24h ?? ex.low24h;
    if (low24h != null) {
      out.push({ label: `${providerLabel(provider)} 24h Low`, value: `$${Number(low24h).toLocaleString()}`, provider, category: 'realTime' });
    }

    const bid = ex.bidPrice ?? ex.bid1Price ?? ex.bidPx;
    if (bid != null) {
      out.push({ label: `${providerLabel(provider)} Bid`, value: `$${Number(bid).toLocaleString()}`, provider, category: 'realTime' });
    }

    const ask = ex.askPrice ?? ex.ask1Price ?? ex.askPx;
    if (ask != null) {
      out.push({ label: `${providerLabel(provider)} Ask`, value: `$${Number(ask).toLocaleString()}`, provider, category: 'realTime' });
    }

    const vol = ex.volume ?? ex.volume24h ?? ex.vol24h;
    if (vol != null) {
      out.push({ label: `${providerLabel(provider)} Base Vol`, value: Number(vol).toLocaleString(), provider, category: 'realTime' });
    }

    const quoteVol = ex.quoteVolume ?? ex.turnover24h ?? ex.volCcy24h;
    if (quoteVol != null) {
      out.push({ label: `${providerLabel(provider)} Quote Vol`, value: `$${Number(quoteVol).toLocaleString()}`, provider, category: 'realTime' });
    }
  }

  private appendBybitCapsules(out: ProviderCapsule[], bb: any): void {
    if (!bb) return;
    if (bb.symbol) {
      out.push({ label: 'Bybit Symbol', value: bb.symbol, provider: 'bybit', category: 'metadata' });
    }
  }

  private appendOkxCapsules(out: ProviderCapsule[], ok: any): void {
    if (!ok) return;
    if (ok.instId) {
      out.push({ label: 'OKX Instrument', value: ok.instId, provider: 'okx', category: 'metadata' });
    }
  }

  private appendCoinLoreCapsules(out: ProviderCapsule[], lore: any): void {
    if (!lore) return;
    if (lore.rank) {
      out.push({ label: 'CoinLore Rank', value: `#${lore.rank}`, provider: 'coinlore', category: 'metadata' });
    }
    if (lore.price_usd) {
      out.push({ label: 'CoinLore Price', value: `$${Number(lore.price_usd).toLocaleString()}`, provider: 'coinlore', category: 'metadata' });
    }
    if (lore.market_cap_usd) {
      out.push({ label: 'CoinLore Mkt Cap', value: `$${Number(lore.market_cap_usd).toLocaleString()}`, provider: 'coinlore', category: 'metadata' });
    }
    if (lore.tsupply) {
      out.push({ label: 'Total Supply', value: Number(lore.tsupply).toLocaleString(), provider: 'coinlore', category: 'metadata' });
    }
    if (lore.csupply) {
      out.push({ label: 'Circulating Supply', value: Number(lore.csupply).toLocaleString(), provider: 'coinlore', category: 'metadata' });
    }
    if (lore.msupply) {
      out.push({ label: 'Max Supply', value: Number(lore.msupply).toLocaleString(), provider: 'coinlore', category: 'metadata' });
    }
    if (lore.volume24) {
      out.push({ label: 'CoinLore Vol 24h', value: `$${Number(lore.volume24).toLocaleString()}`, provider: 'coinlore', category: 'metadata' });
    }
    if (lore.volume24a) {
      out.push({ label: 'Adjusted Vol 24h', value: `$${Number(lore.volume24a).toLocaleString()}`, provider: 'coinlore', category: 'metadata' });
    }
    if (lore.percent_change_1h != null) {
      out.push({ label: '1h Change (cross)', value: `${Number(lore.percent_change_1h).toFixed(2)}%`, provider: 'coinlore', category: 'riskAndValidation' });
    }
    if (lore.percent_change_24h != null) {
      out.push({ label: '24h Change (cross)', value: `${Number(lore.percent_change_24h).toFixed(2)}%`, provider: 'coinlore', category: 'riskAndValidation' });
    }
    if (lore.percent_change_7d != null) {
      out.push({ label: '7d Change (cross)', value: `${Number(lore.percent_change_7d).toFixed(2)}%`, provider: 'coinlore', category: 'riskAndValidation' });
    }
  }
}

function providerLabel(p: 'binance' | 'bybit' | 'okx'): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}
