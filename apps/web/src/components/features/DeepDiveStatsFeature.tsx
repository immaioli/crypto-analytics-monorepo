'use client';

import React from 'react';
import { CoinSummary, ProviderCapsule } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { useCoinSummary } from '@/hooks/useCoinSummary';
import { useTranslations } from 'next-intl';

interface DeepDiveStatsFeatureProps {
  coins: CoinSummary[];
}

const PROVIDER_COLORS: Record<ProviderCapsule['provider'], string> = {
  coingecko: 'bg-green-500/10 text-green-400 border-green-500/30',
  binance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  bybit: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  okx: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  coinlore: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  system: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
};

const FALLBACK_COLOR = 'bg-slate-800 text-slate-400 border-slate-700';

function colorFor(provider: ProviderCapsule['provider']): string {
  return PROVIDER_COLORS[provider] ?? FALLBACK_COLOR;
}

function CapsuleTile({ capsule }: { capsule: ProviderCapsule }) {
  const cls =
    'border rounded-lg px-4 py-2 flex flex-col justify-center min-w-[140px] ' +
    colorFor(capsule.provider) +
    ' hover:brightness-125 transition-all shadow-sm';
  return (
    <div className={cls} title="data-source">
      <span className="text-[10px] opacity-75 leading-tight mb-1 uppercase tracking-wide">
        {capsule.label}
     </span>
      <span className="text-sm font-semibold leading-tight">{capsule.value}</span>
   </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const dotCls = 'w-3 h-3 rounded-full border ' + color;
  return (
    <div className="flex items-center gap-2">
      <div className={dotCls} />
      <span className="text-xs text-slate-400">{label}</span>
   </div>
  );
}

export function DeepDiveStatsFeature({ coins }: DeepDiveStatsFeatureProps) {
  const t = useTranslations('DeepDive');
  const { selectedAssetId } = useAssetSelection();
  const localCoinId =
    selectedAssetId || (coins.length > 0 ? coins[0]?.id || '' : '');

  const { data: fetchedCoin, isLoading } = useCoinSummary(
    localCoinId || null,
  );

  if (!coins || coins.length === 0) return null;

  // Pick a baseline coin for the header (name/image/price). The top-coins list
  // always has at least basic info, so prefer that as a fallback before the
  // /coin/:id summary call lands.
  const baselineCoin =
    coins.find((c) => c.id === localCoinId) ||
    fetchedCoin ||
    coins[0];
  if (!baselineCoin) {
    return (
      <div className="animate-pulse h-[350px] bg-[#0b1220] rounded-lg border border-slate-800" />
    );
  }

  // The detailed coin (with capsules) is the fetched one. While it's in flight
  // we still render the header, but capsules will be empty until it resolves.
  const detailedCoin = fetchedCoin || baselineCoin;

  const isPositive = baselineCoin.priceChangePercentage24h >= 0;

  const realTime = (detailedCoin.capsules ?? []).filter(
    (c) => c.category === 'realTime',
  );
  const metadata = (detailedCoin.capsules ?? []).filter(
    (c) => c.category === 'metadata',
  );
  const risk = (detailedCoin.capsules ?? []).filter(
    (c) => c.category === 'riskAndValidation',
  );

  const hasAnyCapsules =
    realTime.length + metadata.length + risk.length > 0;

  const arrow = isPositive ? '▲' : '▼';
  const changePillCls =
  'text-lg font-medium px-2 py-0.5 rounded-md ' +
  (isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400');

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400">{t('title')}</div>

      <div className="bg-[#0b1220] rounded-lg border border-slate-800 p-6 min-h-[350px]">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <img
            src={baselineCoin.image}
            alt={baselineCoin.name}
            className="w-16 h-16 rounded-full bg-slate-700"
          />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {baselineCoin.name}{' '}
              <span className="text-xl text-slate-500 font-normal uppercase ml-2">
                {baselineCoin.symbol}
             </span>
           </h2>
            <div className="text-2xl mt-1 flex items-center gap-3">
              <span className="text-white">
                $
                {baselineCoin.currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 6,
                })}
             </span>
              <span className={changePillCls}>
                {arrow} {Math.abs(baselineCoin.priceChangePercentage24h).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
                <div className="flex flex-col gap-6 animate-pulse text-slate-600">
                  {t('real_time_trading')}...
                </div>
              ) : hasAnyCapsules ? (

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {t('real_time_trading')}
                <span className="text-[10px] text-slate-500 ml-2">
                  ({realTime.length})
               </span>
             </h3>
              <div className="flex flex-wrap gap-3">
                {realTime.map((capsule, idx) => (
                  <CapsuleTile key={'rt-' + idx} capsule={capsule} />
                ))}
             </div>
           </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {t('fundamentals_supply')}
                <span className="text-[10px] text-slate-500 ml-2">
                  ({metadata.length})
               </span>
             </h3>
              <div className="flex flex-wrap gap-3">
                {metadata.map((capsule, idx) => (
                  <CapsuleTile key={'md-' + idx} capsule={capsule} />
                ))}
             </div>
           </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {t('risk_volatility')}
                <span className="text-[10px] text-slate-500 ml-2">
                  ({risk.length})
               </span>
             </h3>
              <div className="flex flex-wrap gap-3">
                {risk.map((capsule, idx) => (
                  <CapsuleTile key={'rv-' + idx} capsule={capsule} />
                ))}
             </div>
           </div>

            <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
              <span className="text-xs text-slate-500 mr-2">{t('data_sources')}</span>
              <LegendDot
                color="bg-yellow-500/50 border-yellow-500"
                label="Binance"
              />
              <LegendDot
                color="bg-green-500/50 border-green-500"
                label="CoinGecko"
              />
              <LegendDot
                color="bg-orange-500/50 border-orange-500"
                label="Bybit"
              />
              <LegendDot
                color="bg-teal-500/50 border-teal-500"
                label="OKX"
              />
              <LegendDot
                color="bg-fuchsia-500/50 border-fuchsia-500"
                label="CoinLore"
              />
           </div>
         </div>
        ) : null}
     </div>
   </div>
  );
}
