export type SupportedPeriod = "1" | "7" | "30";

export interface ProviderCapsule {
  label: string;
  value: string;
  provider: 'coingecko' | 'binance' | 'coinpaprika' | 'system';
}

export interface CoinSummary {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  priceChangePercentage24h: number;
  ath?: number | undefined;
  athDate?: string | undefined;
  atl?: number | undefined;
  atlDate?: string | undefined;
  capsules?: ProviderCapsule[];
}

export type OhlcCandle = [
  timestampMs: number,
  open: number,
  high: number,
  low: number,
  close: number,
];

export interface HistoryPoint {
  timestampMs: number;
  price: number;
  volume: number;
}

export interface CoinHistory {
  id: string;
  days: SupportedPeriod;
  prices: HistoryPoint[];
}

export interface IndexedSeriesPoint {
  timestampMs: number;
  indexedValue: number;
}

export interface ComparedCoinSeries {
  id: string;
  symbol: string;
  name: string;
  series: IndexedSeriesPoint[];
}

export interface CompareResponse {
  days: SupportedPeriod;
  coins: ComparedCoinSeries[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
}

export const API_ROUTES = {
  top: "/api/v1/coins/top",
  coin: (id: string) => `/api/v1/coins/${id}`,
  ohlc: (id: string, days: SupportedPeriod) =>
    `/api/v1/coins/${id}/ohlc?days=${days}`,
  history: (id: string, days: SupportedPeriod) =>
    `/api/v1/coins/${id}/history?days=${days}`,
  compare: (ids: string[], days: SupportedPeriod) =>
    `/api/v1/coins/compare?ids=${ids.join(",")}&days=${days}`,
} as const;
