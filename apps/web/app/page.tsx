import React from 'react';
import { TopCoinsList } from '@/components/TopCoinsList';

export default function Page() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Market Overview</h2>
        <TopCoinsList />
      </section>
    </div>
  );
}
