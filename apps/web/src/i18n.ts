import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en-US', 'pt-BR', 'es-LA'] as const;
export type AppLocale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // Next-intl v3.22+/v4: the canonical pattern is to await requestLocale
  // and validate against the supported locales before using it.
  const requested = await requestLocale;
  const currentLocale: AppLocale = (requested as AppLocale) || 'en-US';
  if (!locales.includes(currentLocale)) notFound();

  return {
    locale: currentLocale,
    messages: (await import(`./messages/${currentLocale}.json`)).default,
  };
});
