import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoDictionaryService {
  // CoinGecko/CoinCap IDs to generic/Binance mappings
  private readonly mappings: Record<string, { symbol: string; binancePair: string; name: string; image: string }> = {
    'bitcoin': { symbol: 'BTC', binancePair: 'BTCUSDT', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    'ethereum': { symbol: 'ETH', binancePair: 'ETHUSDT', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    'solana': { symbol: 'SOL', binancePair: 'SOLUSDT', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    'binancecoin': { symbol: 'BNB', binancePair: 'BNBUSDT', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    'ripple': { symbol: 'XRP', binancePair: 'XRPUSDT', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
    'cardano': { symbol: 'ADA', binancePair: 'ADAUSDT', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
    'avalanche-2': { symbol: 'AVAX', binancePair: 'AVAXUSDT', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
    'polkadot': { symbol: 'DOT', binancePair: 'DOTUSDT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
    'dogecoin': { symbol: 'DOGE', binancePair: 'DOGEUSDT', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
    'chainlink': { symbol: 'LINK', binancePair: 'LINKUSDT', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
    // Expanded mapping for test cases
    'pepe': { symbol: 'PEPE', binancePair: 'PEPEUSDT', name: 'Pepe', image: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg' },
    'alchemy-pay': { symbol: 'ACH', binancePair: 'ACHUSDT', name: 'Alchemy Pay', image: 'https://assets.coingecko.com/coins/images/12423/small/Alchemy_Pay.png' },
    'ach': { symbol: 'ACH', binancePair: 'ACHUSDT', name: 'Alchemy Pay', image: 'https://assets.coingecko.com/coins/images/12423/small/Alchemy_Pay.png' },
    'astar': { symbol: 'ASTR', binancePair: 'ASTRUSDT', name: 'Astar', image: 'https://assets.coingecko.com/coins/images/22617/small/astar.png' },
    'heyaura': { symbol: 'AURA', binancePair: 'AURAUSDT', name: 'Heyaura', image: 'https://ui-avatars.com/api/?name=AU&background=random&color=fff' },
    '2z': { symbol: '2Z', binancePair: '2ZUSDT', name: 'DoubleZero', image: 'https://ui-avatars.com/api/?name=2Z&background=random&color=fff' },
    'doublezero': { symbol: '2Z', binancePair: '2ZUSDT', name: 'DoubleZero', image: 'https://ui-avatars.com/api/?name=2Z&background=random&color=fff' },
    'aerodrome': { symbol: 'AERO', binancePair: 'AEROUSDT', name: 'Aerodrome', image: 'https://assets.coingecko.com/coins/images/31032/small/aerodrome.jpeg' },
    'aero': { symbol: 'AERO', binancePair: 'AEROUSDT', name: 'Aerodrome', image: 'https://assets.coingecko.com/coins/images/31032/small/aerodrome.jpeg' }
  };

  private getBaseId(id: string): string | null {
    const lowerId = id.toLowerCase();
    const upperId = id.toUpperCase();

    if (this.mappings[lowerId]) {
      return lowerId;
    }

    // Search by Symbol (e.g. BTC)
    for (const [key, val] of Object.entries(this.mappings)) {
      if (val.symbol === upperId) return key;
    }

    return null;
  }

  getBinancePair(id: string): string | null {
    if (!id) return null;
    const baseId = this.getBaseId(id);

    if (baseId) {
      const mapping = this.mappings[baseId];
      if (mapping) return mapping.binancePair;
    }

    // Resilient fallback for search bar inputs:
    // If the user types "pepe", we infer "PEPEUSDT"
    // If the user types "pepeusdt", it becomes "PEPEUSDT" securely
    const upperId = id.toUpperCase();
    if (upperId.endsWith('USDT')) return upperId;

    return `${upperId}USDT`;
  }

  getStaticData(id: string) {
    if (!id) return null;
    const baseId = this.getBaseId(id);

    if (baseId) {
      const mapping = this.mappings[baseId];
      if (mapping) return mapping;
    }

    // Fallback for dynamically searched coins not in the dictionary.
    // The user requested: "o Symbol deve ser o ID e não o name da moeda"
    // So symbol gets the original ID uppercase (e.g. 2Z) and name gets formatted.
    const cleanId = id.replace(/usdt$/i, '');
    const canonicalId = cleanId.toLowerCase();
    const displaySymbol = cleanId.toUpperCase();
    const safeName = cleanId.charAt(0).toUpperCase() + cleanId.slice(1).toLowerCase();

    return {
      symbol: displaySymbol,
      binancePair: `${displaySymbol}USDT`,
      name: safeName,
      image: `https://ui-avatars.com/api/?name=${displaySymbol.substring(0,2)}&background=random&color=fff`
    };
  }

  hasMapping(id: string): boolean {
    return this.getBaseId(id) !== null;
  }

  // Returns the default dashboard market tokens
  getTopCoinIds(limit: number = 5): string[] {
    return Object.keys(this.mappings).slice(0, limit);
  }
}
