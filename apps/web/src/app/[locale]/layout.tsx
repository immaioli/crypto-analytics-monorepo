import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { AssetSelectionProvider } from '@/hooks/useAssetSelection';
import { PageHeader } from '@/components/layout/PageHeader';
import { Footer } from '@/components/layout/Footer';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type AppLocale } from '@/i18n';

export const metadata: Metadata = {
  title: 'Crypto Dashboard',
  description: 'Cryptocurrency real-time analytics',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    notFound();
  }

  // Required by next-intl v3+ when using `useTranslations` inside Server Components.
  // Without this, the translator stays frozen on the first locale that rendered.
  setRequestLocale(locale);

  // Load messages directly for the request locale. Using `getMessages()` here
  // can return the wrong locale's messages when the page is statically
  // pre-rendered, so we import the JSON file matching the URL segment.
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="dark">
      <body className="bg-[#0b1220] text-slate-200 min-h-screen antialiased flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
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
