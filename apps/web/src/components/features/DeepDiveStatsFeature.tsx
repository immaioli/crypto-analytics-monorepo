'use client';

import React from 'react';
import { CoinSummary } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { useCoinSummary } from '@/hooks/useCoinSummary';

interface DeepDiveStatsFeatureProps {
  coins: CoinSummary[];
}

export function DeepDiveStatsFeature({ coins }: DeepDiveStatsFeatureProps) {
  const { selectedAssetId } = useAssetSelection();
  const localCoinId = selectedAssetId || (coins.length > 0 ? coins[0]?.id || "" || "" : '');

  const { data: fetchedCoin, isLoading } = useCoinSummary(selectedAssetId ? localCoinId : null);
  const selectedCoin = fetchedCoin || coins.find(coin => coin.id === localCoinId);

  if (!coins || coins.length === 0) return null;
  if (isLoading && !selectedCoin) {
    return <div className="animate-pulse h-[350px] bg-[#0b1220] rounded-lg border border-slate-800"></div>;
  }
  if (!selectedCoin) return null;

  const isPositive = selectedCoin.priceChangePercentage24h >= 0;

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400">
        Fundamental Metrics & Quick Stats
      </div>

      <div className="bg-[#0b1220] rounded-lg border border-slate-800 p-6 min-h-[350px]">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <img src={selectedCoin.image} alt={selectedCoin.name} className="w-16 h-16 rounded-full bg-slate-700" />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">{selectedCoin.name} <span className="text-xl text-slate-500 font-normal uppercase ml-2">{selectedCoin.symbol}</span></h2>
            <div className="text-2xl mt-1 flex items-center gap-3">
              <span className="text-white">${selectedCoin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
              <span className={`text-lg font-medium px-2 py-0.5 rounded-md ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(selectedCoin.priceChangePercentage24h).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-sm font-medium text-slate-400 mb-1">Conversion (BRL)</h4>
            <p className="text-lg font-semibold text-slate-200">
              R$ {(selectedCoin.currentPrice * 5.4).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Est. at 1 USD = 5.4 BRL</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-sm font-medium text-slate-400 mb-1">24h Trading Volume</h4>
            <p className="text-lg font-semibold text-slate-200">${(selectedCoin.totalVolume / 1e6).toFixed(2)} Million</p>
            <p className="text-xs text-slate-500 mt-1">Liquidity indicator</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-sm font-medium text-slate-400 mb-1">30-Day High</h4>
            <p className="text-lg font-semibold text-slate-200">
              {selectedCoin.ath !== undefined ? `$${selectedCoin.ath.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : 'N/A'}
            </p>
            <p className="text-xs text-emerald-500/80 mt-1">
              {selectedCoin.athDate ? new Date(selectedCoin.athDate).toLocaleDateString() : 'Monthly peak'}
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-sm font-medium text-slate-400 mb-1">30-Day Low</h4>
            <p className="text-lg font-semibold text-slate-200">
              {selectedCoin.atl !== undefined ? `$${selectedCoin.atl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : 'N/A'}
            </p>
            <p className="text-xs text-rose-500/80 mt-1">
              {selectedCoin.atlDate ? new Date(selectedCoin.atlDate).toLocaleDateString() : 'Monthly bottom'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
