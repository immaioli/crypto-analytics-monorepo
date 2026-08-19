import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoDictionaryService {
  // Keep only the absolute minimal mapping for default load since Binance doesn't provide
  // top 10 market cap directly without heavy calculation.
  private readonly defaultMarket = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'TRX', 'DOT', 'DOGE', 'LINK'];

  getBinancePair(id: string): string | null {
    if (!id) return null;

    // We no longer rely on a hardcoded list.
    // We assume the user searched by Symbol or Coin ID and append USDT.
    const cleanId = id.replace(/usdt$/i, '');
    const upperId = cleanId.toUpperCase();

    return `${upperId}USDT`;
  }

  getStaticData(id: string) {
    if (!id) return null;

    // Dynamic resolution for names and symbols
    const cleanId = id.replace(/usdt$/i, '');
    const displaySymbol = cleanId.toUpperCase();

    // Attempt basic capitalization for unknown ids, but rely on CoinGecko to fix it
    const safeName = cleanId === 'BTC' ? 'Bitcoin' :
                     cleanId === 'ETH' ? 'Ethereum' :
                     cleanId.charAt(0).toUpperCase() + cleanId.slice(1).toLowerCase();

    return {
      symbol: displaySymbol,
      binancePair: `${displaySymbol}USDT`,
      name: safeName,
      image: null // Removed ui-avatars so the backend is forced to fall back to real images
    };
  }

  hasMapping(id: string): boolean {
    // We now support everything dynamically via Binance pairs
    return true;
  }

  // Returns the default dashboard market tokens
  getTopCoinIds(limit: number = 5): string[] {
    return this.defaultMarket.slice(0, limit);
  }
}