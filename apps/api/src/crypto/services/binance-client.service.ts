import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICryptoProvider } from '../interfaces/crypto-provider.interface.js';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';
import { CryptoDictionaryService } from './crypto-dictionary.service.js';

@Injectable()
export class BinanceClientService implements ICryptoProvider {
  private readonly logger = new Logger(BinanceClientService.name);
  private readonly baseUrl = 'https://api.binance.com/api/v3';

  constructor(
    private readonly httpService: HttpService,
    private readonly dictionary: CryptoDictionaryService
  ) {}

  private mapDaysToInterval(days: SupportedPeriod): string {
    switch(days) {
      case '1': return '5m';
      case '7': return '1h';
      case '30': return '4h';
      default: return '1d';
    }
  }

  async getMarkets(limit: number): Promise<any[]> {
    const coinIds = this.dictionary.getTopCoinIds(limit);
    const tradingPairs = coinIds.map(coinId => this.dictionary.getBinancePair(coinId)).filter(Boolean);
    const symbolsParam = encodeURIComponent(JSON.stringify(tradingPairs));

    const requestUrl = `${this.baseUrl}/ticker/24hr?symbols=${symbolsParam}`;
    this.logger.debug(`Binance fetching markets: ${requestUrl}`);

    // Fetch Binance tickers + CoinCap assets in parallel for market cap enrichment
    const [binanceResponse, coincapResponse] = await Promise.all([
      firstValueFrom(this.httpService.get(requestUrl)),
      firstValueFrom(this.httpService.get(`https://api.coincap.io/v2/assets?limit=${limit}`)).catch(() => null),
    ]);

    const tickersData = binanceResponse.data;
    const coincapAssetMap = new Map<string, any>();
    if (coincapResponse?.data?.data) {
      for (const coincapAsset of coincapResponse.data.data) {
        coincapAssetMap.set(coincapAsset.id, coincapAsset);
      }
    }

    return tickersData.map((ticker: any) => {
      const matchedCoinId = coinIds.find(coinId => this.dictionary.getBinancePair(coinId) === ticker.symbol);
      const staticCoinData = this.dictionary.getStaticData(matchedCoinId || '');
      const coincapAsset = coincapAssetMap.get(matchedCoinId || '');

      return {
        _provider: 'binance',
        id: matchedCoinId,
        symbol: staticCoinData?.symbol,
        name: staticCoinData?.name,
        image: staticCoinData?.image,
        current_price: parseFloat(ticker.lastPrice),
        total_volume: parseFloat(ticker.quoteVolume),
        price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
        market_cap: coincapAsset ? parseFloat(coincapAsset.marketCapUsd) : 0,
        market_cap_rank: coincapAsset ? parseInt(coincapAsset.rank, 10) : 0,
      };
    });
  }

  async getCoinData(id: string): Promise<any> {
    const tradingPair = this.dictionary.getBinancePair(id);
    if (!tradingPair) throw new Error(`Binance pairing not found for ${id}`);

    const { data: tickerData } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/ticker/24hr?symbol=${tradingPair}`));
    const staticCoinData = this.dictionary.getStaticData(id);

    let resolvedName = staticCoinData?.name;
    let resolvedSymbol = staticCoinData?.symbol;
    let marketCap = 0;
    let marketRank = 0;

    // Attempt to enrich missing name and market cap using CoinCap metadata
    if (!this.dictionary.hasMapping(id)) {
      try {
        const coincapSearchResponse = await firstValueFrom(this.httpService.get(`https://api.coincap.io/v2/assets?search=${id}&limit=1`));
        if (coincapSearchResponse.data?.data?.length > 0) {
          const matchedAsset = coincapSearchResponse.data.data[0];
          resolvedName = matchedAsset.name;
          resolvedSymbol = matchedAsset.symbol;
          marketCap = parseFloat(matchedAsset.marketCapUsd) || 0;
          marketRank = parseInt(matchedAsset.rank, 10) || 0;
        }
      } catch (_enrichmentError) {
        // Silently ignore and stick to fallback mock
      }
    }

    return {
      _provider: 'binance',
      id: id,
      symbol: resolvedSymbol,
      name: resolvedName,
      image: staticCoinData?.image,
      current_price: parseFloat(tickerData.lastPrice),
      total_volume: parseFloat(tickerData.quoteVolume),
      price_change_percentage_24h: parseFloat(tickerData.priceChangePercent),
      market_cap: marketCap,
      market_cap_rank: marketRank
    };
  }

  async getOhlc(id: string, days: SupportedPeriod): Promise<any[]> {
    const tradingPair = this.dictionary.getBinancePair(id);
    if (!tradingPair) throw new Error(`Binance pairing not found for ${id}`);

    const candleInterval = this.mapDaysToInterval(days);
    const candleLimit = days === '1' ? 288 : (days === '7' ? 168 : 180);

    const { data: klinesData } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/klines?symbol=${tradingPair}&interval=${candleInterval}&limit=${candleLimit}`));

    // Binance returns: [ [Open time, Open, High, Low, Close, Volume, Close time, ...], ... ]
    return klinesData.map((candle: any) => [
      candle[0], // timestamp (ms)
      parseFloat(candle[1]), // open
      parseFloat(candle[2]), // high
      parseFloat(candle[3]), // low
      parseFloat(candle[4])  // close
    ]);
  }

  async getMarketChart(id: string, days: SupportedPeriod): Promise<{prices: [number, number][], total_volumes: [number, number][]}> {
    // For market chart we reuse klines to get history (Binance doesn't have a direct "history" like CoinGecko)
    const tradingPair = this.dictionary.getBinancePair(id);
    if (!tradingPair) throw new Error(`Binance pairing not found for ${id}`);

    const candleInterval = this.mapDaysToInterval(days);
    const candleLimit = days === '1' ? 288 : (days === '7' ? 168 : 180);

    const { data: klinesData } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/klines?symbol=${tradingPair}&interval=${candleInterval}&limit=${candleLimit}`));

    const prices: [number, number][] = klinesData.map((candle: any) => [candle[0], parseFloat(candle[4])]); // timestamp, close price
    const totalVolumes: [number, number][] = klinesData.map((candle: any) => [candle[0], parseFloat(candle[7])]); // quote asset volume

    return { prices, total_volumes: totalVolumes };
  }
}
