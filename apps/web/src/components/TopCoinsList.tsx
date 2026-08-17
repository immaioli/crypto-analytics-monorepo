'use client';

import React from 'react';
import { useTopCoins } from '@/hooks/useTopCoins';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { CoinCard } from './ui/CoinCard';

export function TopCoinsList() {
  const { data: coins, isLoading, isError, error } = useTopCoins();
  const { selectedAssetId, setSelectedAssetId } = useAssetSelection();

  if (isLoading) {
    return (
      <div data-testid="loading-indicator" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse border border-slate-700"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
        Error loading coins: {error.message}
      </div>
    );
  }

  if (!coins?.length) {
    return <div className="text-slate-400">No coins found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {coins.map((coin) => {
        const isSelected = selectedAssetId === coin.id || (!selectedAssetId && coins[0].id === coin.id);

        return (
          <CoinCard
            key={coin.id}
            coin={coin}
            isSelected={isSelected}
            onClick={setSelectedAssetId}
          />
        );
      })}
    </div>
  );
}
