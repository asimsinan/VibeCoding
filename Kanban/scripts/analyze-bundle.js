#!/usr/bin/env node

/**
 * Bundle analysis script
 * Analyzes the Next.js bundle and provides optimization suggestions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: '.next',
  analysisFile: 'bundle-analysis.json',
  reportFile: 'bundle-report.md',
  threshold: {
    totalSize: 2 * 1024 * 1024, // 2MB
    bundleSize: 500 * 1024, // 500KB
    gzipRatio: 0.7, // 70%
  },
};

/**
 * Run bundle analysis
 */
async function analyzeBundle() {
  console.log('🔍 Starting bundle analysis...');

  try {
    // Build the application
    console.log('📦 Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Check if bundle analyzer is available
    try {
      execSync('npx @next/bundle-analyzer --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing bundle analyzer...');
      execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
    }

    // Generate bundle analysis
    console.log('📊 Generating bundle analysis...');
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' });

    // Check if analysis files exist
    const analysisPath = path.join(CONFIG.outputDir, 'analyze');
    if (!fs.existsSync(analysisPath)) {
      throw new Error('Bundle analysis files not found');
    }

    // Read bundle analysis data
    const bundleData = await readBundleData(analysisPath);
    
    // Generate analysis report
    const report = generateAnalysisReport(bundleData);
    
    // Write report to file
    fs.writeFileSync(CONFIG.reportFile, report);
    
    console.log(`✅ Bundle analysis complete! Report saved to ${CONFIG.reportFile}`);
    
    // Check thresholds
    checkThresholds(bundleData);
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

/**
 * Read bundle data from analysis files
 */
async function readBundleData(analysisPath) {
  const bundleData = [];
  
  // Read all JSON files in the analysis directory
  const files = fs.readdirSync(analysisPath);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(analysisPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      bundleData.push(data);
    } catch (error) {
      console.warn(`⚠️  Could not read ${file}:`, error.message);
    }
  }
  
  return bundleData;
}

/**
 * Generate analysis report
 */
function generateAnalysisReport(bundleData) {
  const totalSize = bundleData.reduce((sum, bundle) => sum + bundle.size, 0);
  const totalGzipSize = bundleData.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
  const totalParsedSize = bundleData.reduce((sum, bundle) => sum + bundle.parsedSize, 0);
  
  // Sort bundles by size
  const sortedBundles = [...bundleData].sort((a, b) => b.size - a.size);
  
  // Find large bundles
  const largeBundles = sortedBundles.filter(bundle => bundle.size > CONFIG.threshold.bundleSize);
  
  // Calculate compression ratio
  const compressionRatio = totalGzipSize / totalSize;
  
  // Generate report
  let report = '# Bundle Analysis Report\n\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  report += '## Summary\n';
  report += `- **Total Size:** ${formatBytes(totalSize)}\n`;
  report += `- **Gzipped Size:** ${formatBytes(totalGzipSize)}\n`;
  report += `- **Parsed Size:** ${formatBytes(totalParsedSize)}\n`;
  report += `- **Compression Ratio:** ${(compressionRatio * 100).toFixed(1)}%\n`;
  report += `- **Number of Bundles:** ${bundleData.length}\n\n`;
  
  report += '## Largest Bundles\n';
  sortedBundles.slice(0, 10).forEach((bundle, index) => {
    const size = formatBytes(bundle.size);
    const gzipSize = formatBytes(bundle.gzipSize);
    const ratio = ((bundle.gzipSize / bundle.size) * 100).toFixed(1);
    report += `${index + 1}. **${bundle.name}**\n`;
    report += `   - Size: ${size}\n`;
    report += `   - Gzipped: ${gzipSize} (${ratio}%)\n`;
    report += `   - Parsed: ${formatBytes(bundle.parsedSize)}\n\n`;
  });
  
  report += '## Optimization Suggestions\n';
  
  // Check total size
  if (totalSize > CONFIG.threshold.totalSize) {
    report += '### ⚠️ Total Bundle Size is Large\n';
    report += `- Current size: ${formatBytes(totalSize)}\n`;
    report += `- Threshold: ${formatBytes(CONFIG.threshold.totalSize)}\n`;
    report += '- **Recommendations:**\n';
    report += '  - Implement code splitting\n';
    report += '  - Use dynamic imports for large components\n';
    report += '  - Remove unused dependencies\n';
    report += '  - Optimize images and assets\n\n';
  }
  
  // Check large bundles
  if (largeBundles.length > 0) {
    report += '### ⚠️ Large Individual Bundles\n';
    largeBundles.forEach(bundle => {
      report += `- **${bundle.name}**: ${formatBytes(bundle.size)}\n`;
    });
    report += '- **Recommendations:**\n';
    report += '  - Split large bundles into smaller chunks\n';
    report += '  - Use lazy loading for non-critical components\n';
    report += '  - Consider vendor chunking\n\n';
  }
  
  // Check compression ratio
  if (compressionRatio > CONFIG.threshold.gzipRatio) {
    report += '### ⚠️ Poor Compression Ratio\n';
    report += `- Current ratio: ${(compressionRatio * 100).toFixed(1)}%\n`;
    report += `- Threshold: ${(CONFIG.threshold.gzipRatio * 100).toFixed(1)}%\n`;
    report += '- **Recommendations:**\n';
    report += '  - Optimize code for better compression\n';
    report += '  - Remove duplicate code\n';
    report += '  - Use more efficient data structures\n\n';
  }
  
  // General recommendations
  report += '### 💡 General Recommendations\n';
  report += '- Use `next/dynamic` for code splitting\n';
  report += '- Implement route-based code splitting\n';
  report += '- Use `next/image` for optimized images\n';
  report += '- Enable gzip compression on your server\n';
  report += '- Use a CDN for static assets\n';
  report += '- Monitor bundle size in CI/CD pipeline\n\n';
  
  report += '## Next Steps\n';
  report += '1. Review the largest bundles and identify optimization opportunities\n';
  report += '2. Implement code splitting for large components\n';
  report += '3. Remove unused dependencies and code\n';
  report += '4. Set up bundle size monitoring in your CI/CD pipeline\n';
  report += '5. Regularly run this analysis to track improvements\n';
  
  return report;
}

/**
 * Check bundle size thresholds
 */
function checkThresholds(bundleData) {
  const totalSize = bundleData.reduce((sum, bundle) => sum + bundle.size, 0);
  const largeBundles = bundleData.filter(bundle => bundle.size > CONFIG.threshold.bundleSize);
  
  let hasIssues = false;
  
  if (totalSize > CONFIG.threshold.totalSize) {
    console.log(`⚠️  Total bundle size (${formatBytes(totalSize)}) exceeds threshold (${formatBytes(CONFIG.threshold.totalSize)})`);
    hasIssues = true;
  }
  
  if (largeBundles.length > 0) {
    console.log(`⚠️  ${largeBundles.length} bundles exceed size threshold (${formatBytes(CONFIG.threshold.bundleSize)})`);
    hasIssues = true;
  }
  
  if (hasIssues) {
    console.log('💡 Consider implementing the optimization suggestions in the report');
  } else {
    console.log('✅ Bundle size is within acceptable limits');
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the analysis
if (require.main === module) {
  analyzeBundle().catch(console.error);
}

module.exports = { analyzeBundle };
