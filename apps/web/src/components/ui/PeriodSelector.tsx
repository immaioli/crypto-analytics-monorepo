import React from 'react';
import { SupportedPeriod } from '@dashboard-cripto/shared-types';

interface PeriodSelectorProps {
  days: SupportedPeriod;
  onChange: (days: SupportedPeriod) => void;
}

const PERIODS: SupportedPeriod[] = ['1', '7', '30'];

export function PeriodSelector({ days, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 shrink-0">
      {PERIODS.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            days === period
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {period}D
        </button>
      ))}
    </div>
  );
}
