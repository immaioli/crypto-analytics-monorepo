import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';

@Injectable()
export class CoinGeckoClientService {
  private readonly logger = new Logger(CoinGeckoClientService.name);

  constructor(private readonly httpService: HttpService) {
    // Configura Circuit Breaker (Retries Automáticos com Exponential Backoff)
    // Se a CoinGecko falhar com erro de Rate Limit (429) ou erro de servidor (5xx), tenta novamente!
    // Usamos `as any` pois as definições de tipagem entre @nestjs/axios e axios-retry as vezes conflitam no TypeScript
    axiosRetry(this.httpService.axiosRef as any, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.warn(`Retrying request to ${requestConfig.url} (Attempt ${retryCount}): ${error.message}`);
      },
    });
  }

  private getAuthHeaders() {
    const key = process.env.COINGECKO_API_KEY;
    return key ? { 'x-cg-demo-api-key': key } : {};
  }

  async getMarkets(limit: number = 5): Promise<any[]> {
    const response = await firstValueFrom(
      this.httpService.get('/coins/markets', {
        headers: this.getAuthHeaders(),
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false,
        },
      })
    );
    return response.data;
  }

  async getOhlc(id: string, days: string): Promise<any[]> {
    const response = await firstValueFrom(
      this.httpService.get(`/coins/${id}/ohlc`, {
        headers: this.getAuthHeaders(),
        params: {
          vs_currency: 'usd',
          days,
        },
      })
    );
    return response.data;
  }

  async getMarketChart(id: string, days: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`/coins/${id}/market_chart`, {
        headers: this.getAuthHeaders(),
        params: {
          vs_currency: 'usd',
          days,
        },
      })
    );
    return response.data;
  }

  async getCoinData(id: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`/coins/${id}`, {
        headers: this.getAuthHeaders(),
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      })
    );
    return response.data;
  }
}
