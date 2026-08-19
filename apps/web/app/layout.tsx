import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { AssetSelectionProvider } from '@/hooks/useAssetSelection';
import { PageHeader } from '@/components/layout/PageHeader';
import React from 'react';

export const metadata: Metadata = {
  title: 'Crypto Dashboard',
  description: 'Cryptocurrency real-time analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b1220] text-slate-200 min-h-screen antialiased">
        <Providers>
          <AssetSelectionProvider>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <PageHeader />
              {children}
            </main>
          </AssetSelectionProvider>
        </Providers>
      </body>
    </html>
  );
}
