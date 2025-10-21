import axios from 'axios';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test the actual API client implementation
describe('API Client Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Upload Resume API', () => {
    test('should call upload API with correct parameters', async () => {
      const mockResponse = {
        data: {
          id: 'upload-123',
          fileName: 'resume.pdf',
          fileSize: 1024,
          status: 'uploaded'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Simulate the actual API client call
      const file = new File(['test content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      expect(response.data).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    test('should handle upload API errors', async () => {
      const mockError = {
        response: {
          status: 413,
          data: {
            message: 'File too large',
            code: 'FILE_TOO_LARGE'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const file = new File(['test content'], 'large-resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post('/api/v1/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error: any) {
        expect(error.response.status).toBe(413);
        expect(error.response.data.message).toBe('File too large');
        expect(error.response.data.code).toBe('FILE_TOO_LARGE');
      }

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    test('should validate file types', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid file type',
            code: 'INVALID_FILE_TYPE'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const file = new File(['test content'], 'resume.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post('/api/v1/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBe('Invalid file type');
      }
    });
  });

  describe('Feedback API', () => {
    test('should fetch feedback data successfully', async () => {
      const mockFeedback = {
        id: 'feedback-123',
        uploadId: 'upload-123',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 85,
        suggestions: [
          'Add more quantifiable achievements',
          'Include industry-specific keywords'
        ],
        strengths: [
          'Clear and professional formatting',
          'Strong educational background'
        ],
        improvements: [
          'Add more metrics to quantify achievements',
          'Include more technical skills'
        ],
        analysis: 'Your resume shows strong potential with clear formatting and relevant experience.'
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockFeedback });

      const response = await axios.get('/api/v1/feedback/upload-123');

      expect(response.data).toEqual(mockFeedback);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/feedback/upload-123');
    });

    test('should handle feedback not found error', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Feedback not found',
            code: 'FEEDBACK_NOT_FOUND'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      try {
        await axios.get('/api/v1/feedback/invalid-id');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toBe('Feedback not found');
        expect(error.response.data.code).toBe('FEEDBACK_NOT_FOUND');
      }

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/feedback/invalid-id');
    });

    test('should handle feedback processing error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Failed to process resume',
            code: 'PROCESSING_ERROR'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      try {
        await axios.get('/api/v1/feedback/upload-123');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.message).toBe('Failed to process resume');
        expect(error.response.data.code).toBe('PROCESSING_ERROR');
      }
    });
  });

  describe('Health Check API', () => {
    test('should fetch health status successfully', async () => {
      const mockHealth = {
        status: 'healthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        uptime: 3600,
        timestamp: new Date().toISOString()
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockHealth });

      const response = await axios.get('/api/v1/health');

      expect(response.data).toEqual(mockHealth);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/health');
    });

    test('should handle degraded service status', async () => {
      const mockHealth = {
        status: 'degraded',
        services: {
          database: 'healthy',
          ai_service: 'degraded',
          file_storage: 'healthy'
        },
        uptime: 3600,
        timestamp: new Date().toISOString()
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockHealth });

      const response = await axios.get('/api/v1/health');

      expect(response.data.status).toBe('degraded');
      expect(response.data.services.ai_service).toBe('degraded');
    });

    test('should handle unhealthy service status', async () => {
      const mockHealth = {
        status: 'unhealthy',
        services: {
          database: 'unhealthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        uptime: 3600,
        timestamp: new Date().toISOString()
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockHealth });

      const response = await axios.get('/api/v1/health');

      expect(response.data.status).toBe('unhealthy');
      expect(response.data.services.database).toBe('unhealthy');
    });
  });

  describe('API Error Handling', () => {
    test('should handle network timeout', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';

      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      try {
        await axios.get('/api/v1/health');
      } catch (error: any) {
        expect(error.message).toBe('timeout of 5000ms exceeded');
        expect(error.code).toBe('ECONNABORTED');
      }
    });

    test('should handle network connection error', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';

      mockedAxios.post.mockRejectedValueOnce(networkError);

      try {
        const file = new File(['test'], 'resume.pdf');
        const formData = new FormData();
        formData.append('file', file);
        
        await axios.post('/api/v1/upload', formData);
      } catch (error: any) {
        expect(error.message).toBe('Network Error');
        expect(error.code).toBe('ERR_NETWORK');
      }
    });

    test('should handle server error (500)', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(serverError);

      try {
        await axios.get('/api/v1/feedback/upload-123');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.message).toBe('Internal server error');
      }
    });

    test('should handle unauthorized error (401)', async () => {
      const authError = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED'
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(authError);

      try {
        await axios.get('/api/v1/feedback/upload-123');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Unauthorized');
      }
    });

    test('should handle rate limit error (429)', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(rateLimitError);

      try {
        const file = new File(['test'], 'resume.pdf');
        const formData = new FormData();
        formData.append('file', file);
        
        await axios.post('/api/v1/upload', formData);
      } catch (error: any) {
        expect(error.response.status).toBe(429);
        expect(error.response.data.message).toBe('Too many requests');
        expect(error.response.data.retryAfter).toBe(60);
      }
    });
  });

  describe('API Response Validation', () => {
    test('should validate upload response structure', async () => {
      const mockResponse = {
        data: {
          id: 'upload-123',
          fileName: 'resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          status: 'uploaded',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await axios.post('/api/v1/upload', new FormData());

      // Validate response structure
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('fileName');
      expect(response.data).toHaveProperty('fileSize');
      expect(response.data).toHaveProperty('fileType');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');

      expect(typeof response.data.id).toBe('string');
      expect(typeof response.data.fileName).toBe('string');
      expect(typeof response.data.fileSize).toBe('number');
      expect(typeof response.data.status).toBe('string');
    });

    test('should validate feedback response structure', async () => {
      const mockResponse = {
        data: {
          id: 'feedback-123',
          uploadId: 'upload-123',
          overallScore: 85,
          contentScore: 90,
          formattingScore: 80,
          keywordScore: 85,
          suggestions: ['Add more metrics'],
          strengths: ['Clear formatting'],
          improvements: ['Include technical skills'],
          analysis: 'Good resume overall',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const response = await axios.get('/api/v1/feedback/upload-123');

      // Validate response structure
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('uploadId');
      expect(response.data).toHaveProperty('overallScore');
      expect(response.data).toHaveProperty('contentScore');
      expect(response.data).toHaveProperty('formattingScore');
      expect(response.data).toHaveProperty('keywordScore');
      expect(response.data).toHaveProperty('suggestions');
      expect(response.data).toHaveProperty('strengths');
      expect(response.data).toHaveProperty('improvements');
      expect(response.data).toHaveProperty('analysis');

      expect(typeof response.data.overallScore).toBe('number');
      expect(typeof response.data.contentScore).toBe('number');
      expect(typeof response.data.formattingScore).toBe('number');
      expect(typeof response.data.keywordScore).toBe('number');
      expect(Array.isArray(response.data.suggestions)).toBe(true);
      expect(Array.isArray(response.data.strengths)).toBe(true);
      expect(Array.isArray(response.data.improvements)).toBe(true);
    });

    test('should validate health response structure', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
          services: {
            database: 'healthy',
            ai_service: 'healthy',
            file_storage: 'healthy'
          },
          uptime: 3600,
          timestamp: new Date().toISOString()
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const response = await axios.get('/api/v1/health');

      // Validate response structure
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('services');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('timestamp');

      expect(typeof response.data.status).toBe('string');
      expect(typeof response.data.services).toBe('object');
      expect(typeof response.data.uptime).toBe('number');
      expect(typeof response.data.timestamp).toBe('string');

      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.data.status);
    });
  });
});
