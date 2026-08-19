import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICryptoProvider } from '../interfaces/crypto-provider.interface.js';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';
import { CryptoDictionaryService } from './crypto-dictionary.service.js';

@Injectable()
export class CoinCapClientService implements ICryptoProvider {
  private readonly logger = new Logger(CoinCapClientService.name);
  private readonly baseUrl = 'https://api.coincap.io/v2';

  constructor(
    private readonly httpService: HttpService,
    private readonly dictionary: CryptoDictionaryService
  ) {}

  private mapDaysToInterval(days: SupportedPeriod): string {
    switch(days) {
      case '1': return 'm5'; // 5 minutes
      case '7': return 'h1'; // 1 hour
      case '30': return 'h2'; // 2 hours
      default: return 'd1';
    }
  }

  async getMarkets(limit: number): Promise<any[]> {
    const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/assets?limit=${limit}`));

    // Return CoinCap standardized format
    return data.data.map((asset: any) => {
      const staticData = this.dictionary.getStaticData(asset.id);
      return {
        _provider: 'coincap',
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        image: staticData?.image || '',
        current_price: parseFloat(asset.priceUsd),
        total_volume: parseFloat(asset.volumeUsd24Hr),
        price_change_percentage_24h: parseFloat(asset.changePercent24Hr),
        market_cap: parseFloat(asset.marketCapUsd),
        market_cap_rank: parseInt(asset.rank, 10)
      };
    });
  }

  async getCoinData(id: string): Promise<any> {
    let asset;
    try {
      const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/assets/${id}`));
      asset = data.data;
    } catch (error: any) {
      // If direct ID lookup fails, it might be a search query (like "2z"). Try to search.
      this.logger.warn(`Direct CoinCap lookup failed for ${id}. Trying search fallback...`);
      const searchRes = await firstValueFrom(this.httpService.get(`${this.baseUrl}/assets?search=${id}&limit=1`));
      if (searchRes.data?.data && searchRes.data.data.length > 0) {
        asset = searchRes.data.data[0];
      } else {
        throw new Error(`Asset not found in CoinCap for id/search: ${id}`);
      }
    }

    const staticData = this.dictionary.getStaticData(asset.id);

    return {
      _provider: 'coincap',
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      image: staticData?.image || '',
      current_price: parseFloat(asset.priceUsd) || 0,
      total_volume: parseFloat(asset.volumeUsd24Hr) || 0,
      price_change_percentage_24h: parseFloat(asset.changePercent24Hr) || 0,
      market_cap: parseFloat(asset.marketCapUsd) || 0,
      market_cap_rank: parseInt(asset.rank, 10) || 0
    };
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<any[]> {
    // CoinCap candles endpoint requires exchange, baseId and quoteId. Too complex for fallback fallback without mapping pairs to exchange.
    // However, they have /assets/{id}/history for generic history. For OHLC we might need candles.
    // Let's use Binance candles via coincap: /candles?exchange=binance&interval=m5&baseId=bitcoin&quoteId=tether
    const interval = this.mapDaysToInterval(days);

    try {
      // Trying CoinCap native candles pointing to binance as exchange proxy (often unreliable if pair isn't exact)
      const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/candles?exchange=binance&interval=${interval}&baseId=${id}&quoteId=tether`));

      return data.data.map((candle: any) => [
        candle.period, // timestamp
        parseFloat(candle.open),
        parseFloat(candle.high),
        parseFloat(candle.low),
        parseFloat(candle.close)
      ]);
    } catch (err) {
      // Fallback: build OHLC from /history if /candles fail
      this.logger.warn(`CoinCap /candles failed for ${id}. Falling back to /history mapping.`);
      const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/assets/${id}/history?interval=${interval}`));

      // Map history points to pseudo-OHLC (since history only has price)
      return data.data.map((point: any) => [
        point.time,
        parseFloat(point.priceUsd),
        parseFloat(point.priceUsd),
        parseFloat(point.priceUsd),
        parseFloat(point.priceUsd)
      ]);
    }
  }

  async getMarketChart(id: string, days: SupportedPeriod): Promise<{prices: [number, number][], total_volumes: [number, number][]}> {
    const interval = this.mapDaysToInterval(days);
    const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/assets/${id}/history?interval=${interval}`));

    // CoinCap /history doesn't provide volume in this endpoint directly per point, only price.
    const prices: [number, number][] = data.data.map((point: any) => [point.time, parseFloat(point.priceUsd)]);
    const total_volumes: [number, number][] = data.data.map((point: any) => [point.time, 0]); // Zero volume mock

    return { prices, total_volumes };
  }
}
