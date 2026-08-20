import { useMemo } from 'react';
import { MultiLineSeriesConfig } from '@/components/charts/LightweightChartWrapper';
import { CoinHistory } from '@dashboard-cripto/shared-types';

export function useVolumeChartFormatter(historyData: CoinHistory | undefined) {
  const multiLineData: MultiLineSeriesConfig[] | undefined = useMemo(() => {
    if (!historyData || historyData?.prices.length === 0) return undefined;

    const volumeData = historyData.prices.map((point, index) => {
      // Logic for coloring the volume bar: green if price went up, red if price went down
      let color = '#3b82f6'; // Default blue
      if (index > 0 && historyData && historyData.prices && historyData.prices.length > 0) {
        const prevPoint = historyData.prices[index - 1];
        if (prevPoint) {
          const prevPrice = prevPoint.price;
          if (point.price > prevPrice) {
            color = 'rgba(16, 185, 129, 0.7)'; // Emerald 500 with opacity
          } else {
            color = 'rgba(244, 63, 94, 0.7)'; // Rose 500 with opacity
          }
        }
      }

      return {
        time: (point.timestampMs / 1000) as any,
        value: point.volume,
        color,
      };
    });

    const priceData = historyData.prices.map(point => ({
      time: (point.timestampMs / 1000) as any,
      value: point.price,
    }));

    return [
      {
        id: 'volume',
        data: volumeData,
        title: 'Volume',
        type: 'histogram',
        priceScaleId: 'left', // Escala independente no eixo esquerdo (se suportado pelo wrapper) ou principal se sobreposto
      },
      {
        id: 'price',
        data: priceData,
        title: 'Price (MA)',
        type: 'line',
        color: '#3b82f6', // Linha de tendência sobreposta
      }
    ];
  }, [historyData]);

  return { multiLineData };
}
