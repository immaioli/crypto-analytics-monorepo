'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../LanguageSwitcher';

export function PageHeader() {
  const t = useTranslations('Header');

  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <a
          href="https://maioli.dev.br"
          target="_blank"
          rel="noopener noreferrer"
          className="block flex-shrink-0 transition-transform hover:scale-105"
        >
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
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('title')}</h1>
          <p className="text-slate-400 mt-2">{t('subtitle')}</p>
        </div>
      </div>

      <LanguageSwitcher />
    </header>
  );
}
