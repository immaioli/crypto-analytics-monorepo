'use client';

import React from 'react';
import { useTopCoins } from '@/hooks/useTopCoins';

export function TopCoinsList() {
  const { data: coins, isLoading, isError, error } = useTopCoins();

  if (isLoading) {
    return (
      <div data-testid="loading-indicator" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse border border-slate-700"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
        Error loading coins: {error.message}
      </div>
    );
  }

  if (!coins?.length) {
    return <div className="text-slate-400">No coins found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {coins.map((coin) => {
        const isPositive = coin.priceChangePercentage24h >= 0;

        return (
          <div
            key={coin.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col hover:border-blue-500/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full bg-slate-700" />
              <div>
                <h3 className="font-medium text-slate-200 leading-tight">{coin.name}</h3>
                <span className="text-xs text-slate-400 uppercase tracking-wider">{coin.symbol}</span>
              </div>
            </div>

            <div className="mt-auto">
              <div className="text-lg font-semibold text-white tracking-tight">
                ${coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
              <div className={`text-sm font-medium mt-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{coin.priceChangePercentage24h.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
