import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('CryptoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/coins/top', () => {
    it('returns an array of top 10 coins matching CoinSummary contract', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/coins/top');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstCoin = response.body[0];
      expect(firstCoin).toHaveProperty('id');
      expect(firstCoin).toHaveProperty('symbol');
      expect(firstCoin).toHaveProperty('name');
      expect(firstCoin).toHaveProperty('image');
      expect(firstCoin).toHaveProperty('currentPrice');
      expect(firstCoin).toHaveProperty('marketCap');
      expect(firstCoin).toHaveProperty('totalVolume');
      expect(firstCoin).toHaveProperty('priceChangePercentage24h');
    });
  });

  describe('GET /api/v1/coins/:id/ohlc', () => {
    it('returns an array of OHLC candles', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/coins/bitcoin/ohlc?days=7');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstCandle = response.body[0];
      expect(Array.isArray(firstCandle)).toBe(true);
      expect(firstCandle.length).toBe(5); // [timestamp, open, high, low, close]
      expect(typeof firstCandle[0]).toBe('number'); // timestamp
      expect(typeof firstCandle[1]).toBe('number'); // open
      expect(typeof firstCandle[2]).toBe('number'); // high
      expect(typeof firstCandle[3]).toBe('number'); // low
      expect(typeof firstCandle[4]).toBe('number'); // close
    });
  });

  describe('GET /api/v1/coins/:id/history', () => {
    it('returns a CoinHistory object', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/coins/bitcoin/history?days=7');

      expect(response.status).toBe(200);

      const body = response.body;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('days');
      expect(body).toHaveProperty('prices');
      expect(Array.isArray(body.prices)).toBe(true);

      if (body.prices.length > 0) {
        const firstPoint = body.prices[0];
        expect(firstPoint).toHaveProperty('timestampMs');
        expect(firstPoint).toHaveProperty('price');
        expect(firstPoint).toHaveProperty('volume');
      }
    });
  });

  describe('GET /api/v1/coins/compare', () => {
    it('returns compared coins indexed from 0 base', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/coins/compare?ids=bitcoin,ethereum&days=7');

      expect(response.status).toBe(200);

      const body = response.body;
      expect(body).toHaveProperty('days', '7');
      expect(body).toHaveProperty('coins');
      expect(Array.isArray(body.coins)).toBe(true);
      expect(body.coins.length).toBe(2);

      const firstCoin = body.coins[0];
      expect(firstCoin).toHaveProperty('id');
      expect(firstCoin).toHaveProperty('symbol');
      expect(firstCoin).toHaveProperty('name');
      expect(firstCoin).toHaveProperty('series');
      expect(Array.isArray(firstCoin.series)).toBe(true);

      if (firstCoin.series.length > 0) {
        // According to Article I, the first index should be mathematically 0%
        expect(firstCoin.series[0].indexedValue).toBe(0);
      }
    });
  });
});
