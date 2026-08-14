'use client';

import React from 'react';
import { useTopCoins } from '@/hooks/useTopCoins';
import { Tabs, Tab } from '@/components/Tabs';
import { MarketDominanceDonut } from '@/components/charts/MarketDominanceDonut';
import { TopCoinsList } from '@/components/TopCoinsList';

export default function Page() {
  const { data: topCoins } = useTopCoins();

  const mockLineData = [
    { time: '2026-08-01' as any, value: 50000 },
    { time: '2026-08-02' as any, value: 51200 },
    { time: '2026-08-03' as any, value: 50800 },
    { time: '2026-08-04' as any, value: 52000 },
  ];

  const chartTabs: Tab[] = [
    {
      id: 'dominance',
      label: 'Dominance (Donut)',
      content: topCoins ? <MarketDominanceDonut coins={topCoins} /> : <div className="animate-pulse h-[400px] bg-slate-800 rounded-lg border border-slate-700"></div>,
    },
    {
      id: 'placeholder-ohlc',
      label: 'OHLC / Candles',
      content: <div className="h-[400px] flex items-center justify-center border border-slate-800 rounded-lg text-slate-500 bg-slate-900/50">Candle chart fetching logic lands in Phase 5</div>,
    },
    {
      id: 'placeholder-compare',
      label: 'Indexed Comparison',
      content: <div className="h-[400px] flex items-center justify-center border border-slate-800 rounded-lg text-slate-500 bg-slate-900/50">Base-0 indexed comparison fetching logic lands in Phase 5</div>,
    }
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Market Overview</h2>
        <TopCoinsList />
      </section>

      <section className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50">
        <h2 className="text-xl font-semibold text-white mb-6">Advanced Analytics</h2>
        <Tabs tabs={chartTabs} />
      </section>
    </div>
  );
}
