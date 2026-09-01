'use client';

import React from 'react';
import { CoinSummary } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { useCoinSummary } from '@/hooks/useCoinSummary';
import { useTranslations } from 'next-intl';

interface DeepDiveStatsFeatureProps {
  coins: CoinSummary[];
}

export function DeepDiveStatsFeature({ coins }: DeepDiveStatsFeatureProps) {
  const t = useTranslations('DeepDive');
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
        {t('title')}
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

        <div className="flex flex-col gap-8">
          {/* Aggregated Capsules Grouped by Category */}
          {selectedCoin.capsules && selectedCoin.capsules.length > 0 && (
            <div className="flex flex-col gap-6">

              {/* Category: Real-Time Data */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Real-Time Trading
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedCoin.capsules.filter(c => c.category === 'realTime').map((capsule, idx) => {
                    let providerColor = 'bg-slate-800 text-slate-400 border-slate-700';
                    if (capsule.provider === 'coingecko') providerColor = 'bg-green-500/10 text-green-400 border-green-500/30';
                    if (capsule.provider === 'binance') providerColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';

                    return (
                      <div key={idx} className={`border rounded-lg px-4 py-2 flex flex-col justify-center min-w-[140px] ${providerColor} hover:brightness-125 transition-all shadow-sm`}>
                        <span className="text-[10px] opacity-75 leading-tight mb-1">{capsule.label}</span>
                        <span className="text-sm font-semibold leading-tight">{capsule.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category: Metadata & Fundamentals */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Fundamentals & Supply
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedCoin.capsules.filter(c => c.category === 'metadata' || !c.category).map((capsule, idx) => {
                    let providerColor = 'bg-slate-800 text-slate-400 border-slate-700';
                    if (capsule.provider === 'coingecko') providerColor = 'bg-green-500/10 text-green-400 border-green-500/30';
                    if (capsule.provider === 'binance') providerColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';

                    return (
                      <div key={idx} className={`border rounded-lg px-4 py-2 flex flex-col justify-center min-w-[140px] ${providerColor} hover:brightness-125 transition-all shadow-sm`}>
                        <span className="text-[10px] opacity-75 leading-tight mb-1">{capsule.label}</span>
                        <span className="text-sm font-semibold leading-tight">{capsule.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category: Risk & Validation */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Risk & Volatility
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedCoin.capsules.filter(c => c.category === 'riskAndValidation').map((capsule, idx) => {
                    let providerColor = 'bg-slate-800 text-slate-400 border-slate-700';
                    if (capsule.provider === 'coingecko') providerColor = 'bg-green-500/10 text-green-400 border-green-500/30';
                    if (capsule.provider === 'binance') providerColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';

                    return (
                      <div key={idx} className={`border rounded-lg px-4 py-2 flex flex-col justify-center min-w-[140px] ${providerColor} hover:brightness-125 transition-all shadow-sm`}>
                        <span className="text-[10px] opacity-75 leading-tight mb-1">{capsule.label}</span>
                        <span className="text-sm font-semibold leading-tight">{capsule.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legends Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
                <span className="text-xs text-slate-500 mr-2">Data Sources:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500"></div>
                  <span className="text-xs text-slate-400">Binance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></div>
                  <span className="text-xs text-slate-400">CoinGecko</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500/50 border border-orange-500"></div>
                  <span className="text-xs text-slate-400">CoinPaprika</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

