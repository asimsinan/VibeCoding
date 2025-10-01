#!/usr/bin/env node
/**
 * Vercel Build Script for Personal Shopping Assistant
 * 
 * This script handles the build process for Vercel deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

try {
  // Ensure we're in the right directory
  const projectRoot = process.cwd();
  console.log(`📁 Project root: ${projectRoot}`);

  // Check if TypeScript is available
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
    console.log('✅ TypeScript is available');
  } catch (error) {
    console.log('⚠️ TypeScript not found, installing...');
    execSync('npm install typescript --save-dev', { stdio: 'inherit' });
  }

  // Compile TypeScript
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // Check if dist directory was created
  const distPath = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('❌ Build failed: dist directory not found');
    process.exit(1);
  }

  // Copy package.json to dist for Vercel
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const distPackageJsonPath = path.join(distPath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    fs.copyFileSync(packageJsonPath, distPackageJsonPath);
    console.log('✅ Copied package.json to dist');
  }

  // Create a simple index.js entry point for Vercel
  const indexJsContent = `
// Vercel entry point
const { App } = require('./src/App');

const app = new App();

// Export for Vercel
module.exports = app.getApp();
`;

  const indexJsPath = path.join(distPath, 'index.js');
  fs.writeFileSync(indexJsPath, indexJsContent);
  console.log('✅ Created Vercel entry point');

  // Verify build
  const backendIndexPath = path.join(distPath, 'backend', 'src', 'index.js');
  if (!fs.existsSync(backendIndexPath)) {
    console.log('❌ Build verification failed: backend/src/index.js not found');
    process.exit(1);
  }

  console.log('✅ Vercel build completed successfully!');
  console.log('📦 Build artifacts ready for deployment');

} catch (error) {
  console.error('❌ Vercel build failed:', error.message);
  process.exit(1);
}
