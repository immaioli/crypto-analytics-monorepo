'use client';

import Image from 'next/image';
import { createNavigation } from 'next-intl/navigation';
import { locales } from '@/i18n';

const { useRouter, usePathname } = createNavigation({
  locales,
  localePrefix: 'always',
});

const LOCALES = [
  { code: 'pt-BR', flagUrl: 'https://flagcdn.com/w40/br.png', alt: 'Português' },
  { code: 'en-US', flagUrl: 'https://flagcdn.com/w40/us.png', alt: 'English' },
  { code: 'es-LA', flagUrl: 'https://flagcdn.com/w40/es.png', alt: 'Español' },
];

function getNewPath(pathname: string | null, newLocale: string) {
  if (!pathname) return `/${newLocale}`;
  const segments = pathname.split('/');
  segments[1] = newLocale;
  return segments.join('/');
}

function LanguageFlag({ code, flagUrl, alt, isActive, onClick }: {
  code: string;
  flagUrl: string;
  alt: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
        type="button"
        onClick={onClick}
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 w-9 h-6 sm:w-10 sm:h-[26px] ${
          isActive
            ? 'rounded-md border-[3px] border-[var(--theme-secondary)] shadow-[0_0_15px_var(--theme-primary-glow)] scale-110'
            : 'rounded-sm opacity-60 hover:opacity-100 hover:scale-105 drop-shadow-md border-[3px] border-transparent'
        }`}
        title={alt}
      >
        <Image
          src={flagUrl}
          alt={alt}
          fill
          sizes="(max-width: 640px) 36px, 40px"
          className="object-cover"
          unoptimized
        />
    </button>
  );
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex gap-4 items-center h-full">
      {LOCALES.map((locale) => (
        <LanguageFlag
          key={locale.code}
          {...locale}
          isActive={pathname?.startsWith(`/${locale.code}`) ?? false}
          onClick={() => {
            if (pathname?.startsWith(`/${locale.code}`)) return;
            router.replace(pathname, { locale: locale.code });
          }}
        />
      ))}
    </div>
  );
}
