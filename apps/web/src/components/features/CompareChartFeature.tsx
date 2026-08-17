'use client';

import React, { useState } from 'react';
import { useCompareCoins } from '@/hooks/useCompareCoins';
import { useCompareChartFormatter } from '@/hooks/useCompareChartFormatter';
import { LightweightChartWrapper } from '../charts/LightweightChartWrapper';
import { CoinSummary, SupportedPeriod } from '@dashboard-cripto/shared-types';
import { PeriodSelector } from '../ui/PeriodSelector';
import { ChartLoadingView, ChartErrorView } from '../ui/ChartStates';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { SelectedAssetBadge } from '../ui/SelectedAssetBadge';

interface CompareChartFeatureProps {
  coins: CoinSummary[];
}

// Colors for the comparison lines
const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#eab308', '#8b5cf6'];

export function CompareChartFeature({ coins }: CompareChartFeatureProps) {
  // Default to comparing the top 2 coins (usually BTC and ETH)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    coins.slice(0, 2).map(c => c.id)
  );
  const [days, setDays] = useState<SupportedPeriod>('7');

  const { data, isLoading, isError } = useCompareCoins(selectedIds, days);

  // Hook isolado lidando com a formatação e extração do Base-0 index para Multi-linhas
  const { multiLineData } = useCompareChartFormatter(data, selectedIds);

  // Listen to the global Asset Selection to add a coin to the comparison chart dynamically
  const { selectedAssetId } = useAssetSelection();
  React.useEffect(() => {
    if (selectedAssetId && !selectedIds.includes(selectedAssetId)) {
      setSelectedIds(prev => {
        if (prev.length >= 5) return [...prev.slice(1), selectedAssetId]; // Rotate out the oldest if we hit 5
        return [...prev, selectedAssetId];
      });
    }
  }, [selectedAssetId]);

  const toggleCoin = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(c => c !== id);
      }
      if (prev.length >= 5) return prev; // Max 5 to avoid visual clutter
      return [...prev, id];
    });
  };

  if (!coins || coins.length === 0) return null;

  // Derive the list of coins to show as buttons.
  // It should be the top 8, plus any selected coins that aren't in the top 8.
  const top8Coins = coins.slice(0, 8);
  const displayCoins = [...top8Coins];

  // Add selected coins that are not in the top 8 (like from search)
  // We need to fetch their summary data or use a fallback.
  selectedIds.forEach(id => {
    if (!displayCoins.find(c => c.id === id)) {
      const foundInAll = coins.find(c => c.id === id);
      if (foundInAll) {
        displayCoins.push(foundInAll);
      } else {
        // Fallback for searched coins not in the initial `coins` list
        // We'll extract info from `data` if available
        const fromData = data?.coins.find(c => c.id === id);
        if (fromData) {
          displayCoins.push({
            id: fromData.id,
            name: fromData.name,
            symbol: fromData.symbol,
            image: '', // We don't have the image in CompareResponse currently
            currentPrice: 0, marketCap: 0, marketCapRank: 0, totalVolume: 0, priceChangePercentage24h: 0
          });
        }
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {displayCoins.map((coin) => {
            const isSelected = selectedIds.includes(coin.id);
            const colorIndex = selectedIds.indexOf(coin.id);
            const badgeColor = isSelected ? COLORS[colorIndex % COLORS.length] : 'transparent';

            return (
              <button
                key={coin.id}
                onClick={() => toggleCoin(coin.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all border
                  ${isSelected
                    ? 'bg-[#0b1220]'
                    : 'bg-[#0b1220] border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                  }
                `}
                style={{
                  borderColor: isSelected ? badgeColor : undefined,
                  boxShadow: isSelected ? `0 0 0 1px ${badgeColor}33` : undefined
                }}
              >
                {coin.image ? (
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className={`w-4 h-4 rounded-full ${!isSelected && 'opacity-50 grayscale'}`}
                  />
                ) : (
                  <div className={`w-4 h-4 rounded-full bg-slate-700 ${!isSelected && 'opacity-50'}`}></div>
                )}
                <span className={`font-medium ${isSelected ? 'text-white' : ''}`}>
                  {coin.name}
                </span>
                <span className={`font-semibold uppercase ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                  {coin.symbol}
                </span>
              </button>
            );
          })}
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
        {isError && !multiLineData && <ChartErrorView message="Failed to load comparison data." />}

        {(!isError || multiLineData) && multiLineData && multiLineData.length > 0 && (
          <>
            <div className="mb-2 text-sm text-slate-400">
              Showing performance index (Base-0%) comparison.
            </div>
            <LightweightChartWrapper
              type="multi-line"
              multiLineData={multiLineData}
              height={320}
            />
          </>
        )}
      </div>
    </div>
  );
}
