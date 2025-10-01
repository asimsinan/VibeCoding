/**
 * Babel Configuration
 * TASK-023: UI-API Integration Tests
 * 
 * Configures Babel for testing and development.
 */

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Add any necessary plugins here
  ],
};
