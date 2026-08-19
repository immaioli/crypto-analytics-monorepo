import React from 'react';
import { CoinSummary } from '@dashboard-cripto/shared-types';

interface CoinCardProps {
  coin: CoinSummary;
  isSelected: boolean;
  onClick: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function CoinCard({ coin, isSelected, onClick, onRemove }: CoinCardProps) {
  const isPositive = coin.priceChangePercentage24h >= 0;

  return (
    <div
      onClick={() => onClick(coin.id)}
      className={`
        relative bg-slate-800 rounded-xl p-3 flex flex-col transition-all cursor-pointer group
        ${
          isSelected
            ? 'border-2 border-blue-500 shadow-md shadow-blue-900/20 transform scale-[1.02]'
            : 'border border-slate-700 hover:border-slate-500'
        }
      `}
    >
      {onRemove && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRemove(coin.id);
          }}
          className="absolute -top-2 -right-2 bg-slate-700 hover:bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          ✕
        </button>
      )}

      {/* Row 1: Icon and Symbol */}
      <div className="flex items-center gap-2 mb-1">
        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full bg-slate-700" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{coin.symbol}</span>
      </div>

      {/* Row 2: Name */}
      <h3 className="text-sm font-medium text-slate-400 leading-tight truncate mb-2">
        {coin.name}
      </h3>

      {/* Row 3: Price and Percentage */}
      <div className="mt-auto flex items-baseline gap-2 flex-wrap">
        <div className="text-base font-semibold text-white tracking-tight">
          ${coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </div>
        <div className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{coin.priceChangePercentage24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
