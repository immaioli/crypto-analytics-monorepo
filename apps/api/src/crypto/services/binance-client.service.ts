import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICryptoProvider } from '../interfaces/crypto-provider.interface.js';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';
import { CryptoDictionaryService } from './crypto-dictionary.service.js';

@Injectable()
export class BinanceClientService implements ICryptoProvider {
  private readonly logger = new Logger(BinanceClientService.name);
  private readonly baseUrl = 'https://data-api.binance.vision/api/v3';

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
    // 1. Fetch ALL tickers from Binance (we don't pass a symbol filter)
    const requestUrl = `${this.baseUrl}/ticker/24hr`;
    this.logger.debug(`Binance fetching all markets: ${requestUrl}`);

    const binanceResponse = await firstValueFrom(this.httpService.get(requestUrl));
    let tickersData: any[] = binanceResponse.data;

    // Filter only USDT pairs for consistency
    tickersData = tickersData.filter(ticker => ticker.symbol.endsWith('USDT'));

    // Filter out stablecoins (USDT, USDC, FDUSD) since they don't make sense as "Top Gainers" or volume leaders compared to themselves
    const stableCoins = ['USDTUSDT', 'USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'BUSDUSDT', 'DAIUSDT', 'EURUSDT'];
    tickersData = tickersData.filter(ticker => !stableCoins.includes(ticker.symbol));

    // Sort by quoteVolume to get the Top Volume (Major Liquidity)
    const topVolumeTickers = [...tickersData]
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 7);

    // Sort by priceChangePercent to get the Top Gainers (Biggest 24h pumpers, minimum volume 1M to avoid dead coins pumping 500% artificially)
    const topGainersTickers = [...tickersData]
      .filter(ticker => parseFloat(ticker.quoteVolume) > 1000000)
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
      .slice(0, 7);

    // We only need to fetch CoinGecko metadata for the unique coins we are keeping
    const uniqueTickers = Array.from(new Set([...topVolumeTickers, ...topGainersTickers]));

    // We can't await 14 requests concurrently without risking rate limits or massive delays.
    // Instead we use the CoinGecko generic search /search (which is meant for individual queries).
    // Better strategy for bulk: We just return the Binance data and let the frontend/backend use the standard CoinSummary route per coin if needed.
    // However, to keep it self-contained in 1 request for the UI:
    const enrichedMarkets = await Promise.all(uniqueTickers.map(async (ticker: any) => {
      const baseSymbol = ticker.symbol.replace(/USDT$/, ''); // BTCUSDT -> BTC
      const safeId = baseSymbol.toLowerCase();

      let resolvedImage = null;
      let resolvedName = baseSymbol;

      try {
         const cgSearchResponse = await firstValueFrom(this.httpService.get(`https://api.coingecko.com/api/v3/search?query=${baseSymbol}`, { timeout: 1500 }));
         if (cgSearchResponse.data?.coins?.length > 0) {
            const matchedAsset = cgSearchResponse.data.coins.find((c: any) => c.symbol.toLowerCase() === baseSymbol.toLowerCase()) || cgSearchResponse.data.coins[0];
            resolvedImage = matchedAsset.large || matchedAsset.thumb;
            resolvedName = matchedAsset.name;
         }
      } catch (e) {}

      return {
        _provider: 'binance',
        id: safeId, // We use the symbol as the generic ID (btc, eth)
        symbol: baseSymbol,
        name: resolvedName,
        image: resolvedImage || '',
        current_price: parseFloat(ticker.lastPrice),
        total_volume: parseFloat(ticker.quoteVolume),
        price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
        market_cap: 0,
        market_cap_rank: 0,
      };
    }));

    return enrichedMarkets;
  }

  async getCoinData(id: string): Promise<any> {
    // Attempt to enrich metadata using CoinGecko search API FIRST
    let resolvedName = id;
    let resolvedSymbol = id.toUpperCase();
    let resolvedImage = null;
    let marketRank = 0;

    try {
      // Small timeout to not block UI forever if CG is down
      const cgSearchResponse = await firstValueFrom(this.httpService.get(`https://api.coingecko.com/api/v3/search?query=${id}`, { timeout: 3000 }));
      if (cgSearchResponse.data?.coins?.length > 0) {
        // Match exact symbol or exact id to prevent "HEMI" finding something random starting with H
        const matchedAsset = cgSearchResponse.data.coins.find((c: any) => c.symbol.toLowerCase() === id.toLowerCase() || c.id.toLowerCase() === id.toLowerCase()) || cgSearchResponse.data.coins[0];
        resolvedName = matchedAsset.name;
        resolvedSymbol = matchedAsset.symbol.toUpperCase();
        resolvedImage = matchedAsset.large || matchedAsset.thumb;
        marketRank = matchedAsset.market_cap_rank || 0;
      }
    } catch (e) {
      this.logger.warn(`CoinGecko enrichment failed for ${id}`);
    }

    const staticCoinData = this.dictionary.getStaticData(id);
    if (!resolvedName || resolvedName === id) resolvedName = staticCoinData?.name || id;
    if (!resolvedImage) resolvedImage = staticCoinData?.image; // ui-avatars fallback

    const tradingPair = this.dictionary.getBinancePair(id);
    if (!tradingPair) throw new Error(`Binance pairing not found for ${id}`);

    const { data: tickerData } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/ticker/24hr?symbol=${tradingPair}`));

    return {
      _provider: 'binance',
      id: id,
      symbol: resolvedSymbol,
      name: resolvedName,
      image: resolvedImage,
      current_price: parseFloat(tickerData.lastPrice),
      total_volume: parseFloat(tickerData.quoteVolume),
      price_change_percentage_24h: parseFloat(tickerData.priceChangePercent),
      market_cap: 0,
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
