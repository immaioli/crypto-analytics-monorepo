import { useMemo } from 'react';
import { ChartDataType } from '@/components/charts/LightweightChartWrapper';
import { CoinHistory } from '@dashboard-cripto/shared-types';

export function useVolumeChartFormatter(historyData: CoinHistory | undefined) {
  const chartData: ChartDataType | undefined = useMemo(() => {
    if (!historyData || historyData?.prices.length === 0) return undefined;

    return historyData?.prices.map((point, index) => {
      // Logic for coloring the volume bar: green if price went up, red if price went down
      let color = '#3b82f6'; // Default blue
      if (index > 0) {
        const prevPrice = historyData?.prices[index - 1].price;
        if (point.price > prevPrice) {
          color = 'rgba(16, 185, 129, 0.7)'; // Emerald 500 with opacity
        } else {
          color = 'rgba(244, 63, 94, 0.7)'; // Rose 500 with opacity
        }
      }

      return {
        time: (point.timestampMs / 1000) as any,
        value: point.volume,
        color,
      };
    });
  }, [historyData]);

  return { chartData };
}
