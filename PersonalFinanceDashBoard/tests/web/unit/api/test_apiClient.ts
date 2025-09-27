import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { setupApiClient } from '@/lib/api/apiClient';

describe('API Client', () => {
  let mock: MockAdapter;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should include authentication token in headers', async () => {
    const token = 'test-token';
    const apiClient = setupApiClient('http://localhost:3000/api', token);

    mock.onGet('/transactions').reply(200, []);

    await apiClient.get('/transactions');

    // Expect the Authorization header to be set
    expect(mock.history.get[0].headers?.Authorization).toBe(`Bearer ${token}`);
  });

  it('should handle API errors gracefully', async () => {
    const apiClient = setupApiClient('http://localhost:3000/api');
    const errorMessage = 'Unauthorized';

    mock.onGet('/transactions').reply(401, { message: errorMessage });

    await expect(apiClient.get('/transactions')).rejects.toThrow(errorMessage);
  });

  it('should allow updating the authentication token', async () => {
    let token = 'initial-token';
    const apiClient = setupApiClient('http://localhost:3000/api', token);

    mock.onGet('/transactions').reply(200, []);
    await apiClient.get('/transactions');
    expect(mock.history.get[0].headers?.Authorization).toBe(`Bearer ${token}`);

    token = 'updated-token';
    // This is where we need a method to update the token in the existing instance
    // For now, this test will fail as there's no updateToken method.
    apiClient.setAuthToken(token); // This method does not exist yet

    mock.onGet('/transactions').reply(200, []);
    await apiClient.get('/transactions');
    expect(mock.history.get[0].headers?.Authorization).toBe(`Bearer ${token}`);
  });
});
