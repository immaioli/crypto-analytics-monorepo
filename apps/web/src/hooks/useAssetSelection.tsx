'use client';

import React, { createContext, useContext, useState } from 'react';

interface AssetSelectionContextType {
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string) => void;
  customCoins: string[];
  addCustomCoin: (id: string) => void;
  removeCustomCoin: (id: string) => void;
}

const AssetSelectionContext = createContext<AssetSelectionContextType>({
  selectedAssetId: null,
  setSelectedAssetId: () => {},
  customCoins: [],
  addCustomCoin: () => {},
  removeCustomCoin: () => {},
});

export function AssetSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [customCoins, setCustomCoins] = useState<string[]>([]);

  const addCustomCoin = (id: string) => {
    setCustomCoins(previousCoins => previousCoins.includes(id) ? previousCoins : [...previousCoins, id]);
  };

  const removeCustomCoin = (id: string) => {
    setCustomCoins(previousCoins => previousCoins.filter(coinId => coinId !== id));
    if (selectedAssetId === id) {
      setSelectedAssetId(null);
    }
  };

  return (
    <AssetSelectionContext.Provider value={{
      selectedAssetId, setSelectedAssetId,
      customCoins, addCustomCoin, removeCustomCoin
    }}>
      {children}
    </AssetSelectionContext.Provider>
  );
}

export function useAssetSelection() {
  return useContext(AssetSelectionContext);
}
