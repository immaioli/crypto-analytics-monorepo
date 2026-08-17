import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { API_ROUTES, OhlcCandle, SupportedPeriod } from '@dashboard-cripto/shared-types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('An error occurred while fetching the OHLC data.');
  }
  return response.json();
};

export function useOhlc(id: string | null, days: SupportedPeriod = '7') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return useQuery<OhlcCandle[], Error>({
    queryKey: ['coins', id, 'ohlc', days],
    queryFn: () => fetcher(`${apiUrl}${API_ROUTES.ohlc(id!, days)}`),
    enabled: !!id, // Only run the query if an ID is provided
    refetchInterval: 60000,
    placeholderData: keepPreviousData,
  });
}
