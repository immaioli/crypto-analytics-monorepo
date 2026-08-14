import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// We'll create this component in Phase 2
import { TopCoinsList } from '../src/components/TopCoinsList';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry failing requests in tests
    },
  },
});

describe('TopCoinsList', () => {
  it('renders loading state initially', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TopCoinsList />
      </QueryClientProvider>
    );

    // It should render a skeleton or text indicating loading
    expect(screen.getByTestId('loading-indicator')).toBeDefined();
  });
});
