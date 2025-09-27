import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionsList from '@/components/TransactionsList';
import { mockApiClientMethods } from '../../mockApiClient';

// Mock the API client
jest.mock('@/lib/api/apiClient', () => ({
  setupApiClient: jest.fn(() => mockApiClientMethods),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('TransactionsList', () => {
  let mockApiClient: any;

  beforeEach(() => {
    queryClient.clear();
    mockApiClient = mockApiClientMethods;
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
    mockApiClient.setAuthToken.mockReset();
  });

  it('should display loading state initially', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<TransactionsList />, { wrapper: Wrapper });
    expect(screen.getByText(/Loading transactions.../i)).toBeInTheDocument();
  });

  it('should display transactions after successful fetch', async () => {
    const mockTransactions = [
      { id: '1', description: 'Groceries', amount: 50.00, type: 'expense', date: '2025-09-27', categoryId: 'cat1', userId: 'user1' },
      { id: '2', description: 'Salary', amount: 1000.00, type: 'income', date: '2025-09-26', categoryId: 'cat2', userId: 'user1' },
    ];

    mockApiClient.get.mockResolvedValue({ data: mockTransactions });

    render(<TransactionsList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Groceries/i)).toBeInTheDocument();
      expect(screen.getByText(/50/i)).toBeInTheDocument();
      expect(screen.getByText(/Salary/i)).toBeInTheDocument();
      expect(screen.getByText(/1000/i)).toBeInTheDocument();
    });
  });

  it('should display an error message if fetching fails', async () => {
    const errorMessage = 'Failed to fetch transactions';
    mockApiClient.get.mockRejectedValue(new Error(errorMessage));

    render(<TransactionsList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });
});
