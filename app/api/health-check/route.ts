/**
 * Health Check API Route for Performance Monitoring
 * Provides lightweight endpoint for latency testing
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple health check with minimal overhead
export async function GET(request: NextRequest) {
  const start = Date.now();
  
  // Basic health checks
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    memory: process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    } : null,
    responseTime: Date.now() - start
  };
  
  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

// HEAD request for latency testing only
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': String(Date.now())
    }
  });
}
