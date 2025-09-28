#!/usr/bin/env node

/**
 * Security Audit Script for Mental Health Journal App
 * Checks for common security vulnerabilities and best practices
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Audit...\n');

const issues = [];
const warnings = [];

// Check for hardcoded secrets
function checkHardcodedSecrets() {
  console.log('Checking for hardcoded secrets...');
  
  const files = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/mood/page.tsx',
    'src/app/mood/history/page.tsx',
    'src/app/trends/page.tsx',
    'src/lib/mood-api/client/MoodApiClient.ts',
    'src/lib/mood-api/client/HttpClient.ts'
  ];

  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /key\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      secretPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          warnings.push(`Potential hardcoded secret in ${file}: ${matches[0]}`);
        }
      });
    }
  });
}

// Check for security headers
function checkSecurityHeaders() {
  console.log('Checking security headers...');
  
  const nextConfigPath = 'next.config.js';
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (!content.includes('Content-Security-Policy')) {
      warnings.push('Missing Content-Security-Policy header');
    }
    
    if (!content.includes('X-Frame-Options')) {
      warnings.push('Missing X-Frame-Options header');
    }
    
    if (!content.includes('X-Content-Type-Options')) {
      warnings.push('Missing X-Content-Type-Options header');
    }
  }
}

// Check for vulnerable dependencies
function checkDependencies() {
  console.log('Checking dependencies...');
  
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for known vulnerable packages
    const vulnerablePackages = [
      'lodash@4.17.0',
      'moment@2.29.0',
      'axios@0.21.0'
    ];
    
    vulnerablePackages.forEach(pkg => {
      const [name, version] = pkg.split('@');
      if (dependencies[name] && dependencies[name].includes(version)) {
        issues.push(`Vulnerable package detected: ${pkg}`);
      }
    });
  }
}

// Check for proper error handling
function checkErrorHandling() {
  console.log('Checking error handling...');
  
  const files = [
    'src/lib/mood-api/client/HttpClient.ts',
    'src/lib/mood-api/client/MoodApiClient.ts',
    'src/app/hooks/useMoodData.ts'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for console.log in production code
      if (content.includes('console.log') && !content.includes('// TODO: Remove in production')) {
        warnings.push(`console.log found in ${file} - should be removed for production`);
      }
      
      // Check for proper error handling
      if (content.includes('catch') && !content.includes('throw')) {
        warnings.push(`Error caught but not re-thrown in ${file}`);
      }
    }
  });
}

// Check for input validation
function checkInputValidation() {
  console.log('Checking input validation...');
  
  const validationFiles = [
    'src/lib/mood-core/services/ValidationService.ts',
    'src/lib/mood-api/client/DataTransformService.ts'
  ];

  validationFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (!content.includes('validateMoodRating') && !content.includes('validateNotes')) {
        warnings.push(`Input validation may be missing in ${file}`);
      }
    }
  });
}

// Run all checks
checkHardcodedSecrets();
checkSecurityHeaders();
checkDependencies();
checkErrorHandling();
checkInputValidation();

// Report results
console.log('\n📊 Security Audit Results:\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No security issues found!');
} else {
  if (issues.length > 0) {
    console.log('🚨 Critical Issues:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
}

console.log('\n🔒 Security audit complete!');
process.exit(issues.length > 0 ? 1 : 0);
