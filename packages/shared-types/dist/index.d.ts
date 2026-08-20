export type SupportedPeriod = "1" | "7" | "30";
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
}
export type OhlcCandle = [
    timestampMs: number,
    open: number,
    high: number,
    low: number,
    close: number
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
export declare const API_ROUTES: {
    readonly top: "/api/v1/coins/top";
    readonly coin: (id: string) => string;
    readonly ohlc: (id: string, days: SupportedPeriod) => string;
    readonly history: (id: string, days: SupportedPeriod) => string;
    readonly compare: (ids: string[], days: SupportedPeriod) => string;
};
//# sourceMappingURL=index.d.ts.map