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

        <div className="flex flex-col gap-6">
          {/* Default Info preserved as capsules too or alongside the new capsules */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('conversion')}</span>
              <span className="text-sm text-slate-200 font-medium">R$ {(selectedCoin.currentPrice * 5.4).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('volume_24h')}</span>
              <span className="text-sm text-slate-200 font-medium">${(selectedCoin.totalVolume / 1e6).toFixed(2)}M</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('high_30d')}</span>
              <span className="text-sm text-emerald-400 font-medium">{selectedCoin.ath !== undefined ? `$${selectedCoin.ath.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : t('na')}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('low_30d')}</span>
              <span className="text-sm text-rose-400 font-medium">{selectedCoin.atl !== undefined ? `$${selectedCoin.atl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : t('na')}</span>
            </div>
          </div>

          {/* Aggregated Capsules from Backend */}
          {selectedCoin.capsules && selectedCoin.capsules.length > 0 && (
            <div className="pt-4 border-t border-slate-800/50">
              <div className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">{t('aggregated_data')}</div>
              <div className="flex flex-wrap gap-3">
                {selectedCoin.capsules.map((capsule, idx) => {
                  let providerColor = 'bg-slate-800 text-slate-400';
                  if (capsule.provider === 'coingecko') providerColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                  if (capsule.provider === 'binance') providerColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                  if (capsule.provider === 'coinpaprika') providerColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';

                  return (
                    <div key={idx} className={`border rounded-full px-3 py-1.5 flex items-center gap-2 ${providerColor}`}>
                      <span className="text-xs opacity-75">{capsule.label}:</span>
                      <span className="text-sm font-semibold">{capsule.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
