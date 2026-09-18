import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICryptoProvider } from '../interfaces/crypto-provider.interface.js';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';
import { CryptoDictionaryService } from './crypto-dictionary.service.js';

@Injectable()
export class BybitClientService implements ICryptoProvider {
  private readonly logger = new Logger(BybitClientService.name);
  private readonly baseUrl = 'https://api.bybit.com/v5';

  constructor(
    private readonly httpService: HttpService,
    private readonly dictionary: CryptoDictionaryService
  ) {}

  private mapDaysToInterval(days: SupportedPeriod): string {
    switch (days) {
      case '1': return '5';
      case '7': return '60';
      case '30': return '240';
      default: return '240';
    }
  }

  /**
   * Resolve a CoinGecko slug (e.g. "ethereum") to a Bybit symbol (e.g. "ETHUSDT").
   * Uses the resolved symbol from CoinGecko search — not the raw slug.
   */
  private resolveSymbol(id: string): string {
    // If it already looks like a symbol (uppercase, no hyphens), use it directly
    if (/^[A-Z0-9]+$/.test(id) && id.length <= 8) return `${id}USDT`;
    // Slug like "ethereum" or "btc-bitcoin" → try static dictionary first
    const cleanId = id.includes('-') ? id.split('-')[0] || id : id;
    const staticData = this.dictionary.getStaticData(cleanId);
    return `${(staticData?.symbol || cleanId).toUpperCase()}USDT`;
  }

  async getMarkets(limit: number): Promise<any[]> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/market/tickers`, {
        params: { category: 'spot' }
      })
    );

    // Bybit returns ALL spot tickers — sort by turnover (quote volume) descending
    const sorted = data.result.list
      .filter((t: any) => t.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.turnover24h) - parseFloat(a.turnover24h))
      .slice(0, limit);

    return sorted.map((ticker: any) => {
      const baseSymbol = ticker.symbol.replace(/USDT$/, '');
      const safeId = baseSymbol.toLowerCase();
      const staticData = this.dictionary.getStaticData(safeId);

      return {
        _provider: 'bybit',
        id: safeId,
        symbol: baseSymbol,
        name: staticData?.name || baseSymbol,
        image: staticData?.image || '',
        current_price: parseFloat(ticker.lastPrice),
        total_volume: parseFloat(ticker.turnover24h),
        price_change_percentage_24h: parseFloat(ticker.price24hPcnt) * 100, // fraction → percent
        market_cap: 0,
        market_cap_rank: 0
      };
    });
  }

  async getCoinData(id: string): Promise<any> {
    const symbol = this.resolveSymbol(id);

    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/market/tickers`, {
        params: { category: 'spot', symbol }
      })
    );

    const ticker = data.result.list?.[0];
    if (!ticker) throw new Error(`Bybit: ticker not found for ${symbol}`);

    const cleanId = id.includes('-') ? id.split('-')[0] || id : id;
    const staticData = this.dictionary.getStaticData(cleanId);
    const resolvedSymbol = ticker.symbol.replace(/USDT$/, '');

    return {
      _provider: 'bybit',
      id: cleanId,
      symbol: resolvedSymbol,
      name: staticData?.name || resolvedSymbol,
      image: staticData?.image || '',
      current_price: parseFloat(ticker.lastPrice),
      total_volume: parseFloat(ticker.turnover24h),
      price_change_percentage_24h: parseFloat(ticker.price24hPcnt) * 100,
      market_cap: 0,
      market_cap_rank: 0,
      // Raw fields for Deep Dive capsules (realTime category)
      lastPrice: ticker.lastPrice,
      priceChange: (parseFloat(ticker.lastPrice) - parseFloat(ticker.prevPrice24h)).toString(),
      priceChangePercent: ticker.price24hPcnt,
      highPrice: ticker.highPrice24h,
      lowPrice: ticker.lowPrice24h,
      bidPrice: ticker.bid1Price,
      askPrice: ticker.ask1Price,
      volume: ticker.volume24h,
      quoteVolume: ticker.turnover24h
    };
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<any[]> {
    const symbol = this.resolveSymbol(id);
    const interval = this.mapDaysToInterval(days);
    const limit = days === '1' ? 288 : (days === '7' ? 168 : 180);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/market/kline`, {
          params: { category: 'spot', symbol, interval, limit }
        })
      );

      // Bybit kline: [startTime, open, high, low, close, volume, turnover]
      return data.result.list.map((candle: any) => [
        parseInt(candle[0]),   // timestamp ms
        parseFloat(candle[1]), // open
        parseFloat(candle[2]), // high
        parseFloat(candle[3]), // low
        parseFloat(candle[4])  // close
      ]);
    } catch (err) {
      this.logger.warn(`Bybit OHLC failed for ${symbol}: ${(err as Error).message}`);
      return [];
    }
  }

  async getMarketChart(id: string, days: SupportedPeriod): Promise<{prices: [number, number][], total_volumes: [number, number][]}> {
    const symbol = this.resolveSymbol(id);
    const interval = this.mapDaysToInterval(days);
    const limit = days === '1' ? 288 : (days === '7' ? 168 : 180);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/market/kline`, {
          params: { category: 'spot', symbol, interval, limit }
        })
      );

      const prices: [number, number][] = data.result.list.map((candle: any) => [
        parseInt(candle[0]),
        parseFloat(candle[4]) // close price
      ]);
      const totalVolumes: [number, number][] = data.result.list.map((candle: any) => [
        parseInt(candle[0]),
        parseFloat(candle[6]) || 0 // turnover (quote volume)
      ]);

      return { prices, total_volumes: totalVolumes };
    } catch (err) {
      this.logger.warn(`Bybit market chart failed for ${symbol}: ${(err as Error).message}`);
      return { prices: [], total_volumes: [] };
    }
  }
}
