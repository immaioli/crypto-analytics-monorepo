import { useMemo } from 'react';
import { ChartDataType, ChartPriceLine } from '@/components/charts/LightweightChartWrapper';
import { OhlcCandle } from '@dashboard-cripto/shared-types';

export function useOhlcChartFormatter(ohlcData: OhlcCandle[] | undefined) {
  // 1. Formatting for Lightweight Charts
  const chartData: ChartDataType | undefined = useMemo(() => {
    if (!ohlcData) return undefined;
    return ohlcData.map(candle => ({
      time: (candle[0] / 1000) as any, // LightweightCharts expects UNIX timestamps in seconds
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
    }));
  }, [ohlcData]);

  // 2. Calculate Min, Max and Central prices for the lines
  const priceLines = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    let maxHigh = -Infinity;
    let minHigh = Infinity;
    let maxLow = -Infinity;
    let minLow = Infinity;

    // We know it's candlestick data which has high and low properties
    chartData.forEach((candle: any) => {
      // For MAX logic (using candle high)
      if (candle.high > maxHigh) maxHigh = candle.high;
      if (candle.high < minHigh) minHigh = candle.high;

      // For MIN logic (using candle low)
      if (candle.low > maxLow) maxLow = candle.low;
      if (candle.low < minLow) minLow = candle.low;
    });

    const centralPrice = (maxHigh + minLow) / 2;

    const lines: ChartPriceLine[] = [
      {
        price: maxHigh,
        color: '#10b981', // Emerald 500 (Green for Highest High)
        lineWidth: 2,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: 'Max ▲  ',
      },
      {
        price: minHigh,
        color: '#34d399', // Emerald 400 (Lighter green for Lowest High)
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Max ▼  ',
      },
      {
        price: centralPrice,
        color: '#3b82f6', // Blue 500 (Central line)
        lineWidth: 3,     // Thicker line
        lineStyle: 2,     // Dashed line (2) or Dotted (1) - requested pontilhada
        axisLabelVisible: true,
        title: 'Center ',
      },
      {
        price: maxLow,
        color: '#fb7185', // Rose 400 (Lighter red for Highest Low)
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Min ▲  ',
      },
      {
        price: minLow,
        color: '#f43f5e', // Rose 500 (Red for Lowest Low)
        lineWidth: 2,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: 'Min ▼  ',
      }
    ];

    return lines;
  }, [chartData]);

  return { chartData, priceLines };
}
