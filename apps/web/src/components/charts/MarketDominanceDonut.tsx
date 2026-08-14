'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CoinSummary } from '@dashboard-cripto/shared-types';

interface MarketDominanceDonutProps {
  coins: CoinSummary[];
}

export function MarketDominanceDonut({ coins }: MarketDominanceDonutProps) {
  if (!coins || coins.length === 0) return null;

  // We map the top 10 coins. To keep the pie chart readable,
  // if you passed more than 5-6, it still renders fine.
  const data = coins.map(c => ({
    name: c.symbol.toUpperCase(),
    value: c.marketCap,
  }));

  // A standard pleasing color palette matching the dark theme
  const COLORS = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // yellow-green
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#06b6d4', // cyan-500
  ];

  return (
    <div className="h-[400px] w-full bg-[#0b1220] border border-slate-800 rounded-lg p-4">
      <h3 className="text-slate-200 font-semibold mb-4 text-center">Market Dominance (Top 10)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80} // Creates the Donut effect
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${(value / 1e9).toFixed(2)}B`}
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend wrapperStyle={{ color: '#9bb0d3' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
