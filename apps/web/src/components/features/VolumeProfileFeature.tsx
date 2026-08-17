'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { LightweightChartWrapper } from '../charts/LightweightChartWrapper';
import { CoinSummary, SupportedPeriod, CoinHistory, API_ROUTES } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { PeriodSelector } from '../ui/PeriodSelector';
import { ChartLoadingView, ChartErrorView } from '../ui/ChartStates';
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
  const [days, setDays] = useState<SupportedPeriod>('7');

  const localCoinId = selectedAssetId || (coins.length > 0 ? coins[0]?.id || "" || "" : '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // We fetch the full history endpoint which includes volumes
  const { data: historyData, isLoading, isError } = useQuery<CoinHistory, Error>({
    queryKey: ['coins', localCoinId, 'history', days],
    queryFn: () => fetcher(`${apiUrl}${API_ROUTES.history(localCoinId, days)}`),
    enabled: !!localCoinId,
    refetchInterval: 60000,
    placeholderData: keepPreviousData,
  });

  const { chartData } = useVolumeChartFormatter(historyData);

  if (!coins || coins.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <SelectedAssetBadge fallbackId={coins.length > 0 ? coins[0]?.id || "" || "" : ""} />
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
        {isError && !chartData && <ChartErrorView message="Failed to load volume data." />}

        {(!isError || chartData) && chartData && (
          <LightweightChartWrapper
            type="histogram"
            data={chartData}
            height={350}
          />
        )}
      </div>
    </div>
  );
}
