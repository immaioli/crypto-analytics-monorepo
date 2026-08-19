'use client';

import React from 'react';
import { useTopCoins } from '@/hooks/useTopCoins';
import { Tabs, Tab } from '@/components/Tabs';
import { TopCoinsList } from '@/components/TopCoinsList';
import { OhlcChartFeature } from '@/components/features/OhlcChartFeature';
import { CompareChartFeature } from '@/components/features/CompareChartFeature';
import { VolumeProfileFeature } from '@/components/features/VolumeProfileFeature';
import { RadarAnalysisFeature } from '@/components/features/RadarAnalysisFeature';
import { DeepDiveStatsFeature } from '@/components/features/DeepDiveStatsFeature';

export default function Page() {
  const { data: topCoins } = useTopCoins();

  const chartTabs: Tab[] = [
    {
      id: 'tab-ohlc',
      label: 'Price Action (OHLC)',
      content: topCoins ? <OhlcChartFeature coins={topCoins} /> : <div className="animate-pulse h-[400px] bg-slate-800 rounded-lg border border-slate-700"></div>,
    },
    {
      id: 'tab-compare',
      label: 'Performance Compare',
      content: topCoins ? <CompareChartFeature coins={topCoins} /> : <div className="animate-pulse h-[400px] bg-slate-800 rounded-lg border border-slate-700"></div>,
    },
    {
      id: 'tab-volume',
      label: 'Volume Profile',
      content: topCoins ? <VolumeProfileFeature coins={topCoins} /> : <div className="animate-pulse h-[400px] bg-slate-800 rounded-lg border border-slate-700"></div>,
    },
    {
      id: 'tab-radar',
      label: 'Radar Analysis',
      content: topCoins ? <RadarAnalysisFeature coins={topCoins} /> : <div className="animate-pulse h-[400px] bg-slate-800 rounded-lg border border-slate-700"></div>,
    },
    {
      id: 'tab-stats',
      label: 'Deep Dive Stats',
      content: topCoins ? <DeepDiveStatsFeature coins={topCoins} /> : <div className="animate-pulse h-[400px] bg-slate-800 rounded-lg border border-slate-700"></div>,
    }
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Market Overview</h2>
        <TopCoinsList />
      </section>

      <section className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50 shadow-xl shadow-black/20">
        <h2 className="text-xl font-semibold text-white mb-6">Advanced Analytics</h2>
        <Tabs tabs={chartTabs} />
      </section>
    </div>
  );
}
