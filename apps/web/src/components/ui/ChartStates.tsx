'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export function ChartLoadingView({ height = 350, messageKey = 'loading' }: { height?: number; messageKey?: string }) {
  const t = useTranslations('ChartErrors');
  return (
    <div
      className="flex flex-col justify-center items-center gap-2"
      style={{ height: `${height}px` }}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="text-slate-400 text-sm">{t(messageKey)}</p>
    </div>
  );
}

export function ChartErrorView({ messageKey = 'failed', height = 350 }: { messageKey?: string; height?: number }) {
  const t = useTranslations('ChartErrors');
  return (
    <div
      className="flex justify-center items-center text-rose-500"
      style={{ height: `${height}px` }}
    >
      <p>{t(messageKey)}</p>
    </div>
  );
}
