"use client";

import React from "react";
import { useTopCoins } from "@/hooks/useTopCoins";
import { useAssetSelection } from "@/hooks/useAssetSelection";
import { CoinCard } from "./ui/CoinCard";
import { useCoinSummary } from "@/hooks/useCoinSummary";

function CustomCoinCard({
  id,
  onRemove,
}: {
  id: string;
  onRemove: (id: string) => void;
}) {
  const { data: coin, isLoading } = useCoinSummary(id);
  const { selectedAssetId, setSelectedAssetId } = useAssetSelection();

  if (isLoading || !coin) {
    return (
      <div className="h-[90px] bg-slate-800 rounded-xl animate-pulse border border-slate-700"></div>
    );
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
  const { selectedAssetId, setSelectedAssetId, customCoins, removeCustomCoin } =
    useAssetSelection();

  if (isLoading) {
    return (
      <div
        data-testid="loading-indicator"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3"
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-[90px] bg-slate-800 rounded-xl animate-pulse border border-slate-700"
          ></div>
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

  // Backend returned 14 coins. Split them up into two sections.
  // First 7 are top volume. Next 7 are top gainers.
  const volumeLeaders = coins.slice(0, 7);
  const topGainers = coins.slice(7, 14);

  // Filter out any custom coins that are already in the array to avoid duplication
  const topCoinIds = coins.map((coin) => coin.id);
  const uniqueCustomCoins = customCoins.filter(
    (id) => !topCoinIds.includes(id),
  );

  return (
    <div className="space-y-6">
      {/* 1. Top Volume Row */}
      <div>
        <h3 className="text-md font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">
          Highest Volume
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {volumeLeaders.map((coin) => {
            const isSelected =
              selectedAssetId === coin.id ||
              (!selectedAssetId && volumeLeaders[0]?.id === coin.id);
            return (
              <CoinCard
                key={`vol-${coin.id}`}
                coin={coin}
                isSelected={isSelected}
                onClick={setSelectedAssetId}
              />
            );
          })}
        </div>
      </div>

      {/* 2. Top Gainers Row */}
      {topGainers.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">
            Top Gainers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {topGainers.map((coin) => {
              const isSelected = selectedAssetId === coin.id;
              return (
                <CoinCard
                  key={`gain-${coin.id}`}
                  coin={coin}
                  isSelected={isSelected}
                  onClick={setSelectedAssetId}
                />
              );
            })}

            {uniqueCustomCoins.map((id) => (
              <CustomCoinCard
                key={`custom-${id}`}
                id={id}
                onRemove={removeCustomCoin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
