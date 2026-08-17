import { useQuery } from '@tanstack/react-query';
import { CoinSummary, API_ROUTES } from '@dashboard-cripto/shared-types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return response.json();
};

export function useCoinSummary(id: string | null) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return useQuery<CoinSummary>({
    queryKey: ['coin', id],
    queryFn: async () => {
      if (!id) throw new Error('No coin ID provided');
      return fetcher(`${apiUrl}${API_ROUTES.coin(id)}`);
    },
    enabled: !!id, // Only fetch if ID is present
    staleTime: 60 * 1000,
  });
}
