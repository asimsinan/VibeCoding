'use client';

import React, { useState, useEffect } from 'react';
import { getPerformanceMetrics, getCoreWebVitalsScore } from '../../src/lib/performance';
import PerformanceMonitor from '../../src/lib/performance/PerformanceMonitor';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = getPerformanceMetrics();
      const currentScores = getCoreWebVitalsScore();
      
      setMetrics(currentMetrics);
      setScores(currentScores);
    };

    // Initial update
    updateMetrics();

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good':
        return '✅';
      case 'needs-improvement':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Real-time performance metrics and Core Web Vitals monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Core Web Vitals */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
            
            {scores && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Largest Contentful Paint (LCP)</h3>
                    <p className="text-sm text-gray-600">
                      {metrics?.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scores.lcp)}`}>
                    {getScoreIcon(scores.lcp)} {scores.lcp}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">First Input Delay (FID)</h3>
                    <p className="text-sm text-gray-600">
                      {metrics?.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scores.fid)}`}>
                    {getScoreIcon(scores.fid)} {scores.fid}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Cumulative Layout Shift (CLS)</h3>
                    <p className="text-sm text-gray-600">
                      {metrics?.cls ? metrics.cls.toFixed(3) : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scores.cls)}`}>
                    {getScoreIcon(scores.cls)} {scores.cls}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">First Contentful Paint (FCP)</h3>
                    <p className="text-sm text-gray-600">
                      {metrics?.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scores.fcp)}`}>
                    {getScoreIcon(scores.fcp)} {scores.fcp}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            
            {metrics && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">Load Time</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">DOM Content Loaded</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.domContentLoaded ? `${Math.round(metrics.domContentLoaded)}ms` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">First Paint</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.firstPaint ? `${Math.round(metrics.firstPaint)}ms` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">First Contentful Paint</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.firstContentfulPaint ? `${Math.round(metrics.firstContentfulPaint)}ms` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">Time to First Byte</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">Resource Count</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.resourceCount}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="font-medium text-gray-900">Resource Size</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {metrics.resourceSize ? `${Math.round(metrics.resourceSize / 1024)}KB` : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Memory Usage */}
        {metrics?.memoryUsage && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Memory Usage</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">Used Memory</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">Memory Limit</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.memoryLimit ? `${Math.round(metrics.memoryLimit / 1024 / 1024)}MB` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Monitor Toggle */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Performance Monitor</h2>
              <p className="text-gray-600">Toggle the floating performance monitor</p>
            </div>
            
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-4 py-2 rounded-md font-medium ${
                isMonitoring
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isMonitoring ? 'Hide Monitor' : 'Show Monitor'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Performance Monitor */}
      <PerformanceMonitor 
        enabled={isMonitoring}
        showMetrics={isMonitoring}
        onMetricsUpdate={(newMetrics) => {
          console.log('Performance metrics updated:', newMetrics);
        }}
      />
    </div>
  );
}
