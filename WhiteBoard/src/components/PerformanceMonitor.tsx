'use client'

import React, { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  interactionTime: number
  memoryUsage: number
  connectionQuality: 'good' | 'fair' | 'poor'
  lastUpdate: Date
}

/**
 * PerformanceMonitor Component
 * 
 * Modern, stylish performance monitor positioned at bottom left.
 * Features glass morphism design with gradient accents and smooth animations.
 */
export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    connectionQuality: 'good',
    lastUpdate: new Date()
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Measure initial load time
    const loadTime = performance.now()
    setMetrics(prev => ({ ...prev, loadTime }))

    // Monitor memory usage
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
        if (memory) {
          const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
          setMetrics(prev => ({ ...prev, memoryUsage }))
        }
      }
    }

    // Monitor connection quality
    const updateConnectionQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator as { connection?: { effectiveType: string } }).connection
        if (connection?.effectiveType) {
          const effectiveType = connection.effectiveType
          
          let quality: 'good' | 'fair' | 'poor' = 'good'
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            quality = 'poor'
          } else if (effectiveType === '3g') {
            quality = 'fair'
          }
          
          setMetrics(prev => ({ ...prev, connectionQuality: quality }))
        }
      }
    }

    // Update metrics periodically
    const interval = setInterval(() => {
      updateMemoryUsage()
      updateConnectionQuality()
      setMetrics(prev => ({ ...prev, lastUpdate: new Date() }))
    }, 5000)

    // Monitor interaction times
    const measureInteraction = () => {
      const start = performance.now()
      
      // Simulate interaction measurement
      requestAnimationFrame(() => {
        const end = performance.now()
        const interactionTime = end - start
        setMetrics(prev => ({ ...prev, interactionTime }))
      })
    }

    // Add event listeners for interaction monitoring
    document.addEventListener('click', measureInteraction)
    document.addEventListener('keydown', measureInteraction)
    document.addEventListener('mousemove', measureInteraction)

    return () => {
      clearInterval(interval)
      document.removeEventListener('click', measureInteraction)
      document.removeEventListener('keydown', measureInteraction)
      document.removeEventListener('mousemove', measureInteraction)
    }
  }, [])

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'good': return 'text-emerald-600'
      case 'fair': return 'text-amber-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getConnectionQualityBg = (quality: string) => {
    switch (quality) {
      case 'good': return 'bg-emerald-500'
      case 'fair': return 'bg-amber-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getConnectionQualityIcon = (quality: string) => {
    switch (quality) {
      case 'good': return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
      case 'fair': return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
      case 'poor': return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
      default: return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-[9999] w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 backdrop-blur-sm border border-white/20"
        title="Show Performance Monitor"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 9999
        }}
      >
        <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    )
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-[9999] bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 min-w-80 max-w-sm"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 9999
      }}
    >
      <style jsx>{`
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.3s ease-out forwards;
        }
        
        .metric-card {
          transition: all 0.2s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
      <div className="animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Performance</h3>
              <p className="text-xs text-gray-500">Real-time metrics</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Load Time */}
          <div className="metric-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700">Load Time</span>
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-blue-900">{metrics.loadTime.toFixed(0)}ms</div>
          </div>

          {/* Interaction Time */}
          <div className="metric-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-700">Response</span>
              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-purple-900">{metrics.interactionTime.toFixed(0)}ms</div>
          </div>

          {/* Memory Usage */}
          <div className="metric-card bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-emerald-700">Memory</span>
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="text-lg font-bold text-emerald-900">{(metrics.memoryUsage * 100).toFixed(1)}%</div>
          </div>

          {/* Connection Quality */}
          <div className="metric-card bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 border border-amber-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-700">Connection</span>
              <div className={`w-3 h-3 ${getConnectionQualityBg(metrics.connectionQuality)} rounded-full flex items-center justify-center`}>
                {getConnectionQualityIcon(metrics.connectionQuality)}
              </div>
            </div>
            <div className={`text-lg font-bold capitalize ${getConnectionQualityColor(metrics.connectionQuality)}`}>
              {metrics.connectionQuality}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Last updated</span>
            <span className="font-mono">{metrics.lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Performance Warnings */}
        {(metrics.loadTime > 3000 || metrics.interactionTime > 100 || metrics.memoryUsage > 0.8 || metrics.connectionQuality === 'poor') && (
          <div className="mt-4 space-y-2">
            {metrics.loadTime > 3000 && (
              <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-amber-800">Slow load time ({metrics.loadTime.toFixed(0)}ms)</span>
              </div>
            )}

            {metrics.interactionTime > 100 && (
              <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-amber-800">Slow response ({metrics.interactionTime.toFixed(0)}ms)</span>
              </div>
            )}

            {metrics.memoryUsage > 0.8 && (
              <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-red-800">High memory usage ({(metrics.memoryUsage * 100).toFixed(1)}%)</span>
              </div>
            )}

            {metrics.connectionQuality === 'poor' && (
              <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-red-800">Poor connection quality</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
