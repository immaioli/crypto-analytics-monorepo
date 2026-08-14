'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time } from 'lightweight-charts';

// Data types expected by the wrapper
export type ChartDataType =
  | { time: Time; value: number }[]                     // Line, Area
  | { time: Time; open: number; high: number; low: number; close: number }[] // Candle
  | { time: Time; value: number; color?: string }[];    // Histogram (Volume)

export interface LightweightChartWrapperProps {
  type: 'area' | 'candlestick' | 'histogram' | 'line';
  data: ChartDataType;
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

export function LightweightChartWrapper({ type, data, colors, height = 400 }: LightweightChartWrapperProps) {
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
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
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
    }
    seriesRef.current = series;

    // 3. Set Data
    series.setData(data as any);
    chart.timeScale().fitContent();

    // 4. Handle Window Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.resize(chartContainerRef.current.clientWidth, height);
      }
    };
    window.addEventListener('resize', handleResize);

    // 5. Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [type, data, height]); // Re-initialize if type, data reference, or height changes

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: `${height}px` }}
      data-testid={`lw-chart-${type}`}
      className="rounded-lg overflow-hidden border border-slate-800"
    />
  );
}
