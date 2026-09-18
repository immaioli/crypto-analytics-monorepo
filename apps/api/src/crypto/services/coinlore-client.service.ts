import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * CoinLore enrichment service — NOT an ICryptoProvider.
 * No OHLC, no history endpoints. Only supply, % changes, and cross-exchange data.
 *
 * Used by CryptoService.getCoinSummary() to enrich capsules
 * in the riskAndValidation and metadata categories.
 */
@Injectable()
export class CoinLoreClientService {
  private readonly logger = new Logger(CoinLoreClientService.name);
  private readonly baseUrl = 'https://api.coinlore.net/api';

  // Known CoinLore IDs — populated from /tickers endpoint observation
  private static readonly SYMBOL_ID_MAP: Record<string, string> = {
    btc: '90', eth: '80', usdt: '83', bnb: '2710', sol: '48543',
    xrp: '58', usdc: '33285', doge: '2', ada: '2010', trx: '518',
    dot: '11639', link: '11968', shib: '5994', ton: '169312',
    avax: '54889', dai: '53615'
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Find CoinLore numeric ID by symbol. Searches the tickers list.
   * Rate-limited, so results should be cached by the caller.
   */
  async resolveId(symbol: string): Promise<string | null> {
    const upperSymbol = symbol.toUpperCase();

    // Fast path: static map
    const knownId = CoinLoreClientService.SYMBOL_ID_MAP[upperSymbol.toLowerCase()];
    if (knownId) return knownId;

    // Slow path: fetch top tickers and find match
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/tickers`, {
          params: { start: 0, limit: 100 }
        })
      );

      const match = data.data.find((t: any) => t.symbol.toUpperCase() === upperSymbol);
      return match?.id || null;
    } catch (err) {
      this.logger.warn(`CoinLore resolveId failed for ${symbol}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Fetch enriched data for a coin. Returns supply detail, volume adjusted,
   * and multi-window percent changes for risk & validation capsules.
   */
  async getCoinData(symbol: string): Promise<any | null> {
    const coinId = await this.resolveId(symbol);
    if (!coinId) return null;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/ticker`, {
          params: { id: coinId }
        })
      );

      const coin = data[0];
      if (!coin) return null;

      return {
        _provider: 'coinlore',
        symbol: coin.symbol,
        name: coin.name,
        price_usd: parseFloat(coin.price_usd) || 0,
        market_cap_usd: parseFloat(coin.market_cap_usd) || 0,
        rank: parseInt(coin.rank, 10) || 0,
        volume24: parseFloat(coin.volume24) || 0,
        volume24a: parseFloat(coin.volume24a) || 0,
        circulating_supply: parseFloat(coin.csupply) || 0,
        total_supply: parseFloat(coin.tsupply) || 0,
        max_supply: parseFloat(coin.msupply) || 0,
        percent_change_1h: parseFloat(coin.percent_change_1h) || 0,
        percent_change_24h: parseFloat(coin.percent_change_24h) || 0,
        percent_change_7d: parseFloat(coin.percent_change_7d) || 0
      };
    } catch (err) {
      this.logger.warn(`CoinLore getCoinData failed for ${symbol}: ${(err as Error).message}`);
      return null;
    }
  }
}
