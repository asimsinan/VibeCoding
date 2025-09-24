#!/usr/bin/env node

/**
 * Invoice Generator CLI Entry Point
 * 
 * This is the executable entry point for the CLI interface.
 * It imports and runs the main CLI program.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the compiled CLI
const cliPath = join(__dirname, '..', 'dist', 'src', 'cli', 'index.js');

// Check if the CLI is compiled
import { existsSync } from 'fs';

if (!existsSync(cliPath)) {
  console.error('Error: CLI not compiled. Please run "npm run build" first.');
  process.exit(1);
}

// Spawn the CLI process
const cliProcess = spawn('node', [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd()
});

// Handle process exit
cliProcess.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle process errors
cliProcess.on('error', (error) => {
  console.error('CLI Error:', error.message);
  process.exit(1);
});
