# Security Testing Suite

This directory contains comprehensive security testing tools for the Personal Shopping Assistant API.

## 🚀 Quick Start

```bash
# Run all security tests
npm run security:all

# Run individual test suites
npm run security:test      # Main security tests
npm run security:sql       # SQL injection tests
npm run security:headers   # Security headers tests
```

## 🔒 Test Categories

### 1. Main Security Tests (`security-test.js`)
- **Authentication Testing**: Valid/invalid login attempts
- **Authorization Testing**: Protected endpoint access
- **Input Validation**: SQL injection, XSS, path traversal
- **Registration Security**: Weak passwords, duplicate emails
- **Rate Limiting**: API abuse prevention
- **Security Headers**: HTTP security headers validation

### 2. SQL Injection Tests (`sql-injection-test.js`)
- **Payload Testing**: 20+ SQL injection payloads
- **Endpoint Coverage**: Login, search, product endpoints
- **Vulnerability Detection**: Automatic vulnerability identification
- **Response Analysis**: SQL error message detection

### 3. Security Headers Tests (`headers-test.js`)
- **Required Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Recommended Headers**: HSTS, CSP, Referrer-Policy
- **Header Validation**: Correct values and formats
- **Security Score**: Overall security headers rating

### 4. Comprehensive Runner (`security-runner.js`)
- **All-in-One**: Runs all security test suites
- **Risk Assessment**: Calculates overall security risk level
- **Detailed Reporting**: Comprehensive security analysis
- **Recommendations**: Actionable security improvements

## 📊 Security Test Coverage

### Authentication & Authorization
- ✅ Valid user login
- ✅ Invalid credentials handling
- ✅ Empty credentials validation
- ✅ Protected endpoint access control
- ✅ Token validation
- ✅ Session management

### Input Validation
- ✅ SQL injection prevention
- ✅ XSS attack prevention
- ✅ Path traversal protection
- ✅ Command injection prevention
- ✅ Buffer overflow protection
- ✅ Unicode attack prevention

### API Security
- ✅ Rate limiting enforcement
- ✅ Input sanitization
- ✅ Error handling security
- ✅ Data exposure prevention
- ✅ Information leakage protection

### Security Headers
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy
- ✅ Referrer-Policy

## 🎯 Test Results

### Risk Levels
- **🟢 LOW**: 90%+ pass rate, no critical vulnerabilities
- **🟡 MEDIUM**: 70-89% pass rate, minor security issues
- **🟠 HIGH**: 50-69% pass rate, significant security concerns
- **🔴 CRITICAL**: <50% pass rate, critical vulnerabilities

### Security Score Calculation
```
Security Score = (Passed Tests / Total Tests) * 100
Risk Level = Based on score and vulnerability count
```

## 📁 Results Storage

All test results are saved to `./tests/security/results/`:

- `security-test-{timestamp}.json` - Main security test results
- `comprehensive-security-{timestamp}.json` - Complete security analysis
- `sql-injection-{timestamp}.json` - SQL injection test results
- `headers-test-{timestamp}.json` - Security headers analysis

## ⚙️ Configuration

Security tests can be configured via `config.json`:

```json
{
  "security": {
    "baseUrl": "http://localhost:3001",
    "timeout": 10000,
    "testUser": { ... }
  },
  "vulnerabilities": {
    "sqlInjection": { "enabled": true, "payloads": [...] },
    "xss": { "enabled": true, "payloads": [...] }
  },
  "headers": {
    "required": ["X-Content-Type-Options", ...],
    "recommended": ["Strict-Transport-Security", ...]
  }
}
```

## 🔧 Prerequisites

1. **Backend Server Running**: Ensure API server is running
2. **Database Available**: PostgreSQL database accessible
3. **Test User**: Security test user will be created automatically
4. **Node.js**: Version 14 or higher

## 🚨 Important Notes

### Before Running Tests
1. **Start the backend server**: `npm run dev`
2. **Ensure database is seeded**: `npm run db:seed`
3. **Close other applications**: Tests can be resource-intensive

### During Tests
- **Monitor system resources** - Security tests can be intensive
- **Don't interrupt tests** - May corrupt results
- **Review results carefully** - Security issues need immediate attention

### After Tests
- **Review vulnerabilities** - Address critical issues immediately
- **Implement recommendations** - Apply suggested security improvements
- **Re-run tests** - Verify fixes after implementing changes

## 🎯 Best Practices

### Running Security Tests
1. **Run comprehensive tests** - Use `security:all` for complete analysis
2. **Address critical issues first** - Fix vulnerabilities immediately
3. **Implement recommendations** - Apply security improvements
4. **Re-test regularly** - Run security tests after changes
5. **Monitor continuously** - Set up automated security testing

### Interpreting Results
- **Critical Vulnerabilities**: Fix immediately, do not deploy
- **High Risk Issues**: Address before production deployment
- **Medium Risk Issues**: Plan fixes for next release
- **Low Risk Issues**: Monitor and improve over time

### Security Recommendations
1. **Input Validation**: Sanitize all user inputs
2. **Authentication**: Implement strong authentication mechanisms
3. **Authorization**: Proper access control for all endpoints
4. **Security Headers**: Add comprehensive security headers
5. **Rate Limiting**: Implement proper rate limiting
6. **Monitoring**: Set up security monitoring and alerting

## 🛠️ Troubleshooting

### Common Issues

**"Connection refused" errors:**
- Ensure backend server is running on correct port
- Check if port 3001 is available

**"Database connection failed":**
- Verify PostgreSQL is running
- Check database credentials

**"Test user creation failed":**
- Ensure database is accessible
- Check user registration endpoint

**"Rate limiting interfering with tests":**
- Tests are designed to work with rate limiting
- This is expected behavior for realistic testing

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Review the results files for detailed information
3. Ensure all prerequisites are met
4. Try running individual test components

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Testing Best Practices](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

## 🔍 Advanced Usage

### Custom Payloads
Add custom test payloads to `config.json`:

```json
{
  "vulnerabilities": {
    "sqlInjection": {
      "payloads": ["custom payload 1", "custom payload 2"]
    }
  }
}
```

### Custom Headers
Test additional security headers:

```json
{
  "headers": {
    "custom": ["Custom-Security-Header"]
  }
}
```

### Integration with CI/CD
Add security tests to your CI/CD pipeline:

```yaml
- name: Run Security Tests
  run: npm run security:all
```

Remember: **Security testing is an ongoing process, not a one-time activity!** 🔒
