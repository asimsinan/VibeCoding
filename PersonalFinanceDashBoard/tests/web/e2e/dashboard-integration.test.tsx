
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient, mockApiClientMethods } from '../mockApiClient'; // Import from centralized mock file
import TransactionsList from '@/components/TransactionsList';
import TransactionForm from '@/components/forms/TransactionForm';

// Mock the API client (now uses the exported setupApiClient)
jest.mock('@/lib/api/apiClient', () => ({
  setupApiClient: setupApiClient,
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

// Mock Dashboard Component for testing
const MockDashboard: React.FC = () => {
  return (
    <div data-testid="dashboard">
      <h1>Personal Finance Dashboard</h1>
      <div data-testid="transactions-section">
        <TransactionsList />
      </div>
      <div data-testid="add-transaction-section">
        <TransactionForm />
      </div>
    </div>
  );
};

describe('Dashboard Integration E2E Tests', () => {
  let mockApiClient: any;

  beforeEach(() => {
    queryClient.clear();
    mockApiClient = mockApiClientMethods;
    (mockApiClient.get as jest.MockedFunction<any>).mockReset();
    (mockApiClient.post as jest.MockedFunction<any>).mockReset();
    (mockApiClient.put as jest.MockedFunction<any>).mockReset();
    (mockApiClient.delete as jest.MockedFunction<any>).mockReset();
    (mockApiClient.setAuthToken as jest.MockedFunction<any>).mockReset();
  });

  describe('Complete Dashboard Flow', () => {
    it('should load and display complete dashboard with transactions', async () => {
      const mockTransactions = [
        { 
          id: '1', 
          description: 'Grocery Shopping', 
          amount: 75.50, 
          type: 'expense', 
          date: '2025-09-27', 
          categoryId: 'food', 
          userId: 'user1' 
        },
        { 
          id: '2', 
          description: 'Freelance Work', 
          amount: 500.00, 
          type: 'income', 
          date: '2025-09-26', 
          categoryId: 'work', 
          userId: 'user1' 
        },
        { 
          id: '3', 
          description: 'Gas Station', 
          amount: 45.00, 
          type: 'expense', 
          date: '2025-09-25', 
          categoryId: 'transport', 
          userId: 'user1' 
        },
      ];

      (mockApiClient.get as jest.MockedFunction<any>).mockResolvedValue({ data: mockTransactions });

      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      // Verify dashboard structure
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Personal Finance Dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('transactions-section')).toBeInTheDocument();
      expect(screen.getByTestId('add-transaction-section')).toBeInTheDocument();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText(/Grocery Shopping/i)).toBeInTheDocument();
        expect(screen.getByText(/Freelance Work/i)).toBeInTheDocument();
        expect(screen.getByText(/Gas Station/i)).toBeInTheDocument();
      });

      // Verify all transaction data is displayed
      expect(screen.getByText(/75.5/i)).toBeInTheDocument();
      expect(screen.getByText(/500/i)).toBeInTheDocument();
      expect(screen.getByText(/45/i)).toBeInTheDocument();
    });

    it('should handle empty transaction list gracefully', async () => {
      (mockApiClient.get as jest.MockedFunction<any>).mockResolvedValue({ data: [] });

      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
      });
    });

    it('should allow adding multiple transactions and see them in the list', async () => {
      const initialTransactions = [
        { 
          id: '1', 
          description: 'Initial Transaction', 
          amount: 100.00, 
          type: 'expense', 
          date: '2025-09-27', 
          categoryId: 'cat1', 
          userId: 'user1' 
        },
      ];

      const newTransaction1 = {
        id: '2', 
        description: 'First New Transaction', 
        amount: 50.00, 
        type: 'income', 
        date: '2025-09-27', 
        categoryId: 'cat2', 
        userId: 'user1' 
      };

      const newTransaction2 = {
        id: '3', 
        description: 'Second New Transaction', 
        amount: 25.00, 
        type: 'expense', 
        date: '2025-09-27', 
        categoryId: 'cat3', 
        userId: 'user1' 
      };

      // Mock API responses
      (mockApiClient.get as jest.MockedFunction<any>)
        .mockResolvedValueOnce({ data: initialTransactions })
        .mockResolvedValueOnce({ data: [...initialTransactions, newTransaction1] })
        .mockResolvedValueOnce({ data: [...initialTransactions, newTransaction1, newTransaction2] });

      (mockApiClient.post as jest.MockedFunction<any>)
        .mockResolvedValueOnce({ data: newTransaction1 })
        .mockResolvedValueOnce({ data: newTransaction2 });

      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByText(/Initial Transaction/i)).toBeInTheDocument();
      });

      // Add first new transaction
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'First New Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '50.00' } 
      });
      fireEvent.change(screen.getByLabelText(/Type/i), { 
        target: { value: 'income' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Wait for first transaction to be added
      await waitFor(() => {
        expect(screen.getByText(/Transaction created successfully!/i)).toBeInTheDocument();
      });

      // Clear form and add second transaction
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'Second New Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '25.00' } 
      });
      fireEvent.change(screen.getByLabelText(/Type/i), { 
        target: { value: 'expense' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Wait for second transaction to be added
      await waitFor(() => {
        expect(screen.getByText(/Transaction created successfully!/i)).toBeInTheDocument();
      });

      // Verify all transactions are displayed
      expect(screen.getByText(/Initial Transaction/i)).toBeInTheDocument();
      expect(screen.getByText(/First New Transaction/i)).toBeInTheDocument();
      expect(screen.getByText(/Second New Transaction/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully across the dashboard', async () => {
      (mockApiClient.get as jest.MockedFunction<any>).mockRejectedValue(new Error('Network connection failed'));

      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Error: Network connection failed/i)).toBeInTheDocument();
      });

      // Dashboard should still be visible
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('add-transaction-section')).toBeInTheDocument();
    });

    it('should handle API errors during transaction creation', async () => {
      (mockApiClient.get as jest.MockedFunction<any>).mockResolvedValue({ data: [] });
      (mockApiClient.post as jest.MockedFunction<any>).mockRejectedValue({ message: 'Server error: Unable to create transaction' });

      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
      });

      // Try to add transaction
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'Failing Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '100.00' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Server error: Unable to create transaction/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large transaction lists efficiently', async () => {
      // Create a large list of transactions
      const largeTransactionList = Array.from({ length: 100 }, (_, index) => ({
        id: `txn-${index}`,
        description: `Transaction ${index + 1}`,
        amount: Math.random() * 1000,
        type: index % 2 === 0 ? 'income' : 'expense',
        date: '2025-09-27',
        categoryId: `cat-${index % 10}`,
        userId: 'user1'
      }));

      (mockApiClient.get as jest.MockedFunction<any>).mockResolvedValue({ data: largeTransactionList });

      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getAllByText(/Transaction 1/i)[0]).toBeInTheDocument(); // Get the first instance
        expect(screen.getAllByText(/Transaction 100/i)[0]).toBeInTheDocument(); // Get the first instance
      });

      // Verify all transactions are rendered
      expect(screen.getAllByText(/Transaction \d+/i)).toHaveLength(100);
    });
  });
});
