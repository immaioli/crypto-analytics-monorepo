import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import React from 'react';

export const metadata: Metadata = {
  title: 'Crypto Dashboard',
  description: 'Top 10 cryptocurrency real-time analytics',
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
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Crypto Analytics</h1>
              <p className="text-slate-400 mt-2">Real-time market data for the top 10 cryptocurrencies</p>
            </header>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
