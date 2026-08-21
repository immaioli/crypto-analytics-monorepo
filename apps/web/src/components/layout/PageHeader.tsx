import React from 'react';
import Image from 'next/image';

export function PageHeader() {
  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <a href="https://maioli.dev.br" target="_blank" rel="noopener noreferrer" className="block flex-shrink-0 transition-transform hover:scale-105">
          <div className="w-[72px] h-[72px] relative bg-white rounded-xl p-1.5 shadow-sm">
            <Image
              src="/logoHeader.png"
              alt="maioli.dev Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
        </a>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Crypto Analytics</h1>
          <p className="text-slate-400 mt-2">Real-time market data and custom market overview</p>
        </div>
      </div>
      {/* MVP: Hide the global search input initially
      <AssetSearchInput />
      */}
    </header>
  );
}
