import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// We'll create this component in the next step
import { LightweightChartWrapper } from '../../src/components/charts/LightweightChartWrapper';

// Mocking lightweight-charts to avoid Canvas issues in jsdom environment
vi.mock('lightweight-charts', () => {
  const mockSeries = {
    setData: vi.fn(),
    update: vi.fn(),
  };

  const mockChart = {
    addAreaSeries: vi.fn(() => mockSeries),
    addCandlestickSeries: vi.fn(() => mockSeries),
    addLineSeries: vi.fn(() => mockSeries),
    addHistogramSeries: vi.fn(() => mockSeries),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
    })),
    resize: vi.fn(),
    remove: vi.fn(),
  };

  return {
    createChart: vi.fn(() => mockChart),
    ColorType: { Solid: 'Solid' },
    CrosshairMode: { Normal: 0, Magnet: 1 },
  };
});

describe('LightweightChartWrapper', () => {
  it('renders without crashing and instantiates the chart container', () => {
    const { container } = render(
      <LightweightChartWrapper
        type="area"
        data={[{ time: 1000, value: 50 }, { time: 2000, value: 60 }]}
      />
    );

    // Check if the div that holds the chart exists
    const chartDiv = container.querySelector('div');
    expect(chartDiv).toBeDefined();
    expect(chartDiv?.getAttribute('style')).toContain('width: 100%');
  });
});
