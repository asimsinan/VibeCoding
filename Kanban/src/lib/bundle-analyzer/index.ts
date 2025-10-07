/**
 * Bundle analysis utilities
 * Provides tools for analyzing and optimizing bundle size
 */

export interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
  parsedSize: number;
  children: BundleInfo[];
}

export interface BundleAnalysis {
  totalSize: number;
  totalGzipSize: number;
  totalParsedSize: number;
  bundles: BundleInfo[];
  largestBundles: BundleInfo[];
  duplicateModules: string[];
  unusedModules: string[];
}

export interface BundleOptimization {
  suggestions: string[];
  estimatedSavings: number;
  priority: 'high' | 'medium' | 'low';
}

class BundleAnalyzer {
  private bundleData: BundleInfo[] = [];
  private analysis: BundleAnalysis | null = null;

  /**
   * Load bundle analysis data
   */
  public loadBundleData(data: BundleInfo[]): void {
    this.bundleData = data;
    this.analysis = null; // Reset analysis
  }

  /**
   * Analyze bundle data
   */
  public analyze(): BundleAnalysis {
    if (this.analysis) {
      return this.analysis;
    }

    const bundles = this.bundleData;
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const totalGzipSize = bundles.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
    const totalParsedSize = bundles.reduce((sum, bundle) => sum + bundle.parsedSize, 0);

    // Find largest bundles
    const largestBundles = [...bundles]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    // Find duplicate modules (simplified)
    const duplicateModules = this.findDuplicateModules(bundles);

    // Find unused modules (simplified)
    const unusedModules = this.findUnusedModules(bundles);

    this.analysis = {
      totalSize,
      totalGzipSize,
      totalParsedSize,
      bundles,
      largestBundles,
      duplicateModules,
      unusedModules,
    };

    return this.analysis;
  }

  /**
   * Find duplicate modules across bundles
   */
  private findDuplicateModules(bundles: BundleInfo[]): string[] {
    const moduleCount = new Map<string, number>();
    const duplicateModules: string[] = [];

    const countModules = (bundle: BundleInfo) => {
      if (bundle.children.length === 0) {
        // This is a module
        const count = moduleCount.get(bundle.name) || 0;
        moduleCount.set(bundle.name, count + 1);
      } else {
        bundle.children.forEach(countModules);
      }
    };

    bundles.forEach(countModules);

    moduleCount.forEach((count, module) => {
      if (count > 1) {
        duplicateModules.push(module);
      }
    });

    return duplicateModules;
  }

  /**
   * Find unused modules (simplified heuristic)
   */
  private findUnusedModules(bundles: BundleInfo[]): string[] {
    const unusedModules: string[] = [];
    
    // This is a simplified implementation
    // In a real scenario, you'd analyze import/export relationships
    bundles.forEach((bundle) => {
      if (bundle.children.length === 0 && bundle.size < 1000) {
        // Small modules might be unused
        unusedModules.push(bundle.name);
      }
    });

    return unusedModules;
  }

  /**
   * Get optimization suggestions
   */
  public getOptimizationSuggestions(): BundleOptimization {
    const analysis = this.analyze();
    const suggestions: string[] = [];
    let estimatedSavings = 0;
    let priority: 'high' | 'medium' | 'low' = 'low';

    // Check for large bundles
    const largeBundles = analysis.largestBundles.filter(b => b.size > 500000); // 500KB
    if (largeBundles.length > 0) {
      suggestions.push(`Consider code splitting for large bundles: ${largeBundles.map(b => b.name).join(', ')}`);
      estimatedSavings += largeBundles.reduce((sum, b) => sum + b.size * 0.2, 0); // 20% savings estimate
      priority = 'high';
    }

    // Check for duplicate modules
    if (analysis.duplicateModules.length > 0) {
      suggestions.push(`Remove duplicate modules: ${analysis.duplicateModules.length} modules found`);
      estimatedSavings += analysis.duplicateModules.length * 10000; // 10KB per duplicate
      priority = priority === 'high' ? 'high' : 'medium';
    }

    // Check for unused modules
    if (analysis.unusedModules.length > 0) {
      suggestions.push(`Remove unused modules: ${analysis.unusedModules.length} modules found`);
      estimatedSavings += analysis.unusedModules.reduce((sum, name) => sum + 5000, 0); // 5KB per unused module
      priority = priority === 'high' ? 'high' : 'medium';
    }

    // Check bundle size thresholds
    if (analysis.totalSize > 2000000) { // 2MB
      suggestions.push('Total bundle size is large. Consider implementing code splitting and lazy loading.');
      priority = 'high';
    } else if (analysis.totalSize > 1000000) { // 1MB
      suggestions.push('Total bundle size is moderate. Consider optimizing imports and removing unused code.');
      priority = priority === 'high' ? 'high' : 'medium';
    }

    // Check gzip compression
    const compressionRatio = analysis.totalGzipSize / analysis.totalSize;
    if (compressionRatio > 0.7) {
      suggestions.push('Bundle compression ratio is low. Consider optimizing assets and code.');
      priority = priority === 'high' ? 'high' : 'medium';
    }

    return {
      suggestions,
      estimatedSavings: Math.round(estimatedSavings),
      priority,
    };
  }

  /**
   * Generate bundle report
   */
  public generateReport(): string {
    const analysis = this.analyze();
    const optimization = this.getOptimizationSuggestions();

    let report = '# Bundle Analysis Report\n\n';
    
    report += '## Summary\n';
    report += `- Total Size: ${this.formatBytes(analysis.totalSize)}\n`;
    report += `- Gzipped Size: ${this.formatBytes(analysis.totalGzipSize)}\n`;
    report += `- Parsed Size: ${this.formatBytes(analysis.totalParsedSize)}\n`;
    report += `- Number of Bundles: ${analysis.bundles.length}\n\n`;

    report += '## Largest Bundles\n';
    analysis.largestBundles.forEach((bundle, index) => {
      report += `${index + 1}. ${bundle.name}: ${this.formatBytes(bundle.size)}\n`;
    });

    if (analysis.duplicateModules.length > 0) {
      report += '\n## Duplicate Modules\n';
      analysis.duplicateModules.forEach(module => {
        report += `- ${module}\n`;
      });
    }

    if (analysis.unusedModules.length > 0) {
      report += '\n## Unused Modules\n';
      analysis.unusedModules.forEach(module => {
        report += `- ${module}\n`;
      });
    }

    report += '\n## Optimization Suggestions\n';
    report += `Priority: ${optimization.priority.toUpperCase()}\n`;
    report += `Estimated Savings: ${this.formatBytes(optimization.estimatedSavings)}\n\n`;
    
    optimization.suggestions.forEach((suggestion, index) => {
      report += `${index + 1}. ${suggestion}\n`;
    });

    return report;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Singleton instance
let bundleAnalyzer: BundleAnalyzer | null = null;

/**
 * Get the bundle analyzer instance
 */
export function getBundleAnalyzer(): BundleAnalyzer {
  if (!bundleAnalyzer) {
    bundleAnalyzer = new BundleAnalyzer();
  }
  return bundleAnalyzer;
}

/**
 * Analyze bundle data
 */
export function analyzeBundle(data: BundleInfo[]): BundleAnalysis {
  const analyzer = getBundleAnalyzer();
  analyzer.loadBundleData(data);
  return analyzer.analyze();
}

/**
 * Get optimization suggestions
 */
export function getBundleOptimizationSuggestions(data: BundleInfo[]): BundleOptimization {
  const analyzer = getBundleAnalyzer();
  analyzer.loadBundleData(data);
  return analyzer.getOptimizationSuggestions();
}

/**
 * Generate bundle report
 */
export function generateBundleReport(data: BundleInfo[]): string {
  const analyzer = getBundleAnalyzer();
  analyzer.loadBundleData(data);
  return analyzer.generateReport();
}
