import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor, APIPerformanceTracker } from '../../../../src/lib/performance/monitor';
import { addSecurityHeaders, logSecurityEvent } from '../../../../src/lib/security';

export async function GET(request: NextRequest) {
  try {
    const monitor = PerformanceMonitor.getInstance();
    const summary = monitor.getPerformanceSummary();
    const apiMetrics = monitor.getAPIMetrics();
    const geminiMetrics = monitor.getGeminiMetrics();

    const response = {
      success: true,
      performance: {
        summary,
        apiMetrics: apiMetrics.slice(-50), // Last 50 API calls
        geminiMetrics: geminiMetrics.slice(-50), // Last 50 Gemini calls
        timestamp: new Date().toISOString()
      }
    };

    logSecurityEvent('PERFORMANCE_METRICS_REQUESTED', request);

    return addSecurityHeaders(NextResponse.json(response));

  } catch (error) {
    console.error('Performance metrics error:', error);
    logSecurityEvent('PERFORMANCE_METRICS_ERROR', request, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return addSecurityHeaders(NextResponse.json(
      {
        error: 'Failed to retrieve performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const monitor = PerformanceMonitor.getInstance();
    monitor.clearMetrics();

    logSecurityEvent('PERFORMANCE_METRICS_CLEARED', request);

    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Performance metrics cleared',
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Clear metrics error:', error);
    logSecurityEvent('CLEAR_METRICS_ERROR', request, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return addSecurityHeaders(NextResponse.json(
      {
        error: 'Failed to clear performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}
