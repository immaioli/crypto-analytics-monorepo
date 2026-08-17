import { useMemo } from 'react';
import { MultiLineSeriesConfig } from '@/components/charts/LightweightChartWrapper';
import { CompareResponse } from '@dashboard-cripto/shared-types';

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#eab308', '#8b5cf6'];

export function useCompareChartFormatter(data: CompareResponse | undefined, selectedIds: string[]) {
  const multiLineData: MultiLineSeriesConfig[] | undefined = useMemo(() => {
    if (!data || data.coins.length === 0) return undefined;

    return data.coins.map((coinData) => {
      // Find the exact index of this coin in the user's selection array
      // This ensures the color in the chart matches the color of the badge exactly
      const colorIndex = selectedIds.indexOf(coinData.id);
      // Fallback to 0 if not found (though it should always be found)
      const safeColorIndex = colorIndex >= 0 ? colorIndex : 0;

      return {
        id: coinData.id,
        title: coinData.symbol.toUpperCase(),
        color: COLORS[safeColorIndex % COLORS.length] || '#3b82f6',
        data: coinData.series.map(point => ({
          time: (point.timestampMs / 1000) as any,
          value: point.indexedValue, // Base-0 percentage
        }))
      };
    });
  }, [data, selectedIds]);

  return { multiLineData };
}
