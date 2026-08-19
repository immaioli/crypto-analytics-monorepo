'use client';

import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { CoinSummary } from '@dashboard-cripto/shared-types';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { SelectedAssetBadge } from '../ui/SelectedAssetBadge';

interface RadarAnalysisFeatureProps {
  coins: CoinSummary[];
}

export function RadarAnalysisFeature({ coins }: RadarAnalysisFeatureProps) {
  const { selectedAssetId } = useAssetSelection();
  const localCoinId = selectedAssetId || (coins.length > 0 ? coins[0]?.id || "" || "" : '');

  const selectedCoin = coins.find(c => c.id === localCoinId);

  // If we search a coin not in Top 5, radar might not render perfectly if it relies strictly on coins array
  // For Radar we will render the badge, but we will keep the calculation robust.
  const name = selectedCoin?.name || 'Asset';
  const marketCap = selectedCoin?.marketCap || 1;
  const totalVolume = selectedCoin?.totalVolume || 1;
  const priceChange = selectedCoin?.priceChangePercentage24h || 0;
  const rank = selectedCoin?.marketCapRank || 100;

  if (!coins || coins.length === 0) return null;

  // In a real analysis (Staff level), you would normalize this data
  // against the market average to create an index (0 to 100) for each radar axis.
  // Here we are creating a simulated normalization based on the Top 5 themselves
  // to demonstrate the visual architecture of fund analysis.

  // If the data comes from Binance, Market Cap is 0 by default. We will normalize based on Price and Volume
  const maxPrice = Math.max(...coins.map(c => c.currentPrice), selectedCoin?.currentPrice || 1);
  const maxVolume = Math.max(...coins.map(c => c.totalVolume), totalVolume);

  const absPriceChanges = coins.map(c => Math.abs(c.priceChangePercentage24h));
  const maxVolatility = Math.max(...absPriceChanges, Math.abs(priceChange)) || 1;

  const data = [
    {
      subject: 'Value (Price Index)',
      A: ((selectedCoin?.currentPrice || 1) / maxPrice) * 100,
      fullMark: 100,
    },
    {
      subject: 'Liquidity (Volume)',
      A: (totalVolume / maxVolume) * 100,
      fullMark: 100,
    },
    {
      subject: 'Momentum (Direction)',
      A: (priceChange > 0 ? 80 : 20), // Simplification for directional momentum
      fullMark: 100,
    },
    {
      subject: 'Volatility (Risk)',
      A: (Math.abs(priceChange) / maxVolatility) * 100,
      fullMark: 100,
    },
    {
      subject: 'Stability Profile',
      // Less volatility = more stability
      A: 100 - ((Math.abs(priceChange) / maxVolatility) * 100),
      fullMark: 100,
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SelectedAssetBadge fallbackId={coins.length > 0 ? coins[0]?.id || "" || "" : ""} />
        <div className="text-sm text-slate-400">
          Fundamental Analysis vs Top Market Average
        </div>
      </div>

      <div className="bg-[#0b1220] rounded-lg border border-slate-800 p-4 h-[400px] flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name={selectedCoin?.name}
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.4}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#3b82f6' }}
              formatter={(value: number) => [`${value.toFixed(1)} / 100`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
