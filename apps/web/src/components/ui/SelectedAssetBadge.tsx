'use client';

import React from 'react';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { useCoinSummary } from '@/hooks/useCoinSummary';

interface SelectedAssetBadgeProps {
  fallbackId?: string; // ID to use if no asset is selected globally
}

export function SelectedAssetBadge({ fallbackId }: SelectedAssetBadgeProps) {
  const { selectedAssetId } = useAssetSelection();
  const activeId = selectedAssetId || fallbackId;

  const { data: coin, isLoading, isError } = useCoinSummary(activeId || null);

  if (!activeId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-[#0b1220] border border-slate-700 rounded-lg px-3 py-1.5 min-w-[140px] animate-pulse">
        <div className="w-6 h-6 rounded-full bg-slate-700"></div>
        <div className="h-4 bg-slate-700 rounded w-16"></div>
      </div>
    );
  }

  if (isError || !coin) {
    return (
      <div className="flex items-center gap-2 bg-[#0b1220] border border-red-900/50 rounded-lg px-3 py-1.5">
        <span className="text-sm text-red-400">Error loading asset</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[#0b1220] border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm hover:border-slate-500 transition-colors">
      <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full bg-slate-800" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-white">{coin.name}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase">{coin.symbol}</span>
      </div>
    </div>
  );
}
