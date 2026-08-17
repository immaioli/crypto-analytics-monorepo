'use client';

import React, { createContext, useContext, useState } from 'react';

interface AssetSelectionContextType {
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string) => void;
}

const AssetSelectionContext = createContext<AssetSelectionContextType>({
  selectedAssetId: null,
  setSelectedAssetId: () => {},
});

export function AssetSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  return (
    <AssetSelectionContext.Provider value={{ selectedAssetId, setSelectedAssetId }}>
      {children}
    </AssetSelectionContext.Provider>
  );
}

export function useAssetSelection() {
  return useContext(AssetSelectionContext);
}
