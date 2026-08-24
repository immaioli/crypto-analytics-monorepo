import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICryptoProvider } from '../interfaces/crypto-provider.interface.js';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';
import { CryptoDictionaryService } from './crypto-dictionary.service.js';

@Injectable()
export class CoinPaprikaClientService implements ICryptoProvider {
  private readonly logger = new Logger(CoinPaprikaClientService.name);
  private readonly baseUrl = 'https://api.coinpaprika.com/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly dictionary: CryptoDictionaryService
  ) {}

  private mapDaysToInterval(days: SupportedPeriod): string {
    switch(days) {
      case '1': return '15m'; // Historical ticks for 1 day support 15m intervals or standard
      case '7': return '1d';
      case '30': return '1d';
      default: return '1d';
    }
  }

  async getMarkets(limit: number): Promise<any[]> {
    const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/tickers?limit=${limit}`));

    return data.map((asset: any) => {
      const staticData = this.dictionary.getStaticData(asset.symbol);
      return {
        _provider: 'coinpaprika',
        id: asset.id, // CoinPaprika ID like "btc-bitcoin"
        symbol: asset.symbol,
        name: asset.name,
        image: staticData?.image || '',
        current_price: parseFloat(asset.quotes.USD.price),
        total_volume: parseFloat(asset.quotes.USD.volume_24h),
        price_change_percentage_24h: parseFloat(asset.quotes.USD.percent_change_24h),
        market_cap: parseFloat(asset.quotes.USD.market_cap),
        market_cap_rank: parseInt(asset.rank, 10)
      };
    });
  }

  async getCoinData(id: string): Promise<any> {
    let asset;
    try {
      const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/tickers/${id}`));
      asset = data;
    } catch (error: any) {
      this.logger.warn(`Direct CoinPaprika lookup failed for ${id}. Trying search fallback...`);
      const searchRes = await firstValueFrom(this.httpService.get(`${this.baseUrl}/search?q=${id}`));
      if (searchRes.data?.currencies && searchRes.data.currencies.length > 0) {
        const foundCoin = searchRes.data.currencies[0];
        const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/tickers/${foundCoin.id}`));
        asset = data;
      } else {
        throw new Error(`Asset not found in CoinPaprika for id/search: ${id}`);
      }
    }

    const staticData = this.dictionary.getStaticData(asset.symbol);

    return {
      _provider: 'coinpaprika',
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      image: staticData?.image || '',
      current_price: parseFloat(asset.quotes.USD.price) || 0,
      total_volume: parseFloat(asset.quotes.USD.volume_24h) || 0,
      price_change_percentage_24h: parseFloat(asset.quotes.USD.percent_change_24h) || 0,
      price_change_percentage_1h: parseFloat(asset.quotes.USD.percent_change_1h) || 0,
      price_change_percentage_12h: parseFloat(asset.quotes.USD.percent_change_12h) || 0,
      price_change_percentage_7d: parseFloat(asset.quotes.USD.percent_change_7d) || 0,
      market_cap: parseFloat(asset.quotes.USD.market_cap) || 0,
      market_cap_rank: parseInt(asset.rank, 10) || 0
    };
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<any[]> {
    try {
      if (days === '1') {
        const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/coins/${id}/ohlcv/latest`));
        return data.map((candle: any) => [
          new Date(candle.time_open).getTime(),
          parseFloat(candle.open),
          parseFloat(candle.high),
          parseFloat(candle.low),
          parseFloat(candle.close)
        ]);
      }

      const interval = this.mapDaysToInterval(days);
      const startParam = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/tickers/${id}/historical?start=${startParam}&interval=${interval}`));

      // CoinPaprika historical endpoints only have price, not full OHLC. Use it to mock OHLC.
      return data.map((point: any) => [
        new Date(point.timestamp).getTime(),
        parseFloat(point.price),
        parseFloat(point.price),
        parseFloat(point.price),
        parseFloat(point.price)
      ]);
    } catch (err) {
      this.logger.warn(`CoinPaprika OHLC failed for ${id}`);
      return [];
    }
  }

  async getMarketChart(id: string, days: SupportedPeriod): Promise<{prices: [number, number][], total_volumes: [number, number][]}> {
    const interval = this.mapDaysToInterval(days);
    const startParam = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();

    try {
      const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/tickers/${id}/historical?start=${startParam}&interval=${interval}`));

      const prices: [number, number][] = data.map((point: any) => [new Date(point.timestamp).getTime(), parseFloat(point.price)]);
      const total_volumes: [number, number][] = data.map((point: any) => [new Date(point.timestamp).getTime(), parseFloat(point.volume_24h) || 0]);

      return { prices, total_volumes };
    } catch (e) {
       this.logger.warn(`CoinPaprika market chart failed for ${id}`);
       return { prices: [], total_volumes: [] };
    }
  }
}
