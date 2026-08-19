'use client';

import React from 'react';
import { useTopCoins } from '@/hooks/useTopCoins';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { CoinCard } from './ui/CoinCard';
import { useCoinSummary } from '@/hooks/useCoinSummary';

function CustomCoinCard({ id, onRemove }: { id: string, onRemove: (id: string) => void }) {
  const { data: coin, isLoading } = useCoinSummary(id);
  const { selectedAssetId, setSelectedAssetId } = useAssetSelection();

  if (isLoading || !coin) {
    return <div className="h-[90px] bg-slate-800 rounded-xl animate-pulse border border-slate-700"></div>;
  }

  return (
    <CoinCard
      coin={coin}
      isSelected={selectedAssetId === coin.id}
      onClick={setSelectedAssetId}
      onRemove={onRemove}
    />
  );
}

export function TopCoinsList() {
  const { data: coins, isLoading, isError, error } = useTopCoins();
  const { selectedAssetId, setSelectedAssetId, customCoins, removeCustomCoin } = useAssetSelection();

  if (isLoading) {
    return (
      <div data-testid="loading-indicator" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-[90px] bg-slate-800 rounded-xl animate-pulse border border-slate-700"></div>
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

  // Filter out any custom coins that are already in the Top 5 to avoid duplication
  const topCoinIds = coins.map(coin => coin.id);
  const uniqueCustomCoins = customCoins.filter(id => !topCoinIds.includes(id));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
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

      {uniqueCustomCoins.map(id => (
        <CustomCoinCard key={id} id={id} onRemove={removeCustomCoin} />
      ))}
    </div>
  );
}
