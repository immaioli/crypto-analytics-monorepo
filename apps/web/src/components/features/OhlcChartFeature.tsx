'use client';

import React, { useState, useEffect } from 'react';
import { useOhlc } from '@/hooks/useOhlc';
import { useOhlcChartFormatter } from '@/hooks/useOhlcChartFormatter';
import { useLiveTicker } from '@/hooks/useLiveTicker';
import { LightweightChartWrapper } from '../charts/LightweightChartWrapper';
import { CoinSummary, SupportedPeriod } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { PeriodSelector } from '../ui/PeriodSelector';
import { ChartLoadingView, ChartErrorView } from '../ui/ChartStates';
import { SelectedAssetBadge } from '../ui/SelectedAssetBadge';
import { useCoinSummary } from '@/hooks/useCoinSummary';

interface OhlcChartFeatureProps {
  coins: CoinSummary[];
}

export function OhlcChartFeature({ coins }: OhlcChartFeatureProps) {
  const { selectedAssetId } = useAssetSelection();

  const [localCoinId, setLocalCoinId] = useState<string>(
    selectedAssetId || (coins.length > 0 ? coins[0]?.id || "" : '')
  );

  useEffect(() => {
    if (selectedAssetId) {
      setLocalCoinId(selectedAssetId);
    }
  }, [selectedAssetId]);

  const [days, setDays] = useState<SupportedPeriod>('1');

  const { data: ohlcData, isLoading, isError } = useOhlc(localCoinId, days);
  const { liveData } = useLiveTicker(localCoinId);
  const { data: coinSummary } = useCoinSummary(localCoinId);

  // Formatting extracted to Custom Hook (Separation of Concerns)
  const { chartData, priceLines } = useOhlcChartFormatter(ohlcData);

  // Format the live tick for Lightweight Charts Time
  const liveUpdate = liveData ? {
    time: (Math.floor(liveData.time / 1000)) as any,
    open: liveData.open,
    high: liveData.high,
    low: liveData.low,
    close: liveData.close,
  } : undefined;

  if (!coins || coins.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <SelectedAssetBadge fallbackId={coins.length > 0 ? coins[0]?.id || "" : ""} />

          {coinSummary?.ath && coinSummary?.atl && (
            <>
              <div className="hidden sm:block h-10 w-px bg-slate-800"></div>
              <div className="hidden sm:flex items-center gap-3 text-xs border border-slate-700 bg-[#0b1220] rounded-lg px-3 py-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500">ATH</span>
                  <span className="text-emerald-400 font-medium">${coinSummary.ath.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                  <span className="text-[10px] text-emerald-500/70 ml-1">
                    {coinSummary.athDate ? new Date(coinSummary.athDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit'}) : ''}
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-700"></div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500">ATL</span>
                  <span className="text-rose-400 font-medium">${coinSummary.atl.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                  <span className="text-[10px] text-rose-500/70 ml-1">
                    {coinSummary.atlDate ? new Date(coinSummary.atlDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit'}) : ''}
                  </span>
                </div>
              </div>
            </>
          )}

          {liveData && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center justify-center p-1">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
          <PeriodSelector days={days} onChange={setDays} />
        </div>
      </div>

      <div className="bg-[#0b1220] rounded-lg border border-slate-800 p-4 min-h-[400px] flex flex-col justify-center relative">
        {isError && !chartData && <ChartErrorView message="Failed to load chart data." />}

        {(!isError || chartData) && chartData && (
          <>
            <LightweightChartWrapper
              type="candlestick"
              data={chartData}
              liveUpdate={liveUpdate}
              priceLines={priceLines}
              seriesConfig={{
                title: 'Current',
                priceLineColor: '#f97316', // Orange 500
                priceLineWidth: 3,         // Same thickness as the blue central line
                priceLineStyle: 1          // Dotted style
              }}
              height={350}
            />
            <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium px-2 justify-center border-t border-slate-800/50 pt-4">
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-b-2 border-dotted border-emerald-500"></span><span className="text-slate-400">Highest High (Max ▲)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-b-2 border-dashed border-emerald-400"></span><span className="text-slate-400">Lowest High (Max ▼)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-b-2 border-dashed border-blue-500"></span><span className="text-slate-400">Center Average</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-b-2 border-dashed border-rose-400"></span><span className="text-slate-400">Highest Low (Min ▲)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-b-2 border-dotted border-rose-500"></span><span className="text-slate-400">Lowest Low (Min ▼)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-b-2 border-dotted border-orange-500"></span><span className="text-slate-400">Current Price</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
