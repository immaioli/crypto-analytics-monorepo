import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { AssetSelectionProvider } from '@/hooks/useAssetSelection';
import { PageHeader } from '@/components/layout/PageHeader';
import { Footer } from '@/components/layout/Footer';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Crypto Dashboard',
  description: 'Cryptocurrency real-time analytics',
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  if (locale !== 'en' && locale !== 'pt') {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className="bg-[#0b1220] text-slate-200 min-h-screen antialiased flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AssetSelectionProvider>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
                <PageHeader />
                {children}
                <Footer />
              </main>
            </AssetSelectionProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
