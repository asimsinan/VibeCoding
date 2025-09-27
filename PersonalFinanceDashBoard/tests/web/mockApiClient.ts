import { AxiosInstance } from 'axios';

export const mockApiClientMethods = {
  get: jest.fn((_url: string, _config?: any) => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  post: jest.fn((_url: string, _data?: any, _config?: any) => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  put: jest.fn((_url: string, _data?: any, _config?: any) => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  delete: jest.fn((_url: string, _config?: any) => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  setAuthToken: jest.fn((_token: string) => {
    // In a real scenario, this would update the default headers
    // For mocking purposes, we just record the call
  }) as jest.MockedFunction<any>,
  interceptors: {
    request: {
      use: jest.fn() as jest.MockedFunction<any>,
    },
    response: {
      use: jest.fn() as jest.MockedFunction<any>,
    },
  },
  defaults: { headers: { common: {} } },
  baseURL: undefined,
} as any as AxiosInstance; // Cast to AxiosInstance to satisfy type checking for interceptors

export const setupApiClient = jest.fn((_baseURL: string, authToken?: string) => {
  (mockApiClientMethods.get as jest.MockedFunction<any>).mockClear();
  (mockApiClientMethods.post as jest.MockedFunction<any>).mockClear();
  (mockApiClientMethods.put as jest.MockedFunction<any>).mockClear();
  (mockApiClientMethods.delete as jest.MockedFunction<any>).mockClear();
  ((mockApiClientMethods as any).setAuthToken as jest.MockedFunction<any>).mockClear();
  (mockApiClientMethods.interceptors.request.use as jest.MockedFunction<any>).mockClear();
  (mockApiClientMethods.interceptors.response.use as jest.MockedFunction<any>).mockClear();

  if (authToken) {
    ((mockApiClientMethods as any).setAuthToken as jest.MockedFunction<any>)(authToken);
  }
  return mockApiClientMethods;
});
