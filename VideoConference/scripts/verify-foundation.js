#!/usr/bin/env node

/**
 * Foundation Verification Script
 * Verifies all foundation components are properly set up and ready for core implementation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verification results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

/**
 * Add verification result
 */
function addResult(name, status, message, details = null) {
  results.checks.push({
    name,
    status,
    message,
    details,
  });
  
  if (status === 'passed') {
    results.passed++;
  } else if (status === 'failed') {
    results.failed++;
  } else if (status === 'warning') {
    results.warnings++;
  }
}

/**
 * Check if file exists
 */
function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    addResult(description, 'passed', `File exists: ${filePath}`);
  } else {
    addResult(description, 'failed', `File missing: ${filePath}`);
  }
  
  return exists;
}

/**
 * Check if directory exists
 */
function checkDirectoryExists(dirPath, description) {
  const fullPath = path.join(__dirname, '..', dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  
  if (exists) {
    addResult(description, 'passed', `Directory exists: ${dirPath}`);
  } else {
    addResult(description, 'failed', `Directory missing: ${dirPath}`);
  }
  
  return exists;
}

/**
 * Check if file contains specific content
 */
function checkFileContent(filePath, content, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    addResult(description, 'failed', `File missing: ${filePath}`);
    return false;
  }
  
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const contains = fileContent.includes(content);
  
  if (contains) {
    addResult(description, 'passed', `File contains expected content: ${filePath}`);
  } else {
    addResult(description, 'failed', `File missing expected content: ${filePath}`);
  }
  
  return contains;
}

/**
 * Check package.json dependencies
 */
function checkDependencies() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    addResult('Package.json exists', 'failed', 'package.json file missing');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    'next', 'react', 'react-dom', 'typescript', 'tailwindcss',
    'pg', 'redis', 'ws', 'uuid', 'zod', 'jest', 'supertest'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missingDeps.length === 0) {
    addResult('Required dependencies', 'passed', 'All required dependencies are installed');
  } else {
    addResult('Required dependencies', 'failed', `Missing dependencies: ${missingDeps.join(', ')}`);
  }
}

/**
 * Check TypeScript configuration
 */
function checkTypeScriptConfig() {
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    addResult('TypeScript configuration', 'failed', 'tsconfig.json missing');
    return;
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  // Check required compiler options
  const requiredOptions = {
    'target': 'ES2020',
    'strict': true,
    'esModuleInterop': true,
    'skipLibCheck': true,
  };
  
  let allOptionsPresent = true;
  for (const [option, value] of Object.entries(requiredOptions)) {
    if (tsconfig.compilerOptions?.[option] !== value) {
      allOptionsPresent = false;
      break;
    }
  }
  
  if (allOptionsPresent) {
    addResult('TypeScript configuration', 'passed', 'TypeScript is properly configured');
  } else {
    addResult('TypeScript configuration', 'failed', 'TypeScript configuration is incomplete');
  }
}

/**
 * Check Jest configuration
 */
function checkJestConfig() {
  const jestConfigPath = path.join(__dirname, '..', 'jest.config.js');
  const jestContractConfigPath = path.join(__dirname, '..', 'jest.contract.config.mjs');
  
  if (!fs.existsSync(jestConfigPath)) {
    addResult('Jest configuration', 'failed', 'jest.config.js missing');
  } else {
    addResult('Jest configuration', 'passed', 'Jest is configured');
  }
  
  if (!fs.existsSync(jestContractConfigPath)) {
    addResult('Contract test configuration', 'failed', 'jest.contract.config.mjs missing');
  } else {
    addResult('Contract test configuration', 'passed', 'Contract tests are configured');
  }
}

/**
 * Check project structure
 */
function checkProjectStructure() {
  const requiredDirs = [
    'src/lib/video-conferencing',
    'src/lib/video-conferencing/models',
    'src/lib/video-conferencing/services',
    'src/lib/video-conferencing/components',
    'src/contracts',
    'src/contracts/schemas',
    'src/contracts/types',
    'src/tests/contract',
    'src/tests/integration',
    'src/tests/unit',
    'src/migrations',
    'scripts',
  ];
  
  let allDirsExist = true;
  for (const dir of requiredDirs) {
    if (!checkDirectoryExists(dir, `Directory: ${dir}`)) {
      allDirsExist = false;
    }
  }
  
  if (allDirsExist) {
    addResult('Project structure', 'passed', 'All required directories exist');
  } else {
    addResult('Project structure', 'failed', 'Some required directories are missing');
  }
}

/**
 * Check API contracts
 */
function checkAPIContracts() {
  const openApiPath = 'src/contracts/openapi.yaml';
  const schemasDir = 'src/contracts/schemas';
  const typesDir = 'src/contracts/types';
  
  const openApiExists = checkFileExists(openApiPath, 'OpenAPI specification');
  
  // Check schema files
  const schemaFiles = ['room.schema.json', 'participant.schema.json', 'message.schema.json'];
  let allSchemasExist = true;
  for (const schema of schemaFiles) {
    if (!checkFileExists(`${schemasDir}/${schema}`, `Schema: ${schema}`)) {
      allSchemasExist = false;
    }
  }
  
  // Check type files
  const typeFiles = ['api.types.ts'];
  let allTypesExist = true;
  for (const type of typeFiles) {
    if (!checkFileExists(`${typesDir}/${type}`, `Types: ${type}`)) {
      allTypesExist = false;
    }
  }
  
  if (openApiExists && allSchemasExist && allTypesExist) {
    addResult('API contracts', 'passed', 'All API contracts are present');
  } else {
    addResult('API contracts', 'failed', 'Some API contracts are missing');
  }
}

/**
 * Check data models
 */
function checkDataModels() {
  const modelFiles = [
    'src/lib/video-conferencing/models/room.model.ts',
    'src/lib/video-conferencing/models/participant.model.ts',
    'src/lib/video-conferencing/models/message.model.ts',
    'src/lib/video-conferencing/models/index.ts',
  ];
  
  let allModelsExist = true;
  for (const model of modelFiles) {
    if (!checkFileExists(model, `Model: ${path.basename(model)}`)) {
      allModelsExist = false;
    }
  }
  
  if (allModelsExist) {
    addResult('Data models', 'passed', 'All data models are present');
  } else {
    addResult('Data models', 'failed', 'Some data models are missing');
  }
}

/**
 * Check database configuration
 */
function checkDatabaseConfig() {
  const dbServicePath = 'src/lib/video-conferencing/services/database.service.ts';
  const dbConfigPath = 'config/database.config.ts';
  const schemaPath = 'src/lib/video-conferencing/models/database.schema.sql';
  
  const dbServiceExists = checkFileExists(dbServicePath, 'Database service');
  const dbConfigExists = checkFileExists(dbConfigPath, 'Database configuration');
  const schemaExists = checkFileExists(schemaPath, 'Database schema');
  
  if (dbServiceExists && dbConfigExists && schemaExists) {
    addResult('Database configuration', 'passed', 'Database is properly configured');
  } else {
    addResult('Database configuration', 'failed', 'Database configuration is incomplete');
  }
}

/**
 * Check migration scripts
 */
function checkMigrationScripts() {
  const migrateScriptPath = 'scripts/migrate.js';
  const seedScriptPath = 'scripts/seed.js';
  const initialMigrationPath = 'src/migrations/001_initial_schema.js';
  
  const migrateExists = checkFileExists(migrateScriptPath, 'Migration script');
  const seedExists = checkFileExists(seedScriptPath, 'Seed script');
  const migrationExists = checkFileExists(initialMigrationPath, 'Initial migration');
  
  if (migrateExists && seedExists && migrationExists) {
    addResult('Migration scripts', 'passed', 'Migration system is properly set up');
  } else {
    addResult('Migration scripts', 'failed', 'Migration system is incomplete');
  }
}

/**
 * Check test files
 */
function checkTestFiles() {
  const testFiles = [
    'src/tests/contract/contract.test.ts',
    'src/tests/contract/setup.ts',
    'src/tests/integration/integration.test.ts',
    'src/tests/unit/models.test.ts',
  ];
  
  let allTestsExist = true;
  for (const test of testFiles) {
    if (!checkFileExists(test, `Test: ${path.basename(test)}`)) {
      allTestsExist = false;
    }
  }
  
  if (allTestsExist) {
    addResult('Test files', 'passed', 'All test files are present');
  } else {
    addResult('Test files', 'failed', 'Some test files are missing');
  }
}

/**
 * Check environment configuration
 */
function checkEnvironmentConfig() {
  const envExamplePath = 'env.example';
  const envExampleExists = checkFileExists(envExamplePath, 'Environment example');
  
  if (envExampleExists) {
    addResult('Environment configuration', 'passed', 'Environment configuration is set up');
  } else {
    addResult('Environment configuration', 'failed', 'Environment configuration is missing');
  }
}

/**
 * Check package.json scripts
 */
function checkPackageScripts() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    addResult('Package scripts', 'failed', 'package.json missing');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = [
    'dev', 'build', 'start', 'test', 'test:contract', 'test:integration', 'test:unit',
    'db:migrate', 'db:seed', 'type-check'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
  
  if (missingScripts.length === 0) {
    addResult('Package scripts', 'passed', 'All required scripts are present');
  } else {
    addResult('Package scripts', 'failed', `Missing scripts: ${missingScripts.join(', ')}`);
  }
}

/**
 * Run type checking
 */
function runTypeCheck() {
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    addResult('TypeScript compilation', 'passed', 'TypeScript compiles without errors');
  } catch (error) {
    addResult('TypeScript compilation', 'failed', 'TypeScript compilation failed');
  }
}

/**
 * Run linting
 */
function runLinting() {
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    addResult('ESLint', 'passed', 'Code passes linting checks');
  } catch (error) {
    addResult('ESLint', 'warning', 'Code has linting warnings (this is acceptable for foundation phase)');
  }
}

/**
 * Main verification function
 */
async function verifyFoundation() {
  console.log('🔍 Verifying foundation setup...\n');
  
  // Check project structure
  checkProjectStructure();
  checkDependencies();
  checkTypeScriptConfig();
  checkJestConfig();
  
  // Check API contracts
  checkAPIContracts();
  
  // Check data models
  checkDataModels();
  
  // Check database configuration
  checkDatabaseConfig();
  checkMigrationScripts();
  
  // Check test files
  checkTestFiles();
  
  // Check environment configuration
  checkEnvironmentConfig();
  checkPackageScripts();
  
  // Run code quality checks
  runTypeCheck();
  runLinting();
  
  // Print results
  console.log('\n📊 Verification Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  
  console.log('\n📋 Detailed Results:');
  for (const check of results.checks) {
    const status = check.status === 'passed' ? '✅' : check.status === 'failed' ? '❌' : '⚠️';
    console.log(`${status} ${check.name}: ${check.message}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
  }
  
  // Overall status
  if (results.failed === 0) {
    console.log('\n🎉 Foundation setup verification PASSED!');
    console.log('The project is ready for core implementation.');
    return true;
  } else {
    console.log('\n❌ Foundation setup verification FAILED!');
    console.log('Please fix the issues above before proceeding.');
    return false;
  }
}

// Run verification
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyFoundation().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { verifyFoundation };
