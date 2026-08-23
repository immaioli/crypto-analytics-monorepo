import { Injectable } from '@nestjs/common';
import { CoinSummary, HistoryPoint, ComparedCoinSeries, OhlcCandle } from '@dashboard-cripto/shared-types';

@Injectable()
export class CryptoMathService {

  normalizeTopCoins(data: any[]): CoinSummary[] {
    return data.map((coin: any) => this.normalizeCoinSummary(coin));
  }

  normalizeCoinSummary(coin: any): CoinSummary {
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      totalVolume: coin.total_volume,
      priceChangePercentage24h: coin.price_change_percentage_24h,
      ath: coin.ath || coin.ath_price,
      athDate: coin.athDate || coin.ath_date,
      atl: coin.atl,
      atlDate: coin.atlDate || coin.atl_date,
    };
  }

  normalizeOhlc(data: any[]): OhlcCandle[] {
    return data as OhlcCandle[];
  }

  /**
   * Derive extremes from a daily close series for the last 30 days.
   */
  extractMonthlyExtremes(prices: [number, number][]): {
    ath?: number;
    athDate?: string;
    atl?: number;
    atlDate?: string;
  } {
    if (!prices || prices.length === 0 || !prices[0]) return {};

    let high = prices[0][1];
    let highTs = prices[0][0];
    let low = prices[0][1];
    let lowTs = prices[0][0];

    for (const [timestampMs, price] of prices) {
      if (typeof price !== 'number' || Number.isNaN(price)) continue;
      if (price > high) {
        high = price;
        highTs = timestampMs;
      }
      if (price < low) {
        low = price;
        lowTs = timestampMs;
      }
    }

    return {
      ath: high,
      athDate: new Date(highTs).toISOString(),
      atl: low,
      atlDate: new Date(lowTs).toISOString(),
    };
  }

  /**
   * Derive extremes from a daily close series.
   * (Kept for historical/compatibility reasons if ever needed again)
   */
  extractYearlyExtremes(prices: [number, number][]): {
    ath?: number;
    athDate?: string;
    atl?: number;
    atlDate?: string;
  } {
    if (!prices || prices.length === 0 || !prices[0]) return {};

    let high = prices[0][1];
    let highTs = prices[0][0];
    let low = prices[0][1];
    let lowTs = prices[0][0];

    for (const [timestampMs, price] of prices) {
      if (typeof price !== 'number' || Number.isNaN(price)) continue;
      if (price > high) {
        high = price;
        highTs = timestampMs;
      }
      if (price < low) {
        low = price;
        lowTs = timestampMs;
      }
    }

    return {
      ath: high,
      athDate: new Date(highTs).toISOString(),
      atl: low,
      atlDate: new Date(lowTs).toISOString(),
    };
  }

  normalizeHistory(prices: [number, number][], volumes: [number, number][]): HistoryPoint[] {
    return prices.map((pricePoint, index) => {
      return {
        timestampMs: pricePoint[0],
        price: pricePoint[1],
        volume: volumes[index] ? volumes[index][1] : 0,
      };
    });
  }

  buildIndexedSeries(historyPoints: HistoryPoint[], basicInfo: CoinSummary | undefined, id: string): ComparedCoinSeries | null {
    if (!historyPoints || historyPoints.length === 0) return null;

    const firstPrice = historyPoints[0];
    if (!firstPrice) return null;

    const basePrice = firstPrice.price;

    const series = historyPoints.map(point => {
      const indexedValue = basePrice === 0
        ? 0
        : ((point.price - basePrice) / basePrice) * 100;

      return {
        timestampMs: point.timestampMs,
        indexedValue
      };
    });

    return {
      id,
      symbol: basicInfo?.symbol || id,
      name: basicInfo?.name || id,
      series,
    };
  }
}
