import React from 'react';

export function ChartLoadingView({ height = 350 }: { height?: number }) {
  return (
    <div
      className="flex justify-center items-center"
      style={{ height: `${height}px` }}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

export function ChartErrorView({ message, height = 350 }: { message: string, height?: number }) {
  return (
    <div
      className="flex justify-center items-center text-rose-500"
      style={{ height: `${height}px` }}
    >
      <p>{message}</p>
    </div>
  );
}
