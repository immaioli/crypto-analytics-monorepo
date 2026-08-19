'use client';

import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { LightweightChartWrapper } from '../charts/LightweightChartWrapper';
import { CoinSummary, SupportedPeriod, CoinHistory, API_ROUTES } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { PeriodSelector } from '../ui/PeriodSelector';
import { ChartErrorView } from '../ui/ChartStates';
import { useVolumeChartFormatter } from '@/hooks/useVolumeChartFormatter';
import { SelectedAssetBadge } from '../ui/SelectedAssetBadge';

interface VolumeProfileFeatureProps {
  coins: CoinSummary[];
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('An error occurred while fetching history data.');
  return response.json();
};

export function VolumeProfileFeature({ coins }: VolumeProfileFeatureProps) {
  const { selectedAssetId } = useAssetSelection();
  const [days, setDays] = useState<SupportedPeriod>('1');

  const localCoinId = selectedAssetId || (coins.length > 0 ? coins[0]?.id || "" : '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // We fetch the full history endpoint which includes volumes
  const { data: historyData, isLoading, isError } = useQuery<CoinHistory, Error>({
    queryKey: ['coins', localCoinId, 'history', days],
    queryFn: () => fetcher(`${apiUrl}${API_ROUTES.history(localCoinId, days)}`),
    enabled: !!localCoinId,
    refetchInterval: 60000,
    placeholderData: keepPreviousData,
  });

  const { multiLineData } = useVolumeChartFormatter(historyData);

  if (!coins || coins.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <SelectedAssetBadge fallbackId={coins.length > 0 ? coins[0]?.id || "" : ""} />
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
        {isError && (!multiLineData || multiLineData.length === 0) && <ChartErrorView message="Failed to load volume data." />}

        {(!isError || multiLineData) && multiLineData && multiLineData.length > 0 && (
          <>
            <LightweightChartWrapper
              type="multi-line"
              multiLineData={multiLineData}
              height={350}
            />
            <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium px-2 justify-center border-t border-slate-800/50 pt-4">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span><span className="text-slate-400">Buy Volume (Up)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500"></span><span className="text-slate-400">Sell Volume (Down)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500"></span><span className="text-slate-400">Price Trend (MA)</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
