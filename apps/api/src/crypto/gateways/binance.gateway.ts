import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import WebSocket from 'ws';
import { CryptoDictionaryService } from '../services/crypto-dictionary.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : true,
    credentials: true,
  },
})
export class BinanceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(BinanceGateway.name);

  // Keep track of which symbols users are actively watching
  private activeSubscriptions = new Set<string>();

  // Use the dictionary to securely fetch the expected pair for Binance
  constructor(private readonly dictionaryService: CryptoDictionaryService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // In a full prod app, we'd decrement a counter per symbol and unsubscribe from Binance if 0.
  }

  @SubscribeMessage('subscribeToLiveTicker')
  handleSubscribe(client: Socket, symbol: string) {
    const safeBinancePair = this.dictionaryService.getBinancePair(symbol) || `${symbol.toUpperCase()}USDT`;
    const binanceStreamId = safeBinancePair.toLowerCase();

    this.logger.log(`Client ${client.id} subscribed to ${binanceStreamId} (original: ${symbol})`);

    // Join a socket room for the ORIGINAL symbol, because the front-end listens exactly on what it sent
    client.join(symbol);

    if (!this.activeSubscriptions.has(binanceStreamId)) {
      this.activeSubscriptions.add(binanceStreamId);
      this.connectToBinance(binanceStreamId, symbol);
    }
  }

  @SubscribeMessage('unsubscribeFromLiveTicker')
  handleUnsubscribe(client: Socket, symbol: string) {
    client.leave(symbol);
    this.logger.log(`Client ${client.id} unsubscribed from ${symbol}`);
  }

  private connectToBinance(streamId: string, originalSymbol: string) {
    // Note: We create a dedicated stream per symbol for simplicity.
    // In heavy prod, multiplex over a single Binance WS connection.
    const wsUrl = `wss://data-stream.binance.vision:9443/ws/${streamId}@kline_1m`;
    this.logger.log(`Opening Binance stream: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      this.logger.log(`Binance stream connected for ${streamId}`);
    });

    ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.e === 'kline' && parsed.k) {
          const kline = parsed.k;

          // Emit strictly to the room for the original symbol
          this.server.to(originalSymbol).emit('liveTickerUpdate', {
            symbol: originalSymbol,
            time: kline.t,         // kline start time
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            isFinal: kline.x       // is this candle closed?
          });
        }
      } catch (err) {
        this.logger.error('Error parsing Binance message', err);
      }
    });

    ws.on('close', () => {
      this.logger.warn(`Binance stream closed for ${streamId}`);
      this.activeSubscriptions.delete(streamId);
    });

    ws.on('error', (error: any) => {
      this.logger.error(`Binance stream error for ${streamId}`, error);
    });
  }
}
