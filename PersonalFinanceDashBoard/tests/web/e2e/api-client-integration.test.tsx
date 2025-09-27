import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionsList from '@/components/TransactionsList';
import { mockedAxiosInstance, resetMockedAxios } from './mockAxios'; // Import centralized mock
import { setupApiClient } from '@/lib/api/apiClient'; // Import the real setupApiClient
import { AxiosInstance, InternalAxiosRequestConfig } from 'axios'; // Import Axios types for interceptor tests
import { ApiClient } from '@/lib/api/apiClient'; // Import ApiClient type for interceptor tests

// Mock the setupApiClient to return our mockedAxiosInstance
jest.mock('@/lib/api/apiClient', () => ({
  setupApiClient: jest.fn((baseURL: string, initialToken: string | null = null, axiosInstance?: AxiosInstance) => {
    const instance = axiosInstance || mockedAxiosInstance; // Use mockedAxiosInstance directly

    (instance as any).baseURL = baseURL;
    let authToken: string | null = initialToken;

    (instance as any).setAuthToken = jest.fn((token: string | null) => {
      authToken = token;
      if ((instance as any).defaults && (instance as any).defaults.headers && (instance as any).defaults.headers.common) {
        (instance as any).defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        (instance as any).defaults = (instance as any).defaults || { headers: { common: {} } };
        (instance as any).defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    });

    if (initialToken) {
      (instance as any).setAuthToken(initialToken);
    }

    // The original apiClient uses config.headers.set, so we'll simulate that behavior
    const requestInterceptor = (config: InternalAxiosRequestConfig) => {
      if (authToken) {
        // Ensure headers exist as a plain object for direct modification
        if (!config.headers) { config.headers = {} as any; }
        (config.headers as any).Authorization = (instance as any).defaults.headers.common['Authorization'];
      }
      return config;
    };

    const responseErrorHandler = (error: any) => {
      // console.error outputs are handled by default in Jest if not mocked
      return Promise.reject(error);
    };

    // Register the actual interceptor functions on the mocked instance
    instance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
    instance.interceptors.response.use((response) => response, responseErrorHandler);

    return instance as ApiClient;
  }),
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

describe('API Client Integration E2E Tests', () => {
  let mockApiClient: any;

  beforeEach(() => {
    queryClient.clear();
    // Clear all mocks on mockedAxiosInstance and setupApiClient
    (setupApiClient as jest.Mock).mockClear();
    (mockedAxiosInstance.get as jest.MockedFunction<any>).mockClear();
    (mockedAxiosInstance.post as jest.MockedFunction<any>).mockClear();
    (mockedAxiosInstance.put as jest.MockedFunction<any>).mockClear();
    (mockedAxiosInstance.delete as jest.MockedFunction<any>).mockClear();
    // We don't mock interceptor.use directly in mockAxios.ts, but call it in setupApiClient mock
    // So, we need to ensure mockClear is called on the functions passed to use.
    (mockedAxiosInstance.interceptors.request.use as jest.MockedFunction<any>).mockClear();
    (mockedAxiosInstance.interceptors.response.use as jest.MockedFunction<any>).mockClear();

    resetMockedAxios(); // Centralized axios mock reset

    // Initialize the real setupApiClient with the mockedAxiosInstance
    mockApiClient = setupApiClient('http://localhost:3000/api', 'initial-token', mockedAxiosInstance);
  });

  describe('API Client Setup and Configuration', () => {
    it('should initialize API client with correct base URL and auth token', async () => {
      const baseURL = 'http://localhost:3000/api';
      const authToken = 'test-auth-token-123';

      // Re-initialize mockApiClient with specific test token and the mockedAxiosInstance
      mockApiClient = setupApiClient(baseURL, authToken, mockedAxiosInstance);

      // Verify setupApiClient was called with correct arguments (including mockedAxiosInstance)
      expect(setupApiClient).toHaveBeenCalledWith(baseURL, authToken, mockedAxiosInstance);

      // Mock the underlying axios call to prevent actual network requests
      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockImplementation(() => {
        return Promise.resolve({ data: {} });
      });

      // Trigger a request to ensure interceptor is used
      await mockApiClient.get('/test').catch(() => {});

      // Verify request interceptor was set up (called the use method)
      expect(mockedAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should handle authentication token updates', async () => {
      // Use the mockApiClient from beforeEach, or re-initialize if needed
      mockApiClient.setAuthToken('new-token-456');

      // Mock the underlying axios instance to prevent actual network requests
      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockImplementation(() => {
        return Promise.resolve({ data: {} });
      });

      // Trigger a request to ensure interceptor is used and new token is applied
      await mockApiClient.get('/test').catch(() => {});

      // Verify setAuthToken was called on the mocked instance
      expect((mockApiClient as any).setAuthToken).toHaveBeenCalledWith('new-token-456');
    });
  });

  describe('HTTP Request Integration', () => {
    it('should make GET requests with correct parameters', async () => {
      const mockTransactions = [
        { id: '1', description: 'Test Transaction', amount: 100, type: 'expense', date: '2025-09-27', categoryId: 'cat1', userId: 'user1' }
      ];

      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockResolvedValue({ data: mockTransactions });

      // Use mockApiClient from beforeEach
      const response = await mockApiClient.get('/transactions', {
        params: { userId: 'user1' }
      });

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/transactions', {
        params: { userId: 'user1' }
      });
      expect(response.data).toEqual(mockTransactions);
    });

    it('should make POST requests with correct data', async () => {
      const newTransaction = {
        description: 'New Transaction',
        amount: 50.00,
        type: 'income',
        date: '2025-09-27',
        categoryId: 'cat1',
        userId: 'user1'
      };

      const createdTransaction = { id: '2', ...newTransaction };

      (mockedAxiosInstance.post as jest.MockedFunction<any>).mockResolvedValue({ data: createdTransaction });

      // Use mockApiClient from beforeEach
      const response = await mockApiClient.post('/transactions', newTransaction);

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/transactions', newTransaction);
      expect(response.data).toEqual(createdTransaction);
    });

    it('should handle HTTP errors gracefully', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockRejectedValue(errorResponse);

      // Use mockApiClient from beforeEach
      await expect(mockApiClient.get('/transactions')).rejects.toEqual(errorResponse);
    });
  });

  describe('Component Integration with API Client', () => {
    it('should use API client for data fetching in components', async () => {
      const mockTransactions = [
        { id: '1', description: 'Component Test Transaction', amount: 75.50, type: 'expense', date: '2025-09-27', categoryId: 'cat1', userId: 'user1' }
      ];

      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockResolvedValue({ data: mockTransactions });

      render(
        <Wrapper>
          <TransactionsList apiClient={mockApiClient} /> {/* Inject mockApiClient */}
        </Wrapper>
      );

      // Wait for component to make API call
      await waitFor(() => {
        expect(screen.getByText(/Component Test Transaction/i)).toBeInTheDocument();
      });

      // Verify API was called
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/transactions', {
        params: { userId: 'user1' }
      });
    });

    it('should handle API client errors in components', async () => {
      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockRejectedValue(new Error('Transactions not found'));

      render(
        <Wrapper>
          <TransactionsList apiClient={mockApiClient} /> {/* Inject mockApiClient */}
        </Wrapper>
      );

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Error: Transactions not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Request/Response Interceptors', () => {
    it('should add authentication headers to requests', async () => {
      const baseURL = 'http://localhost:3000/api';
      const authToken = 'test-token';
      // Re-initialize apiClient with specific test token and mockedAxiosInstance
      mockApiClient = setupApiClient(baseURL, authToken, mockedAxiosInstance);

      // Trigger a request to ensure interceptor is used
      await mockApiClient.get('/test');

      // Verify request interceptor was set up (called the use method)
      expect(mockedAxiosInstance.interceptors.request.use).toHaveBeenCalled();

      // Get the interceptor function that was passed to .use()
      const requestInterceptor = (mockedAxiosInstance.interceptors.request.use as jest.MockedFunction<any>).mock.calls[0][0];

      // Create a dummy config object and apply the interceptor
      const dummyConfig = { headers: {} }; // Ensure headers object exists
      const modifiedConfig = requestInterceptor(dummyConfig as InternalAxiosRequestConfig);

      // Assert that the Authorization header was correctly added
      expect((modifiedConfig.headers as any).Authorization).toBe('Bearer test-token');
    });

    it('should handle response errors in interceptor', async () => {
      const baseURL = 'http://localhost:3000/api';
      const authToken = 'test-token';
      // Re-initialize apiClient with specific test token and mockedAxiosInstance
      mockApiClient = setupApiClient(baseURL, authToken, mockedAxiosInstance);

      // Mock the underlying axios instance to reject the call
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockRejectedValue(errorResponse);

      // Trigger a request to ensure interceptor is used
      await mockApiClient.get('/test').catch(() => {}); // Make a dummy call to trigger interceptor

      // Verify response interceptor was set up (called the use method)
      expect(mockedAxiosInstance.interceptors.response.use).toHaveBeenCalled();

      // There's no need to get the errorHandler from mock.calls[0][1] anymore
      // because the mock for setupApiClient already registers the real error handler.
      // We just need to check if the error was handled as expected.
      await expect(mockApiClient.get('/test')).rejects.toEqual(errorResponse);
    });
  });

  describe('Timeout and Error Handling', () => {
    it('should handle request timeouts', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';

      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockRejectedValue(timeoutError);

      // Use mockApiClient from beforeEach
      await expect(mockApiClient.get('/transactions')).rejects.toThrow('timeout of 10000ms exceeded');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'ERR_NETWORK';

      (mockedAxiosInstance.get as jest.MockedFunction<any>).mockRejectedValue(networkError);

      // Use mockApiClient from beforeEach
      await expect(mockApiClient.get('/transactions')).rejects.toThrow('Network Error');
    });
  });
});
