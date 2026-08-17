'use client';

import React, { useState } from 'react';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { Search } from 'lucide-react';

export function AssetSearchInput() {
  const { setSelectedAssetId } = useAssetSelection();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // CoinGecko IDs are typically lowercase and hyphenated (e.g., 'bitcoin', 'shiba-inu')
      setSelectedAssetId(query.trim().toLowerCase().replace(/\s+/g, '-'));
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center group">
      <div className="relative flex items-stretch w-64 sm:w-80 transition-all focus-within:ring-2 focus-within:ring-blue-500 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Search any coin ID (e.g. solana)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 border-r-0 text-white rounded-l-lg py-2 pl-4 pr-3 outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 border border-blue-600 rounded-r-lg flex items-center justify-center transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>
    </form>
  );
}
