/**
 * Production Build Verification Script
 * Verifies that the application is ready for production deployment
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface BuildCheck {
  name: string;
  passed: boolean;
  message: string;
}

const checks: BuildCheck[] = [];

function addCheck(name: string, passed: boolean, message: string): void {
  checks.push({ name, passed, message });
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
}

console.log('🔍 Production Build Verification\n');

// Check 1: TypeScript compilation
try {
  execSync('npm run type-check', { stdio: 'pipe' });
  addCheck('TypeScript Compilation', true, 'No type errors found');
} catch (error: any) {
  addCheck('TypeScript Compilation', false, `Type errors found: ${error.message}`);
}

// Check 2: Linting
try {
  execSync('npm run lint', { stdio: 'pipe' });
  addCheck('ESLint', true, 'No linting errors found');
} catch (error: any) {
  addCheck('ESLint', false, `Linting errors found: ${error.message}`);
}

// Check 3: Tests
try {
  const testOutput = execSync('npm test -- --passWithNoTests', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  const passed = testOutput.includes('Tests:') && 
                 (testOutput.match(/Tests:\s+(\d+)\s+passed/) || [])[1] !== '0';
  addCheck('Test Suite', passed, passed ? 'All tests passing' : 'Some tests failed');
} catch (error: any) {
  addCheck('Test Suite', false, 'Tests failed or encountered errors');
}

// Check 4: Required files exist
const requiredFiles = [
  'app.json',
  'package.json',
  'tsconfig.json',
  'app/_layout.tsx',
  'src/lib/food-label-scanner/config/firebase.ts',
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  addCheck(`File: ${file}`, exists, exists ? 'Exists' : 'Missing');
});

// Check 5: Environment configuration
const envExampleExists = fs.existsSync(path.join(process.cwd(), 'config/env.example.md'));
addCheck('Environment Config', envExampleExists, 
  envExampleExists ? 'Environment config template exists' : 'Missing env.example.md');

// Check 6: Package.json scripts
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  );
  const requiredScripts = ['start', 'test', 'lint', 'type-check'];
  const hasAllScripts = requiredScripts.every(script => 
    packageJson.scripts && packageJson.scripts[script]
  );
  addCheck('Package Scripts', hasAllScripts, 
    hasAllScripts ? 'All required scripts present' : 'Missing required scripts');
} catch (error) {
  addCheck('Package Scripts', false, 'Failed to read package.json');
}

// Check 7: App.json configuration
try {
  const appJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf-8')
  );
  const hasRequiredConfig = appJson.expo && 
                            appJson.expo.name && 
                            appJson.expo.slug &&
                            appJson.expo.version;
  addCheck('App Configuration', hasRequiredConfig, 
    hasRequiredConfig ? 'App.json properly configured' : 'Missing required app.json fields');
} catch (error) {
  addCheck('App Configuration', false, 'Failed to read app.json');
}

// Summary
console.log('\n📊 Verification Summary\n');
const passedChecks = checks.filter(c => c.passed).length;
const totalChecks = checks.length;
const allPassed = passedChecks === totalChecks;

console.log(`Passed: ${passedChecks}/${totalChecks}`);
console.log(`Status: ${allPassed ? '✅ PRODUCTION READY' : '❌ NOT READY'}\n`);

if (!allPassed) {
  console.log('❌ Failed Checks:');
  checks.filter(c => !c.passed).forEach(check => {
    console.log(`   - ${check.name}: ${check.message}`);
  });
  process.exit(1);
}

console.log('✅ All production build checks passed!');
process.exit(0);

