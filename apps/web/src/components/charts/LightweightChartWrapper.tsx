'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time } from 'lightweight-charts';

// Data types expected by the wrapper
export type ChartDataType =
  | { time: Time; value: number }[]                     // Line, Area
  | { time: Time; open: number; high: number; low: number; close: number }[] // Candle
  | { time: Time; value: number; color?: string }[];    // Histogram (Volume)

// Price lines optional configuration
export interface ChartPriceLine {
  price: number;
  color: string;
  lineWidth: 1 | 2 | 3 | 4;
  lineStyle: number; // 0=Solid, 1=Dotted, 2=Dashed
  axisLabelVisible: boolean;
  title: string;
  axisLabelPosition?: 'right' | 'left';
}

export interface MultiLineSeriesConfig {
  id: string;
  data: { time: Time; value: number; color?: string }[];
  color?: string;
  title: string;
  type?: 'line' | 'histogram';
  priceScaleId?: string;
}

export interface LightweightChartWrapperProps {
  type: 'area' | 'candlestick' | 'histogram' | 'line' | 'multi-line';
  data?: ChartDataType; // Optional for multi-line
  multiLineData?: MultiLineSeriesConfig[]; // Used only for 'multi-line' type
  liveUpdate?: any; // New tick data to update the chart in real-time
  priceLines?: ChartPriceLine[];
  seriesConfig?: {
    lastValueVisible?: boolean;
    title?: string;
    priceLineColor?: string;
    priceLineWidth?: 1 | 2 | 3 | 4;
    priceLineStyle?: number; // 0=Solid, 1=Dotted, 2=Dashed
  };
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    lineColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    upColor?: string;
    downColor?: string;
  };
  height?: number;
}

export function LightweightChartWrapper({ type, data, multiLineData, liveUpdate, priceLines, seriesConfig, colors, height = 400 }: LightweightChartWrapperProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  // Default theme matching our Tailwind dark mode base (bg-[#0b1220])
  const defaultTheme = {
    backgroundColor: '#0b1220',
    textColor: '#9bb0d3',
    lineColor: '#3b82f6', // blue-500
    areaTopColor: 'rgba(59, 130, 246, 0.4)',
    areaBottomColor: 'rgba(59, 130, 246, 0.0)',
    upColor: '#10b981', // emerald-500
    downColor: '#f43f5e', // rose-500
    ...colors,
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const containerWidth = chartContainerRef.current.clientWidth;
    // We need a fixed physical space in pixels for the legends (approx 80px),
    // no matter how many candles exist. Lightweight Charts uses 'rightOffset' in "number of bars".
    // So we dynamically calculate how many bars equal 80px at the current zoom.
    const labelSpacePx = 80;

    // For multi-line, data length is based on the first series
    let dataLen = 0;
    if (type === 'multi-line' && multiLineData && multiLineData.length > 0 && multiLineData[0] && multiLineData[0].data) {
      dataLen = multiLineData[0].data.length;
    } else if (data && Array.isArray(data)) {
      dataLen = data.length;
    }

    const dynamicRightOffset = dataLen > 0
      ? (labelSpacePx * dataLen) / Math.max(1, containerWidth - labelSpacePx)
      : 5;

    // 1. Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: defaultTheme.backgroundColor },
        textColor: defaultTheme.textColor,
      },
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.4)' }, // slate-700 w/ opacity
        horzLines: { color: 'rgba(51, 65, 85, 0.4)' },
      },
      localization: {
        priceFormatter: (price: number) => {
          return price.toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 6
          });
        }
      },
      width: containerWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: dynamicRightOffset,
      },
    });
    chartRef.current = chart;

    // 2. Add appropriate Series based on 'type'
    let series;
    switch (type) {
      case 'area':
        series = chart.addAreaSeries({
          lineColor: defaultTheme.lineColor,
          topColor: defaultTheme.areaTopColor,
          bottomColor: defaultTheme.areaBottomColor,
        });
        break;
      case 'candlestick':
        series = chart.addCandlestickSeries({
          upColor: defaultTheme.upColor,
          downColor: defaultTheme.downColor,
          borderVisible: false,
          wickUpColor: defaultTheme.upColor,
          wickDownColor: defaultTheme.downColor,
          lastValueVisible: seriesConfig?.lastValueVisible ?? true,
          title: seriesConfig?.title ?? '',
          ...(seriesConfig?.priceLineColor ? { priceLineColor: seriesConfig.priceLineColor } : {}),
          priceLineWidth: seriesConfig?.priceLineWidth ?? 1,
          priceLineStyle: seriesConfig?.priceLineStyle ?? 1,
        });
        break;
      case 'histogram':
        series = chart.addHistogramSeries({
          color: defaultTheme.lineColor,
        });
        break;
      case 'line':
        series = chart.addLineSeries({
          color: defaultTheme.lineColor,
        });
        break;
      case 'multi-line':
        // For multi-line, we don't create a single series here. We loop through multiLineData below.
        break;
    }

    if (type !== 'multi-line' && series) {
      seriesRef.current = series;
      // 3. Set Data
      if (data) {
        series.setData(data as any);
      }
    }

    if (type === 'multi-line' && multiLineData) {
      // Independent Y-axes so volume bars don't flatten the price/MA line
      chart.priceScale('left').applyOptions({
        visible: true,
        borderColor: 'rgba(51, 65, 85, 0.4)',
      });
      chart.priceScale('right').applyOptions({
        visible: true,
        borderColor: 'rgba(51, 65, 85, 0.4)',
      });

      multiLineData.forEach(lineConfig => {
        if (lineConfig.type === 'histogram') {
          const histSeries = chart.addHistogramSeries({
            color: lineConfig.color || defaultTheme.lineColor,
            priceScaleId: lineConfig.priceScaleId || 'left',
            title: lineConfig.title,
          });
          histSeries.setData(lineConfig.data as any);
        } else {
          const lineSeries = chart.addLineSeries({
            color: lineConfig.color || defaultTheme.lineColor,
            lineWidth: 2,
            priceScaleId: lineConfig.priceScaleId || 'right',
            title: lineConfig.title,
          });
          lineSeries.setData(lineConfig.data as any);
        }
      });
    }

    // 3.5. Add Price Lines if requested (only makes sense for single series currently)
    if (type !== 'multi-line' && series && priceLines && priceLines.length > 0) {
      priceLines.forEach(lineConfig => {
        series.createPriceLine({
          price: lineConfig.price,
          color: lineConfig.color,
          lineWidth: lineConfig.lineWidth,
          lineStyle: lineConfig.lineStyle,
          axisLabelVisible: lineConfig.axisLabelVisible,
          title: lineConfig.title,
          // Support for rendering title on the right (actually controlled via layout if native, or pseudo hack)
          // But lightweight charts doesn't have a direct 'left/right' for price line titles, they are always left.
        });
      });
    }

    chart.timeScale().fitContent();

    // 4. Handle Element Resize
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (!chartContainerRef.current) return;

      for (const entry of entries) {
        const { width, height: entryHeight } = entry.contentRect;
        // Only resize if we have meaningful dimensions
        if (width > 0 && height > 0) {
          chart.resize(width, height);
          chart.timeScale().fitContent();
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // 5. Cleanup on Unmount
    return () => {
      if (chartContainerRef.current) {
        resizeObserver.unobserve(chartContainerRef.current);
      }
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [type, data, multiLineData, priceLines, height]); // Re-initialize if type, data reference, or height changes

  // 6. Handle Live Updates efficiently without re-rendering the whole chart
  useEffect(() => {
    if (liveUpdate && seriesRef.current) {
      seriesRef.current.update(liveUpdate as any);
    }
  }, [liveUpdate]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: `${height}px` }}
      data-testid={`lw-chart-${type}`}
      className="rounded-lg overflow-hidden border border-slate-800"
    />
  );
}
