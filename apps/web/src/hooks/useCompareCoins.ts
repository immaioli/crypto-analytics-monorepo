import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { API_ROUTES, CompareResponse, SupportedPeriod } from '@dashboard-cripto/shared-types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('An error occurred while fetching compare data.');
  }
  return response.json();
};

export function useCompareCoins(ids: string[], days: SupportedPeriod = '7') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return useQuery<CompareResponse, Error>({
    queryKey: ['coins', 'compare', ids.join(','), days],
    queryFn: () => fetcher(`${apiUrl}${API_ROUTES.compare(ids, days)}`),
    enabled: ids.length > 0, // Only run the query if there are IDs to compare
    refetchInterval: 60000,
    placeholderData: keepPreviousData,
  });
}
