'use client';

import React, { useEffect, useState } from 'react';
import { 
  getPerformanceMetrics, 
  getCoreWebVitalsScore, 
  initializePerformanceMonitoring 
} from './index';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showMetrics?: boolean;
  onMetricsUpdate?: (metrics: any) => void;
}

export function PerformanceMonitor({ 
  enabled = true, 
  showMetrics = false,
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initialize performance monitoring
    initializePerformanceMonitoring();

    // Update metrics periodically
    const updateMetrics = () => {
      const currentMetrics = getPerformanceMetrics();
      const currentScores = getCoreWebVitalsScore();
      
      setMetrics(currentMetrics);
      setScores(currentScores);
      
      onMetricsUpdate?.(currentMetrics);
    };

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [enabled, onMetricsUpdate]);

  if (!enabled || !showMetrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Performance Metrics</h3>
      
      {metrics && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">LCP:</span>
            <span className={getScoreColor(scores?.lcp)}>
              {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">FID:</span>
            <span className={getScoreColor(scores?.fid)}>
              {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">CLS:</span>
            <span className={getScoreColor(scores?.cls)}>
              {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">FCP:</span>
            <span className={getScoreColor(scores?.fcp)}>
              {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Load Time:</span>
            <span className="text-gray-800">
              {metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Resources:</span>
            <span className="text-gray-800">{metrics.resourceCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: string): string {
  switch (score) {
    case 'good':
      return 'text-green-600';
    case 'needs-improvement':
      return 'text-yellow-600';
    case 'poor':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export default PerformanceMonitor;
