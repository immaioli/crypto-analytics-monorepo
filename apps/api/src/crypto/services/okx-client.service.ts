import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICryptoProvider } from '../interfaces/crypto-provider.interface.js';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';
import { CryptoDictionaryService } from './crypto-dictionary.service.js';

@Injectable()
export class OkxClientService implements ICryptoProvider {
  private readonly logger = new Logger(OkxClientService.name);
  private readonly baseUrl = 'https://www.okx.com/api/v5';

  constructor(
    private readonly httpService: HttpService,
    private readonly dictionary: CryptoDictionaryService
  ) {}

  private mapDaysToInterval(days: SupportedPeriod): string {
    switch (days) {
      case '1': return '5m';
      case '7': return '1H';
      case '30': return '4H';
      default: return '4H';
    }
  }

  /**
   * OKX uses instId format: "BTC-USDT" (hífen entre base e quote).
   * Resolves from CoinGecko slug via dictionary → OKX instId.
   */
  private resolveInstId(id: string): string {
    if (/^[A-Z0-9]+-USDT$/.test(id)) return id;
    const cleanId = id.includes('-') ? id.split('-')[0] || id : id;
    const staticData = this.dictionary.getStaticData(cleanId);
    const symbol = (staticData?.symbol || cleanId).toUpperCase();
    return `${symbol}-USDT`;
  }

  async getMarkets(limit: number): Promise<any[]> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/market/tickers`, {
        params: { instType: 'SPOT' }
      })
    );

    // OKX returns ALL tickers — filter USDT pairs, sort by volume, take top N
    const sorted = data.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
      .slice(0, limit);

    return sorted.map((ticker: any) => {
      const baseSymbol = ticker.instId.replace(/-USDT$/, '');
      const safeId = baseSymbol.toLowerCase();
      const staticData = this.dictionary.getStaticData(safeId);
      const pct24h = ticker.open24h
        ? ((parseFloat(ticker.last) - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h)) * 100
        : 0;

      return {
        _provider: 'okx',
        id: safeId,
        symbol: baseSymbol,
        name: staticData?.name || baseSymbol,
        image: staticData?.image || '',
        current_price: parseFloat(ticker.last),
        total_volume: parseFloat(ticker.volCcy24h),
        price_change_percentage_24h: pct24h,
        market_cap: 0,
        market_cap_rank: 0
      };
    });
  }

  async getCoinData(id: string): Promise<any> {
    const instId = this.resolveInstId(id);

    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/market/ticker`, {
        params: { instId }
      })
    );

    const ticker = data.data?.[0];
    if (!ticker) throw new Error(`OKX: ticker not found for ${instId}`);

    const cleanId = id.includes('-') ? id.split('-')[0] || id : id;
    const staticData = this.dictionary.getStaticData(cleanId);
    const resolvedSymbol = ticker.instId.replace(/-USDT$/, '');
    const pct24h = ticker.open24h
      ? ((parseFloat(ticker.last) - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h)) * 100
      : 0;

    return {
      _provider: 'okx',
      id: cleanId,
      symbol: resolvedSymbol,
      name: staticData?.name || resolvedSymbol,
      image: staticData?.image || '',
      current_price: parseFloat(ticker.last),
      total_volume: parseFloat(ticker.volCcy24h),
      price_change_percentage_24h: pct24h,
      market_cap: 0,
      market_cap_rank: 0,
      // Raw fields for Deep Dive capsules (realTime category)
      lastPrice: ticker.last,
      priceChange: (parseFloat(ticker.last) - parseFloat(ticker.open24h)).toString(),
      priceChangePercent: pct24h.toString(),
      highPrice: ticker.high24h,
      lowPrice: ticker.low24h,
      bidPrice: ticker.bidPx,
      askPrice: ticker.askPx,
      volume: ticker.vol24h,
      quoteVolume: ticker.volCcy24h
    };
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<any[]> {
    const instId = this.resolveInstId(id);
    const bar = this.mapDaysToInterval(days);
    const limit = days === '1' ? 288 : (days === '7' ? 168 : 180);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/market/candles`, {
          params: { instId, bar, limit }
        })
      );

      // OKX candles: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
      return data.data.map((candle: any) => [
        parseInt(candle[0]),
        parseFloat(candle[1]),
        parseFloat(candle[2]),
        parseFloat(candle[3]),
        parseFloat(candle[4])
      ]);
    } catch (err) {
      this.logger.warn(`OKX OHLC failed for ${instId}: ${(err as Error).message}`);
      return [];
    }
  }

  async getMarketChart(id: string, days: SupportedPeriod): Promise<{prices: [number, number][], total_volumes: [number, number][]}> {
    const instId = this.resolveInstId(id);
    const bar = this.mapDaysToInterval(days);
    const limit = days === '1' ? 288 : (days === '7' ? 168 : 180);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/market/candles`, {
          params: { instId, bar, limit }
        })
      );

      const prices: [number, number][] = data.data.map((candle: any) => [
        parseInt(candle[0]),
        parseFloat(candle[4]) // close
      ]);
      const totalVolumes: [number, number][] = data.data.map((candle: any) => [
        parseInt(candle[0]),
        parseFloat(candle[7]) || 0 // volCcyQuote
      ]);

      return { prices, total_volumes: totalVolumes };
    } catch (err) {
      this.logger.warn(`OKX market chart failed for ${instId}: ${(err as Error).message}`);
      return { prices: [], total_volumes: [] };
    }
  }
}
