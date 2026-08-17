import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoinGeckoClientService } from './services/coingecko-client.service.js';
import { CryptoMathService } from './services/crypto-math.service.js';
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

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly apiClient: CoinGeckoClientService,
    private readonly mathService: CryptoMathService,
  ) {}

  /**
   * CRON JOB: WORKER DE ALTA PERFORMANCE
   * Roda a cada minuto em background, alimentando o Redis.
   * O usuário nunca espera a latência da API externa para acessar o "Top 5".
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronTopCoinsUpdate() {
    this.logger.debug('Background Worker: Pre-fetching Top Coins...');
    try {
      const data = await this.apiClient.getMarkets(5);
      const normalizedData = this.mathService.normalizeTopCoins(data);
      // Salva no cache por 65 segundos (um pouco a mais que o cron, para evitar gap)
      await this.cacheManager.set('coins_top_10', normalizedData, 65000);
      this.logger.debug('Background Worker: Top Coins cache updated successfully.');
    } catch (error) {
      this.logger.error('Background Worker Failed to update cache. Circuit Breaker will use stale data if available.', error);
    }
  }

  async getTopCoins(): Promise<CoinSummary[]> {
    const cacheKey = 'coins_top_10';
    const cachedData = await this.cacheManager.get<CoinSummary[]>(cacheKey);

    // Se o worker fez o trabalho dele, respondemos em milissegundos
    if (cachedData) {
      return cachedData;
    }

    // Se é a primeira execução (worker não rodou ainda) ou cache expirou
    this.logger.log('Cache miss for Top Coins. Fetching synchronously...');
    try {
      const data = await this.apiClient.getMarkets(5);
      const normalizedData = this.mathService.normalizeTopCoins(data);
      await this.cacheManager.set(cacheKey, normalizedData, 65000);
      return normalizedData;
    } catch (error: any) {
      this.handleExternalError(error);
    }
  }

  async getCoinSummary(id: string): Promise<CoinSummary> {
    const cacheKey = `coin_summary_${id}`;
    const cachedData = await this.cacheManager.get<CoinSummary>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const data = await this.apiClient.getCoinData(id);

      const summary: CoinSummary = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        image: data.image?.small || data.image?.thumb || '',
        currentPrice: data.market_data?.current_price?.usd || 0,
        marketCap: data.market_data?.market_cap?.usd || 0,
        marketCapRank: data.market_cap_rank || 0,
        totalVolume: data.market_data?.total_volume?.usd || 0,
        priceChangePercentage24h: data.market_data?.price_change_percentage_24h || 0,
      };

      await this.cacheManager.set(cacheKey, summary, 60000);
      return summary;
    } catch (error: any) {
      this.handleExternalError(error);
    }
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<OhlcCandle[]> {
    const cacheKey = `coins_${id}_ohlc_${days}`;
    const cachedData = await this.cacheManager.get<OhlcCandle[]>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const data = await this.apiClient.getOhlc(id, days);
      await this.cacheManager.set(cacheKey, data, 60000);
      return data;
    } catch (error: any) {
      this.handleExternalError(error);
    }
  }

  async getHistory(id: string, days: SupportedPeriod): Promise<CoinHistory> {
    const cacheKey = `coins_${id}_history_${days}`;
    const cachedData = await this.cacheManager.get<CoinHistory>(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await this.apiClient.getMarketChart(id, days);
      const historyPoints = this.mathService.normalizeHistory(response.prices, response.total_volumes);

      const data: CoinHistory = { id, days, prices: historyPoints };
      await this.cacheManager.set(cacheKey, data, 60000);
      return data;
    } catch (error: any) {
      this.handleExternalError(error);
    }
  }

  async compareCoins(ids: string[], days: SupportedPeriod): Promise<CompareResponse> {
    const sortedIds = [...ids].sort();
    const cacheKey = `coins_compare_${sortedIds.join(',')}_${days}`;

    const cachedData = await this.cacheManager.get<CompareResponse>(cacheKey);
    if (cachedData) return cachedData;

    const topCoins = await this.getTopCoins();
    const coinsData: ComparedCoinSeries[] = [];

    const histories = await Promise.all(
      sortedIds.map(id => this.getHistory(id, days).catch(() => null))
    );

    for (let i = 0; i < sortedIds.length; i++) {
      const id = sortedIds[i];
      if (!id) continue;

      const history = histories[i];
      if (!history || history.prices.length === 0) continue;

      const basicInfo = topCoins.find(c => c.id === id);
      const seriesObj = this.mathService.buildIndexedSeries(history.prices, basicInfo, id);

      if (seriesObj) coinsData.push(seriesObj);
    }

    const data: CompareResponse = { days, coins: coinsData };
    await this.cacheManager.set(cacheKey, data, 60000);
    return data;
  }

  private handleExternalError(error: any): never {
    const message = error.response?.data?.status?.error_message || 'Failed to fetch from CoinGecko';
    throw new HttpException(
      { statusCode: HttpStatus.BAD_GATEWAY, message, error: 'Bad Gateway' },
      HttpStatus.BAD_GATEWAY
    );
  }
}
