'use client';

import React, { useState } from 'react';
import { useAssetSelection } from '@/hooks/useAssetSelection';
import { Search } from 'lucide-react';
import { useTopCoins } from '@/hooks/useTopCoins';

export function AssetSearchInput() {
  const { setSelectedAssetId, addCustomCoin } = useAssetSelection();
  const { data: topCoins } = useTopCoins();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    setNotFoundError(null);

    if (normalizedQuery) {
      // User explicitly requested to search ONLY by symbol
      if (topCoins && topCoins.length > 0) {
        const existingCoin = topCoins.find(
          coin => coin.symbol.toLowerCase() === normalizedQuery.toLowerCase()
        );

        if (existingCoin) {
          addCustomCoin(existingCoin.id);
          setSelectedAssetId(existingCoin.id);
          setQuery('');
          return;
        }
      }

      // If not found in cache, dynamically resolve the actual ID via CoinGecko Search API
      try {
        setIsSearching(true);
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(normalizedQuery)}`);
        const data = await response.json();

        if (data && data.coins && data.coins.length > 0) {
          // Try to exact match on symbol first, fallback to the first result
          const exactMatch = data.coins.find((coinData: any) =>
            coinData.symbol.toLowerCase() === normalizedQuery.toLowerCase()
          );
          const resolvedId = exactMatch ? exactMatch.id : data.coins[0].id;

          addCustomCoin(resolvedId);
          setSelectedAssetId(resolvedId);
          setQuery('');
        } else {
          setNotFoundError(`Coin "${query}" was not found.`);
        }
      } catch (error) {
        setNotFoundError(`Search failed for "${query}".`);
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <form onSubmit={handleSubmit} className="flex items-center group">
        <div className="relative flex items-stretch w-64 sm:w-80 transition-all focus-within:ring-2 focus-within:ring-blue-500 rounded-lg shadow-sm">
          <input
            type="text"
            placeholder="Search by exact symbol (e.g. BTC, ACH)..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setNotFoundError(null);
            }}
            disabled={isSearching}
            className="w-full bg-slate-900 border border-slate-700 border-r-0 text-white rounded-l-lg py-2 pl-4 pr-3 outline-none placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 border border-blue-600 rounded-r-lg flex items-center justify-center transition-colors"
            aria-label="Search"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search size={18} />
            )}
          </button>
        </div>
      </form>
      {notFoundError && (
        <span className="text-rose-500 text-sm font-medium ml-1">{notFoundError}</span>
      )}
    </div>
  );
}
