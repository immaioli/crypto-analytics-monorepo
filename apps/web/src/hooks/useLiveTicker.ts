import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LiveTickerData {
  symbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isFinal: boolean;
}

export function useLiveTicker(symbol: string | null) {
  const [liveData, setLiveData] = useState<LiveTickerData | null>(null);

  useEffect(() => {
    if (!symbol) return;

    // Conecta no back-end NestJS (onde o Gateway WebSocket está rodando)
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

    socket.on('connect', () => {
      console.log('Connected to Live Trading Gateway');
      socket.emit('subscribeToLiveTicker', symbol);
    });

    socket.on('liveTickerUpdate', (data: LiveTickerData) => {
      setLiveData(data);
    });

    return () => {
      socket.emit('unsubscribeFromLiveTicker', symbol);
      socket.disconnect();
    };
  }, [symbol]);

  return { liveData };
}
