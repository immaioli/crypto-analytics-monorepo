import { Injectable } from '@nestjs/common';
import { CoinSummary, HistoryPoint, OhlcCandle, ComparedCoinSeries } from '@dashboard-cripto/shared-types';

@Injectable()
export class CryptoMathService {

  normalizeTopCoins(data: any[]): CoinSummary[] {
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      totalVolume: coin.total_volume,
      priceChangePercentage24h: coin.price_change_percentage_24h,
    }));
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
