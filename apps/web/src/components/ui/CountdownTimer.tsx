'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  intervalMs?: number;
}

export function CountdownTimer({ intervalMs = 60000 }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(intervalMs / 1000);

  useEffect(() => {
    // Reset timer immediately when component mounts
    setTimeLeft(intervalMs / 1000);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return intervalMs / 1000;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
      Updates in 00:{timeLeft.toString().padStart(2, '0')}
    </div>
  );
}