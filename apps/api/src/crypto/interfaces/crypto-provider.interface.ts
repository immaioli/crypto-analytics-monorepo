import { SupportedPeriod } from '@dashboard-cripto/shared-types';

export interface ICryptoProvider {
  /**
   * Return a raw array of markets. Later mathService will parse it.
   */
  getMarkets(limit: number): Promise<any[]>;

  /**
   * Return raw coin data.
   */
  getCoinData(id: string): Promise<any>;

  /**
   * Return raw OHLC arrays (timestamp, open, high, low, close).
   */
  getOhlc(id: string, days: SupportedPeriod): Promise<any[]>;

  /**
   * Return raw Market Chart data {prices: [timestamp, price][], total_volumes: [timestamp, volume][]}.
   */
  getMarketChart(id: string, days: SupportedPeriod): Promise<{prices: [number, number][], total_volumes: [number, number][]}>;
}
