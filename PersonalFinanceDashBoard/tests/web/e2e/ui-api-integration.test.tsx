
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient, mockApiClientMethods } from '../mockApiClient'; // Import from centralized mock file
import TransactionsList from '@/components/TransactionsList';
import TransactionForm from '@/components/forms/TransactionForm';

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

describe('UI-API Integration E2E Tests', () => {
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

  describe('Complete Transaction Management Flow', () => {
    it('should display transactions list and allow adding new transactions', async () => {
      // Mock initial transactions data
      const mockTransactions = [
        { 
          id: '1', 
          description: 'Groceries', 
          amount: 50.00, 
          type: 'expense', 
          date: '2025-09-27', 
          categoryId: 'cat1', 
          userId: 'user1' 
        },
        { 
          id: '2', 
          description: 'Salary', 
          amount: 1000.00, 
          type: 'income', 
          date: '2025-09-26', 
          categoryId: 'cat2', 
          userId: 'user1' 
        },
      ];

      // Mock API responses
      (mockApiClient.get as jest.MockedFunction<any>).mockResolvedValue({ data: mockTransactions });
      (mockApiClient.post as jest.MockedFunction<any>).mockResolvedValue({ 
        data: { 
          id: '3', 
          description: 'New Transaction', 
          amount: 25.50, 
          type: 'expense', 
          date: '2025-09-27', 
          categoryId: 'cat1', 
          userId: 'user1' 
        } 
      });

      // Render both components together
      render(
        <Wrapper>
          <div>
            <TransactionsList apiClient={mockApiClient} /> {/* Inject mockApiClient */}
            <TransactionForm apiClient={mockApiClient} /> {/* Inject mockApiClient */}
          </div>
        </Wrapper>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByText(/Groceries/i)).toBeInTheDocument();
        expect(screen.getByText(/Salary/i)).toBeInTheDocument();
        expect(screen.getByText(/50/i)).toBeInTheDocument();
        expect(screen.getByText(/1000/i)).toBeInTheDocument();
      });

      // Verify API was called
      expect(mockApiClient.get).toHaveBeenCalledWith('/transactions', {
        params: { userId: 'user1' }
      });

      // Test adding a new transaction
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'New Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '25.50' } 
      });
      fireEvent.change(screen.getByLabelText(/Type/i), { 
        target: { value: 'expense' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Transaction created successfully!/i)).toBeInTheDocument();
      });

      // Verify API was called with correct data
      expect(mockApiClient.post).toHaveBeenCalledWith('/transactions', {
        description: 'New Transaction',
        amount: 25.50,
        type: 'expense',
        date: expect.any(String),
        categoryId: 'TODO-CATEGORY-ID',
        userId: 'user1'
      });
    });

    it('should handle API errors gracefully in the UI', async () => {
      // Mock API error
      (mockApiClient.get as jest.MockedFunction<any>).mockRejectedValue(new Error('Network error'));

      render(
        <Wrapper>
          <TransactionsList />
        </Wrapper>
      );

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle form validation errors', async () => {
      render(
        <Wrapper>
          <TransactionForm apiClient={mockApiClient} /> {/* Inject mockApiClient */}
        </Wrapper>
      );

      // Don't fill any fields to trigger validation
      fireEvent.click(screen.getByText(/Add Transaction/i));

      await waitFor(() => {
        screen.debug(); // Add screen.debug() here to inspect DOM before findByText
      }, { timeout: 1000 }); // Shorten waitFor for debug

      // Use findByText to wait for the asynchronous appearance of the error message
      const errorMessage = await screen.findByText('Description and Amount are required, and Amount must be positive.', undefined, { timeout: 2000 });
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle API errors during form submission', async () => {
      // Mock API error
      (mockApiClient.post as jest.MockedFunction<any>).mockRejectedValue({ message: 'Failed to create transaction.' });

      render(
        <Wrapper>
          <TransactionForm />
        </Wrapper>
      );

      // Fill form and submit
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'Test Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '100.00' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to create transaction./i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should refresh data after successful transaction creation', async () => {
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

      const newTransaction = {
        id: '2', 
        description: 'New Transaction', 
        amount: 50.00, 
        type: 'income', 
        date: '2025-09-27', 
        categoryId: 'cat2', 
        userId: 'user1' 
      };

      // Mock API responses
      (mockApiClient.get as jest.MockedFunction<any>)
        .mockResolvedValueOnce({ data: initialTransactions }) // Initial load
        .mockResolvedValueOnce({ data: [...initialTransactions, newTransaction] }); // After creation

      (mockApiClient.post as jest.MockedFunction<any>).mockResolvedValue({ data: newTransaction });

      render(
        <Wrapper>
          <div>
            <TransactionsList apiClient={mockApiClient} /> {/* Inject mockApiClient */}
            <TransactionForm apiClient={mockApiClient} /> {/* Inject mockApiClient */}
          </div>
        </Wrapper>
      );

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByText(/Initial Transaction/i)).toBeInTheDocument();
      });

      // Add new transaction
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'New Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '50.00' } 
      });
      fireEvent.change(screen.getByLabelText(/Type/i), { 
        target: { value: 'income' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Wait for success and data refresh
      await waitFor(() => {
        expect(screen.getByText(/Transaction created successfully!/i)).toBeInTheDocument();
        // The form title is 'Add New Transaction', so we need to be specific for the list item
        expect(screen.getByText('New Transaction: 50 (income) - 2025-09-27')).toBeInTheDocument();
      });

      // Verify API was called twice (initial load + refresh)
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States Integration', () => {
    it('should show loading states during API calls', async () => {
      // Mock slow API response
      (mockApiClient.get as jest.MockedFunction<any>).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
      );

      render(
        <Wrapper>
          <TransactionsList />
        </Wrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/Loading transactions.../i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading transactions.../i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state during form submission', async () => {
      // Mock slow API response
      (mockApiClient.post as jest.MockedFunction<any>).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      render(
        <Wrapper>
          <TransactionForm />
        </Wrapper>
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'Test Transaction' } 
      });
      fireEvent.change(screen.getByLabelText(/Amount/i), { 
        target: { value: '100.00' } 
      });

      fireEvent.click(screen.getByText(/Add Transaction/i));

      // Should show loading state
      expect(screen.getByText(/Adding.../i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/Adding.../i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Integration', () => {
    it('should set auth token when API client is initialized', () => {
      const initialAuthToken = 'your-auth-token';

      // Call setupApiClient directly to trigger the setAuthToken mock
      setupApiClient('http://localhost:3000/api', initialAuthToken);

      // Verify auth token was set
      expect((mockApiClient.setAuthToken as jest.MockedFunction<any>)).toHaveBeenCalledWith(initialAuthToken);
    });
  });
});
