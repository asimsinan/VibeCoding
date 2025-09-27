import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionForm from '@/components/forms/TransactionForm';
import { mockApiClientMethods } from '../../../mockApiClient';

// Mock the API client
jest.mock('@/lib/api/apiClient', () => ({
  setupApiClient: jest.fn(() => mockApiClientMethods),
}));

const queryClient = new QueryClient();

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('TransactionForm', () => {
  let mockApiClient: any;

  beforeEach(() => {
    queryClient.clear();
    mockApiClient = mockApiClientMethods;
    mockApiClient.post.mockReset();
    mockApiClient.get.mockReset();
    mockApiClient.setAuthToken.mockReset();
  });

  it('should render the form correctly', () => {
    render(<TransactionForm />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Transaction/i)).toBeInTheDocument();
  });

  it('should handle form submission and create a new transaction', async () => {
    mockApiClient.post.mockResolvedValue({ data: { message: 'Transaction created' } });

    render(<TransactionForm />, { wrapper: Wrapper });

    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Transaction' } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '123.45' } });
    fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'expense' } });

    fireEvent.click(screen.getByText(/Add Transaction/i));

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({
        description: 'New Transaction',
        amount: 123.45,
        type: 'expense',
      }));
      expect(screen.getByText(/Transaction created successfully!/i)).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to create transaction';
    mockApiClient.post.mockRejectedValue({ response: { data: { message: errorMessage } } });

    render(<TransactionForm />, { wrapper: Wrapper });

    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Failing Transaction' } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10.00' } });
    fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'income' } });

    fireEvent.click(screen.getByText(/Add Transaction/i));

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });
});
