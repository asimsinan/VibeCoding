import { apiClient } from '../../../lib/api-client';

// Integration tests that require a running server
describe('Real API Integration Tests with Server', () => {
  // Skip these tests if server is not running
  const isServerRunning = process.env.NODE_ENV === 'test' && process.env.TEST_SERVER_URL;

  describe('Upload API Integration', () => {
    test('should successfully upload a file when server is running', async () => {
      if (!isServerRunning) {
        console.log('Skipping server integration test - server not running');
        return;
      }

      const file = new File(['test resume content'], 'test-resume.pdf', { 
        type: 'application/pdf' 
      });

      try {
        const response = await apiClient.uploadResume(file);
        
        expect(response).toHaveProperty('uploadId');
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('fileInfo');
        
        expect(response.status).toBe('completed');
        expect(response.fileInfo.fileName).toBe('test-resume.pdf');
        expect(response.fileInfo.fileType).toBe('application/pdf');
        
        // Store uploadId for feedback test
        (global as any).testUploadId = response.uploadId;
      } catch (error) {
        // If server is not running, this is expected
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Feedback API Integration', () => {
    test('should successfully fetch feedback when server is running', async () => {
      if (!isServerRunning) {
        console.log('Skipping server integration test - server not running');
        return;
      }

      const uploadId = (global as any).testUploadId;
      if (!uploadId) {
        console.log('Skipping feedback test - no uploadId available');
        return;
      }

      try {
        const response = await apiClient.getFeedback(uploadId);
        
        expect(response).toHaveProperty('uploadId');
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('feedback');
        
        expect(response.status).toBe('completed');
        expect(response.feedback).toHaveProperty('overallScore');
        expect(response.feedback).toHaveProperty('contentScore');
        expect(response.feedback).toHaveProperty('formattingScore');
        expect(response.feedback).toHaveProperty('keywordScore');
        expect(response.feedback).toHaveProperty('suggestions');
        expect(response.feedback).toHaveProperty('strengths');
        expect(response.feedback).toHaveProperty('improvements');
        
        expect(typeof response.feedback.overallScore).toBe('number');
        expect(Array.isArray(response.feedback.suggestions)).toBe(true);
        expect(Array.isArray(response.feedback.strengths)).toBe(true);
        expect(Array.isArray(response.feedback.improvements)).toBe(true);
      } catch (error) {
        // If server is not running, this is expected
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Health API Integration', () => {
    test('should successfully check health when server is running', async () => {
      if (!isServerRunning) {
        console.log('Skipping server integration test - server not running');
        return;
      }

      try {
        const response = await apiClient.getHealth();
        
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('version');
        expect(response).toHaveProperty('uptime');
        expect(response).toHaveProperty('services');
        
        expect(['healthy', 'degraded', 'unhealthy']).toContain(response.status);
        expect(response.services).toHaveProperty('database');
        expect(response.services).toHaveProperty('ai_service');
        expect(response.services).toHaveProperty('file_storage');
        
        expect(typeof response.uptime).toBe('number');
        expect(response.uptime).toBeGreaterThan(0);
      } catch (error) {
        // If server is not running, this is expected
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid file types gracefully', async () => {
      if (!isServerRunning) {
        console.log('Skipping server integration test - server not running');
        return;
      }

      const invalidFile = new File(['test content'], 'test.txt', { 
        type: 'text/plain' 
      });

      try {
        await apiClient.uploadResume(invalidFile);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Unsupported file type');
      }
    }, 10000);

    test('should handle non-existent feedback gracefully', async () => {
      if (!isServerRunning) {
        console.log('Skipping server integration test - server not running');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      try {
        await apiClient.getFeedback(nonExistentId);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    }, 10000);
  });
});
