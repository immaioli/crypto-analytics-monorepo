import React from 'react';
import { CoinSummary } from '@dashboard-cripto/shared-types';

interface CoinCardProps {
  coin: CoinSummary;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export function CoinCard({ coin, isSelected, onClick }: CoinCardProps) {
  const isPositive = coin.priceChangePercentage24h >= 0;

  return (
    <div
      onClick={() => onClick(coin.id)}
      className={`
        bg-slate-800 rounded-xl p-4 flex flex-col transition-all cursor-pointer
        ${isSelected
          ? 'border-2 border-blue-500 shadow-md shadow-blue-900/20 transform scale-[1.02]'
          : 'border border-slate-700 hover:border-slate-500'
        }
      `}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 mb-3">
        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full bg-slate-700" />
        <h3 className="font-medium text-slate-200 leading-tight text-center truncate px-1">{coin.name}</h3>
        <span className="text-xs text-slate-400 uppercase tracking-wider text-right">{coin.symbol}</span>
      </div>

      <div className="mt-auto flex items-baseline justify-between flex-wrap gap-2">
        <div className="text-lg font-semibold text-white tracking-tight">
          ${coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
        </div>
        <div className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{coin.priceChangePercentage24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
