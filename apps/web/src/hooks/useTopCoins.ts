import { useQuery } from '@tanstack/react-query';
import { API_ROUTES, CoinSummary } from '@dashboard-cripto/shared-types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return response.json();
};

export function useTopCoins() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return useQuery<CoinSummary[], Error>({
    queryKey: ['coins', 'top'],
    queryFn: () => fetcher(`${apiUrl}${API_ROUTES.top}`),
    refetchInterval: 60000, // Refresh every 60 seconds automatically
  });
}
