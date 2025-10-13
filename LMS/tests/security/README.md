# Security Test Suite

This directory contains the comprehensive Security Test Suite for the Multi-Tenant Learning Management System. These tests are designed to validate the application's security posture, identify vulnerabilities, and ensure compliance with security best practices.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Running Tests](#running-tests)
  - [All Security Tests](#all-security-tests)
  - [Specific Security Tests](#specific-security-tests)
  - [Security Test Categories](#security-test-categories)
- [Security Test Structure](#security-test-structure)
- [Security Test Coverage](#security-test-coverage)
- [Security Utilities](#security-utilities)
- [Security Best Practices](#security-best-practices)
- [Reporting](#reporting)
- [Troubleshooting](#troubleshooting)

## Overview

Security testing is critical to ensure the LMS application is protected against common vulnerabilities and security threats. This suite includes tests for:

- **Authentication Security**: Login bypass prevention, password security, session management
- **Authorization Security**: Role-based access control, permission enforcement
- **Input Validation**: XSS prevention, SQL injection prevention, data sanitization
- **Multi-Tenant Isolation**: Data isolation between organizations
- **API Security**: Endpoint protection, request validation
- **Vulnerability Prevention**: Common attack vector prevention

## Prerequisites

Before running the security tests, ensure the following:

1. **Node.js and npm**: Installed on your system
2. **Project Dependencies**: All `package.json` dependencies are installed (`npm install`)
3. **Prisma Client Generated**: `npx prisma generate` has been run
4. **Database Migrated and Seeded**: `npx prisma migrate dev` and `npm run db:seed` (if applicable) have been run
5. **Test Database**: A clean test database is available for testing

## Running Tests

You can run security tests using the scripts defined in `package.json`.

### All Security Tests

To run all security tests:

```bash
npm run test:security
```

Or, using the comprehensive runner script:

```bash
npm run test:security:run
```

### Specific Security Tests

To run a specific security test file:

```bash
npx jest tests/security-tests.test.ts
npx jest tests/multi-tenant-security-tests.test.ts
```

To run tests matching a specific pattern:

```bash
npx jest --testNamePattern="Authentication Security"
npx jest --testNamePattern="XSS"
npx jest --testNamePattern="SQL Injection"
```

### Security Test Categories

Run tests by security category:

```bash
# Authentication tests
npx jest --testNamePattern="Authentication Security"

# Authorization tests
npx jest --testNamePattern="Authorization Security"

# Input validation tests
npx jest --testNamePattern="Input Validation"

# Multi-tenant tests
npx jest --testNamePattern="Multi-Tenant"

# API security tests
npx jest --testNamePattern="API Security"

# Vulnerability prevention tests
npx jest --testNamePattern="XSS|SQL Injection|CSRF"
```

## Security Test Structure

Security tests are organized into several files:

- `security-test-utils.ts`: Contains utility classes and functions for security testing, including authentication helpers, request mocking, and security assertions
- `security-tests.test.ts`: Core security tests covering authentication, authorization, input validation, XSS prevention, and SQL injection prevention
- `multi-tenant-security-tests.test.ts`: Tests specifically for multi-tenant data isolation and cross-organization access prevention

## Security Test Coverage

The security test suite covers:

### Authentication Security
- **Login Bypass Prevention**: Tests to ensure users cannot bypass authentication
- **Password Security**: Validation of password hashing and verification
- **Session Management**: Tests for secure session handling
- **Account Lockout**: Tests for account lockout mechanisms
- **Password Reset**: Security of password reset functionality

### Authorization Security
- **Role-Based Access Control**: Tests for proper role enforcement
- **Permission Enforcement**: Tests for specific permission checks
- **Resource Access Control**: Tests for resource-level access control
- **Cross-Role Access Prevention**: Tests to prevent unauthorized cross-role access

### Input Validation & Sanitization
- **XSS Prevention**: Tests to prevent cross-site scripting attacks
- **SQL Injection Prevention**: Tests to prevent SQL injection attacks
- **Input Sanitization**: Tests for proper input sanitization
- **Data Validation**: Tests for proper data validation
- **File Upload Security**: Tests for secure file upload handling

### Multi-Tenant Isolation
- **Data Isolation**: Tests to ensure data is properly isolated between organizations
- **Cross-Organization Access Prevention**: Tests to prevent access to other organizations' data
- **Organization Context Validation**: Tests for proper organization context validation
- **Tenant-Specific Permissions**: Tests for tenant-specific permission enforcement

### API Security
- **Endpoint Protection**: Tests for proper API endpoint protection
- **Request Validation**: Tests for proper request validation
- **Rate Limiting**: Tests for rate limiting implementation
- **CORS Configuration**: Tests for proper CORS configuration
- **API Authentication**: Tests for API authentication mechanisms

### Vulnerability Prevention
- **Common Attack Vectors**: Tests for prevention of common attack vectors
- **Security Headers**: Tests for proper security headers
- **Error Handling**: Tests for secure error handling
- **Information Disclosure**: Tests to prevent information disclosure
- **Security Misconfigurations**: Tests for security misconfigurations

## Security Utilities

The `security-test-utils.ts` file provides several utility classes:

### SecurityTestUtils
- `createTestUser()`: Creates test users with specific roles
- `loginUser()`: Simulates user login for testing
- `getAuthContext()`: Creates authentication context for testing
- `mockRequest()`: Creates mock requests for API testing
- `runAuthMiddleware()`: Tests authentication middleware
- `runValidationMiddleware()`: Tests validation middleware
- `sanitizeInput()`: Sanitizes input to prevent XSS

### Security Thresholds
- `SECURITY_THRESHOLDS`: Defines acceptable thresholds for security metrics
- `SQL_INJECTION_ATTEMPTS`: Maximum allowed SQL injection attempts (0)
- `XSS_ATTEMPTS`: Maximum allowed XSS attempts (0)
- `UNAUTHORIZED_ACCESS_ATTEMPTS`: Maximum allowed unauthorized access attempts (0)
- `FORBIDDEN_ACCESS_ATTEMPTS`: Maximum allowed forbidden access attempts (0)

## Security Best Practices

### Authentication
- Use strong password hashing (bcrypt with appropriate salt rounds)
- Implement proper session management
- Use secure authentication tokens
- Implement account lockout mechanisms
- Use multi-factor authentication where appropriate

### Authorization
- Implement role-based access control (RBAC)
- Use principle of least privilege
- Implement proper permission checks
- Validate user permissions on every request
- Use secure authorization middleware

### Input Validation
- Validate all user input
- Sanitize input to prevent XSS
- Use parameterized queries to prevent SQL injection
- Implement proper file upload validation
- Use content security policies

### Multi-Tenant Security
- Implement proper data isolation
- Validate organization context
- Use tenant-specific permissions
- Implement cross-tenant access prevention
- Use secure multi-tenant middleware

### API Security
- Implement proper API authentication
- Use HTTPS for all API communications
- Implement rate limiting
- Use proper CORS configuration
- Implement API versioning

### General Security
- Keep dependencies updated
- Implement security headers
- Use secure error handling
- Implement logging and monitoring
- Regular security audits

## Reporting

Security test results are logged to the console and can be saved to files for further analysis. The test runner provides:

- **Test Results**: Pass/fail status for each security test
- **Security Coverage**: Overview of security areas tested
- **Vulnerability Detection**: Identification of potential security issues
- **Best Practices**: Recommendations for security improvements

## Troubleshooting

### Common Issues

1. **Authentication Tests Failing**
   - Ensure test users are properly created
   - Check password hashing implementation
   - Verify authentication middleware

2. **Authorization Tests Failing**
   - Check role-based access control implementation
   - Verify permission middleware
   - Ensure proper role assignment

3. **Input Validation Tests Failing**
   - Check input sanitization implementation
   - Verify validation schemas
   - Ensure proper error handling

4. **Multi-Tenant Tests Failing**
   - Check data isolation implementation
   - Verify organization context validation
   - Ensure proper tenant-specific permissions

5. **API Security Tests Failing**
   - Check API endpoint protection
   - Verify request validation
   - Ensure proper authentication

### Debug Tips

- Use `--verbose` flag for detailed test output
- Check test database state
- Verify test data setup
- Review security middleware implementation
- Check error logs for security issues

## Security Test Examples

### Authentication Test Example
```typescript
it('should prevent login with incorrect password', async () => {
  const authContext = SecurityTestUtils.getAuthContext(adminUser);
  const request = SecurityTestUtils.mockRequest('POST', '/api/auth/login', {
    email: adminUser.email,
    password: 'wrongpassword',
  });
  const response = await SecurityTestUtils.runAuthMiddleware(request);
  expect(response).toBeInstanceOf(NextResponse);
  expect((response as NextResponse).status).toBe(401);
});
```

### Authorization Test Example
```typescript
it('should prevent unauthorized access to admin resources', async () => {
  const authContext = SecurityTestUtils.getAuthContext(studentUser);
  const request = SecurityTestUtils.mockRequest('GET', '/api/admin/users', undefined, undefined, authContext);
  const response = await SecurityTestUtils.runAuthMiddleware(request, { requiredRoles: [UserRole.ADMIN] });
  expect(response).toBeInstanceOf(NextResponse);
  expect((response as NextResponse).status).toBe(403);
});
```

### Input Validation Test Example
```typescript
it('should sanitize XSS attempts in input fields', async () => {
  const maliciousTitle = '<script>alert("xss")</script>Malicious Title';
  const sanitizedTitle = SecurityTestUtils.sanitizeInput(maliciousTitle);
  expect(sanitizedTitle).not.toContain('<script>');
  expect(sanitizedTitle).toBe('Malicious Title');
});
```

### Multi-Tenant Test Example
```typescript
it('should prevent users from one organization from accessing data of another organization', async () => {
  const authContext1 = SecurityTestUtils.getAuthContext(admin1);
  const request1 = SecurityTestUtils.mockRequest('GET', `/api/courses/${course2.id}`, undefined, undefined, authContext1);
  const response1 = await SecurityTestUtils.runAuthMiddleware(request1, { requireOrganizationId: true });
  expect(response1).toBeInstanceOf(NextResponse);
  expect((response1 as NextResponse).status).toBe(403);
});
```

## Security Test Maintenance

### Regular Updates
- Update security tests when adding new features
- Review and update security thresholds
- Add tests for new security vulnerabilities
- Update test data and scenarios

### Security Monitoring
- Monitor security test results
- Track security metrics over time
- Identify security trends and patterns
- Implement security improvements based on test results

### Security Documentation
- Keep security documentation updated
- Document security test procedures
- Maintain security best practices guide
- Update security policies and procedures
