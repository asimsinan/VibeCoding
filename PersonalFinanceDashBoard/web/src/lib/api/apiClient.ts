import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface ApiClient extends AxiosInstance {
  setAuthToken: (token: string | null) => void;
}

export const setupApiClient = (baseURL: string, initialToken: string | null = null, axiosInstance?: AxiosInstance): ApiClient => {
  const instance = axiosInstance || axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const apiClient = instance as ApiClient;

  let authToken: string | null = initialToken;

  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (authToken) {
        config.headers.set('Authorization', `Bearer ${authToken}`);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        console.error('API Error Response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('API Error Request:', error.request);
      } else {
        console.error('API Error Message:', error.message);
      }
      return Promise.reject(error);
    }
  );

  apiClient.setAuthToken = (token: string | null) => {
    authToken = token;
  };

  return apiClient;
};
