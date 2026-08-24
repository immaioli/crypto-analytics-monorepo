import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone is only needed for Docker/Oracle. Vercel builds natively.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  transpilePackages: ["@dashboard-cripto/shared-types"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);