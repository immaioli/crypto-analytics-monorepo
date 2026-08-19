import React from 'react';
// import { AssetSearchInput } from '../ui/AssetSearchInput';

export function PageHeader() {
  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Crypto Analytics</h1>
        <p className="text-slate-400 mt-2">Real-time market data and custom market overview</p>
      </div>
      {/* MVP: Hide the global search input initially
      <AssetSearchInput />
      */}
    </header>
  );
}
