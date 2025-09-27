import { AxiosInstance } from 'axios';

export const mockedAxiosInstance = {
  get: jest.fn(() => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  post: jest.fn(() => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  put: jest.fn(() => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
  delete: jest.fn(() => Promise.resolve({ data: {} })) as jest.MockedFunction<any>,
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
} as any as AxiosInstance;

export const resetMockedAxios = () => {
  (mockedAxiosInstance.get as jest.MockedFunction<any>).mockReset();
  (mockedAxiosInstance.post as jest.MockedFunction<any>).mockReset();
  (mockedAxiosInstance.put as jest.MockedFunction<any>).mockReset();
  (mockedAxiosInstance.delete as jest.MockedFunction<any>).mockReset();
  (mockedAxiosInstance.interceptors.request.use as jest.MockedFunction<any>).mockReset();
  (mockedAxiosInstance.interceptors.response.use as jest.MockedFunction<any>).mockReset();
  (mockedAxiosInstance as any).defaults = { headers: { common: {} } }; // Reset defaults as well
  (mockedAxiosInstance as any).baseURL = undefined; // Reset baseURL
};
