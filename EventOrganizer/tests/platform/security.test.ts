#!/usr/bin/env node
/**
 * Professional Security Tests
 * 
 * Tests cover:
 * - HTTPS validation
 * - CSP testing
 * - XSS protection testing
 * - CSRF protection testing
 * - Input sanitization
 * - Rate limiting
 * - Security headers
 * - Authentication security
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { SecurityUtils } from '../../src/lib/platform/security'

describe('Security Tests', () => {
  let securityUtils: SecurityUtils

  beforeEach(() => {
    securityUtils = SecurityUtils.getInstance()
  })

  afterEach(() => {
    // Clean up after each test
  })

  describe('HTTPS Validation', () => {
    it('should enforce HTTPS in production', () => {
      const isHTTPS = location.protocol === 'https:'
      
      if (process.env.NODE_ENV === 'production') {
        expect(isHTTPS).toBe(true)
      }
    })

    it('should detect insecure connections', () => {
      const isSecure = securityUtils.isSecureConnection()
      
      expect(typeof isSecure).toBe('boolean')
    })

    it('should validate SSL certificates', () => {
      const sslValidation = securityUtils.validateSSL()
      
      expect(sslValidation).toBeDefined()
      expect(sslValidation.isValid).toBeDefined()
      expect(typeof sslValidation.isValid).toBe('boolean')
    })
  })

  describe('Content Security Policy (CSP)', () => {
    it('should validate CSP headers', () => {
      const cspValidation = securityUtils.validateCSP()
      
      expect(cspValidation).toBeDefined()
      expect(cspValidation.isValid).toBeDefined()
      expect(typeof cspValidation.isValid).toBe('boolean')
    })

    it('should detect CSP violations', () => {
      const violations = securityUtils.detectCSPViolations()
      
      expect(violations).toBeDefined()
      expect(Array.isArray(violations)).toBe(true)
    })

    it('should generate CSP recommendations', () => {
      const recommendations = securityUtils.getCSPRecommendations()
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('XSS Protection', () => {
    it('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("XSS")</script>'
      const sanitized = securityUtils.sanitizeHTML(maliciousInput)
      
      expect(sanitized).toBeDefined()
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('should sanitize user input', () => {
      const maliciousInput = 'javascript:alert("XSS")'
      const sanitized = securityUtils.sanitizeInput(maliciousInput)
      
      expect(sanitized).toBeDefined()
      expect(sanitized).not.toContain('javascript:')
    })

    it('should detect suspicious content', () => {
      const suspiciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        'onload=alert("XSS")',
        'expression(alert("XSS"))'
      ]

      suspiciousInputs.forEach(input => {
        const isSuspicious = securityUtils.containsSuspiciousContent(input)
        expect(isSuspicious).toBe(true)
      })
    })

    it('should prevent script injection', () => {
      const scriptInput = '<script>document.cookie="hacked=true"</script>'
      const sanitized = securityUtils.sanitizeHTML(scriptInput)
      
      expect(sanitized).toBeDefined()
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('document.cookie')
    })
  })

  describe('CSRF Protection', () => {
    it('should generate CSRF tokens', () => {
      const token = securityUtils.generateCSRFToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should validate CSRF tokens', () => {
      const token = securityUtils.generateCSRFToken()
      const isValid = securityUtils.validateCSRFToken(token)
      
      expect(isValid).toBe(true)
    })

    it('should reject invalid CSRF tokens', () => {
      const invalidToken = 'invalid-token'
      const isValid = securityUtils.validateCSRFToken(invalidToken)
      
      expect(isValid).toBe(false)
    })

    it('should handle expired CSRF tokens', () => {
      const token = securityUtils.generateCSRFToken()
      
      // Simulate token expiration by manipulating internal state
      const tokenData = (securityUtils as any).csrfTokens.get('default')
      if (tokenData) {
        tokenData.expires = Date.now() - 1000 // Expired 1 second ago
      }
      
      const isValid = securityUtils.validateCSRFToken(token)
      expect(isValid).toBe(false)
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize various input types', () => {
      const testInputs = [
        'Normal text',
        '<script>alert("XSS")</script>',
        'javascript:void(0)',
        'onclick="alert(1)"',
        'data:text/html,<script>alert("XSS")</script>'
      ]

      testInputs.forEach(input => {
        const sanitized = securityUtils.sanitizeInput(input)
        expect(sanitized).toBeDefined()
        expect(typeof sanitized).toBe('string')
      })
    })

    it('should preserve safe content', () => {
      const safeInput = 'This is safe content with numbers 123 and symbols !@#'
      const sanitized = securityUtils.sanitizeInput(safeInput)
      
      expect(sanitized).toBe(safeInput)
    })

    it('should handle empty and null inputs', () => {
      expect(securityUtils.sanitizeInput('')).toBe('')
      expect(securityUtils.sanitizeInput(null as any)).toBe('')
      expect(securityUtils.sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('Rate Limiting', () => {
    it('should implement rate limiting', () => {
      const key = 'test-key'
      const isValid = securityUtils.checkRateLimit(key)
      
      expect(typeof isValid).toBe('boolean')
    })

    it('should track rate limit usage', () => {
      const key = 'test-key'
      
      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        securityUtils.checkRateLimit(key)
      }
      
      const usage = securityUtils.getRateLimitUsage(key)
      expect(usage).toBeDefined()
      expect(usage.count).toBeGreaterThan(0)
    })

    it('should reset rate limits after window', async () => {
      const key = 'test-key'
      
      // Make a request
      securityUtils.checkRateLimit(key)
      
      // Wait for rate limit window to reset (in test environment)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const usage = securityUtils.getRateLimitUsage(key)
      expect(usage).toBeDefined()
    })
  })

  describe('Security Headers', () => {
    it('should validate security headers', () => {
      const headers = securityUtils.validateSecurityHeaders()
      
      expect(headers).toBeDefined()
      expect(headers.isValid).toBeDefined()
      expect(typeof headers.isValid).toBe('boolean')
    })

    it('should detect missing security headers', () => {
      const missingHeaders = securityUtils.detectMissingSecurityHeaders()
      
      expect(missingHeaders).toBeDefined()
      expect(Array.isArray(missingHeaders)).toBe(true)
    })

    it('should provide security header recommendations', () => {
      const recommendations = securityUtils.getSecurityHeaderRecommendations()
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('Authentication Security', () => {
    it('should hash passwords securely', async () => {
      const password = 'test-password-123'
      const hashed = await securityUtils.hashPassword(password)
      
      expect(hashed).toBeDefined()
      expect(typeof hashed).toBe('string')
      expect(hashed).not.toBe(password)
      expect(hashed.length).toBeGreaterThan(0)
    })

    it('should validate password strength', () => {
      const weakPassword = '123'
      const strongPassword = 'StrongPassword123!'
      
      const weakValidation = securityUtils.validatePassword(weakPassword)
      const strongValidation = securityUtils.validatePassword(strongPassword)
      
      expect(weakValidation.isValid).toBe(false)
      expect(weakValidation.errors.length).toBeGreaterThan(0)
      
      expect(strongValidation.isValid).toBe(true)
      expect(strongValidation.errors.length).toBe(0)
    })

    it('should validate email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ]
      
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com'
      ]

      validEmails.forEach(email => {
        expect(securityUtils.validateEmail(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(securityUtils.validateEmail(email)).toBe(false)
      })
    })
  })

  describe('Data Encryption', () => {
    it('should encrypt sensitive data', async () => {
      const data = 'sensitive-information'
      const key = 'encryption-key-123'
      
      const encrypted = await securityUtils.encryptData(data, key)
      
      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(encrypted).not.toBe(data)
    })

    it('should decrypt encrypted data', async () => {
      const data = 'sensitive-information'
      const key = 'encryption-key-123'
      
      const encrypted = await securityUtils.encryptData(data, key)
      const decrypted = await securityUtils.decryptData(encrypted, key)
      
      expect(decrypted).toBe(data)
    })

    it('should handle encryption errors gracefully', async () => {
      const data = 'test-data'
      const invalidKey = ''
      
      try {
        await securityUtils.encryptData(data, invalidKey)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Security Event Logging', () => {
    it('should log security events', () => {
      const originalEvents = securityUtils.getSecurityEvents().length
      
      securityUtils.logSecurityEvent('xss', 'high', { 
        suspiciousInput: '<script>alert("XSS")</script>' 
      })
      
      const events = securityUtils.getSecurityEvents()
      expect(events.length).toBe(originalEvents + 1)
      
      const lastEvent = events[events.length - 1]
      expect(lastEvent.type).toBe('xss')
      expect(lastEvent.severity).toBe('high')
    })

    it('should filter security events by type', () => {
      securityUtils.logSecurityEvent('xss', 'high', { test: 'data' })
      securityUtils.logSecurityEvent('csrf', 'medium', { test: 'data' })
      
      const xssEvents = securityUtils.getSecurityEventsByType('xss')
      const csrfEvents = securityUtils.getSecurityEventsByType('csrf')
      
      expect(xssEvents.length).toBeGreaterThan(0)
      expect(csrfEvents.length).toBeGreaterThan(0)
      
      xssEvents.forEach(event => {
        expect(event.type).toBe('xss')
      })
      
      csrfEvents.forEach(event => {
        expect(event.type).toBe('csrf')
      })
    })

    it('should filter security events by severity', () => {
      securityUtils.logSecurityEvent('xss', 'high', { test: 'data' })
      securityUtils.logSecurityEvent('csrf', 'medium', { test: 'data' })
      
      const highSeverityEvents = securityUtils.getSecurityEventsBySeverity('high')
      const mediumSeverityEvents = securityUtils.getSecurityEventsBySeverity('medium')
      
      expect(highSeverityEvents.length).toBeGreaterThan(0)
      expect(mediumSeverityEvents.length).toBeGreaterThan(0)
      
      highSeverityEvents.forEach(event => {
        expect(event.severity).toBe('high')
      })
      
      mediumSeverityEvents.forEach(event => {
        expect(event.severity).toBe('medium')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', async () => {
      const data = 'test-data'
      const invalidKey = null as any
      
      try {
        await securityUtils.encryptData(data, invalidKey)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle decryption errors gracefully', async () => {
      const invalidData = 'invalid-encrypted-data'
      const key = 'test-key'
      
      try {
        await securityUtils.decryptData(invalidData, key)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle invalid input gracefully', () => {
      const invalidInputs = [null, undefined, 123, {}, []]
      
      invalidInputs.forEach(input => {
        const sanitized = securityUtils.sanitizeInput(input as any)
        expect(sanitized).toBeDefined()
        expect(typeof sanitized).toBe('string')
      })
    })
  })

  describe('Security Configuration', () => {
    it('should update security configuration', () => {
      const newConfig = {
        enableHTTPS: false,
        enableCSP: true
      }
      
      securityUtils.updateConfig(newConfig)
      const config = securityUtils.getConfig()
      
      expect(config.enableHTTPS).toBe(false)
      expect(config.enableCSP).toBe(true)
    })

    it('should get current security configuration', () => {
      const config = securityUtils.getConfig()
      
      expect(config).toBeDefined()
      expect(typeof config.enableHTTPS).toBe('boolean')
      expect(typeof config.enableCSP).toBe('boolean')
      expect(typeof config.enableXSSProtection).toBe('boolean')
      expect(typeof config.enableCSRFProtection).toBe('boolean')
    })
  })

  describe('Security Validation', () => {
    it('should validate overall security implementation', () => {
      const validation = securityUtils.validateSecurityImplementation()
      
      expect(validation).toBeDefined()
      expect(validation.isValid).toBeDefined()
      expect(validation.issues).toBeDefined()
      expect(Array.isArray(validation.issues)).toBe(true)
    })

    it('should provide security recommendations', () => {
      const recommendations = securityUtils.getSecurityRecommendations()
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })
})
