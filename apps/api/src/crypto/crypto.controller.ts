import { Controller, Get, Param, Query } from '@nestjs/common';
import { CryptoService } from './crypto.service.js';
import { API_ROUTES, CoinSummary, OhlcCandle, SupportedPeriod, CoinHistory, CompareResponse } from '@dashboard-cripto/shared-types';

@Controller()
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get(API_ROUTES.top)
  async getTopCoins(): Promise<CoinSummary[]> {
    return this.cryptoService.getTopCoins();
  }

  // Use fixed path before parametrized path to avoid conflict!
  @Get('/api/v1/coins/compare')
  async compareCoins(
    @Query('ids') ids: string,
    @Query('days') days: SupportedPeriod = '7'
  ): Promise<CompareResponse> {
    const idsArray = ids ? ids.split(',').filter(id => id.trim() !== '') : [];
    return this.cryptoService.compareCoins(idsArray, days);
  }

  @Get('/api/v1/coins/:id/ohlc')
  async getOhlc(
    @Param('id') id: string,
    @Query('days') days: SupportedPeriod = '7'
  ): Promise<OhlcCandle[]> {
    return this.cryptoService.getOhlc(id, days);
  }

  @Get('/api/v1/coins/:id/history')
  async getHistory(
    @Param('id') id: string,
    @Query('days') days: SupportedPeriod = '7'
  ): Promise<CoinHistory> {
    return this.cryptoService.getHistory(id, days);
  }
}
