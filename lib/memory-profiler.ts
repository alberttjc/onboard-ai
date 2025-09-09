// /**
//  * Memory Profiler and Leak Detection Utility
//  * Provides advanced memory monitoring and leak detection for the Live API Console
//  */

// import React, { useState, useEffect, useRef } from 'react';

// interface MemorySnapshot {
//   timestamp: number;
//   heapUsed: number;
//   heapTotal: number;
//   heapLimit: number;
//   external: number;
//   arrayBuffers: number;
// }

// interface MemoryLeak {
//   type: 'growing_heap' | 'stuck_buffers' | 'event_listeners' | 'dom_nodes';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   description: string;
//   recommendation: string;
//   detectedAt: number;
// }

// interface ComponentMemoryProfile {
//   componentName: string;
//   renderCount: number;
//   averageRenderTime: number;
//   memoryDelta: number;
//   lastProfiledAt: number;
// }

// class AdvancedMemoryProfiler {
//   private snapshots: MemorySnapshot[] = [];
//   private componentProfiles: Map<string, ComponentMemoryProfile> = new Map();
//   private leaks: MemoryLeak[] = [];
//   private observers: PerformanceObserver[] = [];
//   private isMonitoring: boolean = false;
//   private maxSnapshots: number = 100;
  
//   constructor() {
//     this.initializeObservers();
//   }

//   // Initialize performance observers
//   private initializeObservers(): void {
//     if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
//       return;
//     }

//     try {
//       // Monitor long tasks that could cause performance issues
//       const longTaskObserver = new PerformanceObserver((list) => {
//         for (const entry of list.getEntries()) {
//           if (entry.duration > 50) { // Tasks longer than 50ms
//             console.warn(`🐌 Long task detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
            
//             this.addLeak({
//               type: 'stuck_buffers',
//               severity: entry.duration > 100 ? 'high' : 'medium',
//               description: `Long task: ${entry.name} (${entry.duration.toFixed(2)}ms)`,
//               recommendation: 'Consider breaking this task into smaller chunks or using setTimeout/requestIdleCallback',
//               detectedAt: Date.now()
//             });
//           }
//         }
//       });
      
//       longTaskObserver.observe({ entryTypes: ['longtask'] });
//       this.observers.push(longTaskObserver);

//       // Monitor measure performance
//       const measureObserver = new PerformanceObserver((list) => {
//         for (const entry of list.getEntries()) {
//           if (entry.duration > 16) { // Slower than 60fps
//             const componentName = entry.name.replace('-render', '');
//             this.updateComponentProfile(componentName, entry.duration);
//           }
//         }
//       });
      
//       measureObserver.observe({ entryTypes: ['measure'] });
//       this.observers.push(measureObserver);
      
//     } catch (error) {
//       console.warn('Failed to initialize performance observers:', error);
//     }
//   }

//   // Start memory monitoring
//   public startMonitoring(intervalMs: number = 5000): void {
//     if (this.isMonitoring) return;
    
//     this.isMonitoring = true;
//     console.log('🔍 Starting advanced memory monitoring...');
    
//     const monitor = () => {
//       if (!this.isMonitoring) return;
      
//       this.takeSnapshot();
//       this.detectLeaks();
      
//       setTimeout(monitor, intervalMs);
//     };
    
//     monitor();
//   }

//   // Stop memory monitoring
//   public stopMonitoring(): void {
//     this.isMonitoring = false;
//     this.observers.forEach(observer => observer.disconnect());
//     this.observers = [];
//     console.log('⏹️ Memory monitoring stopped');
//   }

//   // Take a memory snapshot
//   private takeSnapshot(): void {
//     if (typeof window === 'undefined' || !('performance' in window)) {
//       return;
//     }

//     const memory = (performance as any).memory;
//     if (!memory) return;

//     const snapshot: MemorySnapshot = {
//       timestamp: Date.now(),
//       heapUsed: memory.usedJSHeapSize,
//       heapTotal: memory.totalJSHeapSize,
//       heapLimit: memory.jsHeapSizeLimit,
//       external: 0, // Not available in browser
//       arrayBuffers: 0 // Would need manual tracking
//     };
    
//     this.snapshots.push(snapshot);
    
//     // Keep only recent snapshots
//     if (this.snapshots.length > this.maxSnapshots) {
//       this.snapshots.shift();
//     }
//   }

//   // Detect memory leaks based on snapshots
//   private detectLeaks(): void {
//     if (this.snapshots.length < 10) return; // Need enough data
    
//     const recent = this.snapshots.slice(-10);
//     const oldest = recent[0];
//     const newest = recent[recent.length - 1];
    
//     // Calculate memory growth rate
//     const timeDiff = newest.timestamp - oldest.timestamp;
//     const memoryGrowth = newest.heapUsed - oldest.heapUsed;
//     const growthRate = memoryGrowth / (timeDiff / 1000); // bytes per second
    
//     // Detect steadily growing heap (potential memory leak)
//     if (growthRate > 1024 * 100) { // Growing > 100KB/second
//       this.addLeak({
//         type: 'growing_heap',
//         severity: growthRate > 1024 * 500 ? 'critical' : 'high',
//         description: `Heap growing at ${Math.round(growthRate / 1024)}KB/s`,
//         recommendation: 'Check for unclosed event listeners, timers, or DOM references',
//         detectedAt: Date.now()
//       });
//     }
    
//     // Detect when approaching heap limit
//     const heapUsagePercent = (newest.heapUsed / newest.heapLimit) * 100;
//     if (heapUsagePercent > 85) {
//       this.addLeak({
//         type: 'growing_heap',
//         severity: heapUsagePercent > 95 ? 'critical' : 'high',
//         description: `Heap usage at ${heapUsagePercent.toFixed(1)}% of limit`,
//         recommendation: 'Memory usage is critically high. Check for memory leaks and optimize memory usage.',
//         detectedAt: Date.now()
//       });
//     }
//   }

//   // Add a detected leak
//   private addLeak(leak: MemoryLeak): void {
//     // Avoid duplicate leaks
//     const exists = this.leaks.some(existing => 
//       existing.type === leak.type && 
//       existing.description === leak.description &&
//       Date.now() - existing.detectedAt < 30000 // Within 30 seconds
//     );
    
//     if (!exists) {
//       this.leaks.push(leak);
//       console.warn(`🚨 Memory leak detected:`, leak);
      
//       // Keep only recent leaks
//       if (this.leaks.length > 20) {
//         this.leaks.shift();
//       }
//     }
//   }

//   // Update component performance profile
//   private updateComponentProfile(componentName: string, renderTime: number): void {
//     const existing = this.componentProfiles.get(componentName);
    
//     if (existing) {
//       existing.renderCount++;
//       existing.averageRenderTime = 
//         (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount;
//       existing.lastProfiledAt = Date.now();
//     } else {
//       this.componentProfiles.set(componentName, {
//         componentName,
//         renderCount: 1,
//         averageRenderTime: renderTime,
//         memoryDelta: 0,
//         lastProfiledAt: Date.now()
//       });
//     }
//   }

//   // Get current memory usage in MB
//   public getCurrentMemoryUsage(): number {
//     if (typeof window === 'undefined' || !('performance' in window)) {
//       return 0;
//     }

//     const memory = (performance as any).memory;
//     return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
//   }

//   // Get memory growth trend
//   public getMemoryTrend(): 'stable' | 'growing' | 'shrinking' | 'unknown' {
//     if (this.snapshots.length < 5) return 'unknown';
    
//     const recent = this.snapshots.slice(-5);
//     const growthRates = [];
    
//     for (let i = 1; i < recent.length; i++) {
//       const current = recent[i];
//       const previous = recent[i - 1];
//       const timeDiff = current.timestamp - previous.timestamp;
//       const memoryDiff = current.heapUsed - previous.heapUsed;
//       growthRates.push(memoryDiff / timeDiff);
//     }
    
//     const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    
//     if (Math.abs(avgGrowthRate) < 0.01) return 'stable';
//     return avgGrowthRate > 0 ? 'growing' : 'shrinking';
//   }

//   // Get detailed memory report
//   public getMemoryReport(): {
//     current: MemorySnapshot | null;
//     trend: string;
//     leaks: MemoryLeak[];
//     componentProfiles: ComponentMemoryProfile[];
//     recommendations: string[];
//   } {
//     const current = this.snapshots[this.snapshots.length - 1] || null;
//     const trend = this.getMemoryTrend();
//     const componentProfiles = Array.from(this.componentProfiles.values())
//       .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
//       .slice(0, 10); // Top 10 slowest components
    
//     const recommendations = this.generateRecommendations();
    
//     return {
//       current,
//       trend,
//       leaks: this.leaks.slice(-10), // Recent leaks only
//       componentProfiles,
//       recommendations
//     };
//   }

//   // Generate performance recommendations
//   private generateRecommendations(): string[] {
//     const recommendations: string[] = [];
    
//     // Check for slow components
//     const slowComponents = Array.from(this.componentProfiles.values())
//       .filter(profile => profile.averageRenderTime > 16);
    
//     if (slowComponents.length > 0) {
//       recommendations.push(
//         `Optimize slow components: ${slowComponents.map(c => c.componentName).join(', ')}`
//       );
//     }
    
//     // Check memory usage
//     const currentUsage = this.getCurrentMemoryUsage();
//     if (currentUsage > 100) {
//       recommendations.push(
//         'High memory usage detected. Consider implementing lazy loading or component cleanup.'
//       );
//     }
    
//     // Check for memory leaks
//     const criticalLeaks = this.leaks.filter(leak => leak.severity === 'critical');
//     if (criticalLeaks.length > 0) {
//       recommendations.push(
//         'Critical memory leaks detected. Immediate action required to prevent crashes.'
//       );
//     }
    
//     // Check trends
//     const trend = this.getMemoryTrend();
//     if (trend === 'growing') {
//       recommendations.push(
//         'Memory usage is steadily growing. Check for unclosed resources or event listeners.'
//       );
//     }
    
//     return recommendations;
//   }

//   // Force garbage collection (if available)
//   public forceGarbageCollection(): boolean {
//     if (typeof window !== 'undefined' && 'gc' in window) {
//       try {
//         (window as any).gc();
//         console.log('🧹 Forced garbage collection');
//         return true;
//       } catch (error) {
//         console.warn('Failed to force garbage collection:', error);
//       }
//     }
//     return false;
//   }

//   // Clear all monitoring data
//   public clearData(): void {
//     this.snapshots = [];
//     this.componentProfiles.clear();
//     this.leaks = [];
//     console.log('🧹 Memory profiler data cleared');
//   }

//   // Export data for analysis
//   public exportData(): string {
//     const data = {
//       snapshots: this.snapshots,
//       componentProfiles: Array.from(this.componentProfiles.entries()),
//       leaks: this.leaks,
//       exportedAt: new Date().toISOString()
//     };
    
//     return JSON.stringify(data, null, 2);
//   }

//   // Import data from previous session
//   public importData(jsonData: string): void {
//     try {
//       const data = JSON.parse(jsonData);
      
//       if (data.snapshots) {
//         this.snapshots = data.snapshots.slice(-this.maxSnapshots);
//       }
      
//       if (data.componentProfiles) {
//         this.componentProfiles = new Map(data.componentProfiles);
//       }
      
//       if (data.leaks) {
//         this.leaks = data.leaks;
//       }
      
//       console.log('📊 Memory profiler data imported successfully');
//     } catch (error) {
//       console.error('Failed to import memory profiler data:', error);
//     }
//   }
// }

// // Global memory profiler instance
// let globalMemoryProfiler: AdvancedMemoryProfiler | null = null;

// // Get or create the global memory profiler
// export function getMemoryProfiler(): AdvancedMemoryProfiler {
//   if (!globalMemoryProfiler) {
//     globalMemoryProfiler = new AdvancedMemoryProfiler();
    
//     // Auto-start monitoring in development
//     if (process.env.NODE_ENV === 'development') {
//       globalMemoryProfiler.startMonitoring(3000); // Every 3 seconds in dev
//     }
//   }
  
//   return globalMemoryProfiler;
// }

// // React hook for memory monitoring
// export function useMemoryProfiler() {
//   const profiler = getMemoryProfiler();
  
//   const [memoryReport, setMemoryReport] = useState(profiler.getMemoryReport());
  
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setMemoryReport(profiler.getMemoryReport());
//     }, 5000); // Update every 5 seconds
    
//     return () => clearInterval(interval);
//   }, [profiler]);
  
//   return {
//     ...memoryReport,
//     forceGC: () => profiler.forceGarbageCollection(),
//     clearData: () => profiler.clearData(),
//     exportData: () => profiler.exportData(),
//     importData: (data: string) => profiler.importData(data)
//   };
// }

// // Component wrapper for automatic memory profiling
// export function withMemoryProfiler<P extends object>(
//   WrappedComponent: React.ComponentType<P>,
//   displayName?: string
// ) {
//   const ProfiledComponent = React.forwardRef<any, P>((props, ref) => {
//     const componentName = displayName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';
//     const profiler = getMemoryProfiler();
//     const renderStartRef = useRef<number>(0);
    
//     // Measure render start
//     renderStartRef.current = performance.now();
//     performance.mark(`${componentName}-render-start`);
    
//     // Measure render end
//     useEffect(() => {
//       const renderTime = performance.now() - renderStartRef.current;
//       performance.mark(`${componentName}-render-end`);
//       performance.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`);
      
//       // Update component profile
//       profiler.updateComponentProfile(componentName, renderTime);
//     });
    
//     return <WrappedComponent {...props} ref={ref} />;
//   });
  
//   ProfiledComponent.displayName = `withMemoryProfiler(${displayName || WrappedComponent.displayName || WrappedComponent.name})`;
  
//   return ProfiledComponent;
// }

// // Memory leak detection utilities
// export const MemoryUtils = {
//   // Check for common memory leak patterns
//   detectEventListenerLeaks(): number {
//     if (typeof window === 'undefined') return 0;
    
//     // This is a simplified check - in reality, tracking event listeners is complex
//     const elementsWithListeners = document.querySelectorAll('*');
//     let suspiciousElements = 0;
    
//     elementsWithListeners.forEach(element => {
//       // Check for elements with many event listeners (potential leak)
//       const eventTypes = ['click', 'keydown', 'resize', 'scroll', 'load'];
//       let listenerCount = 0;
      
//       eventTypes.forEach(type => {
//         try {
//           // This is a simplified check - actual implementation would be more complex
//           if ((element as any)[`on${type}`]) listenerCount++;
//         } catch (e) {
//           // Ignore errors
//         }
//       });
      
//       if (listenerCount > 3) {
//         suspiciousElements++;
//       }
//     });
    
//     return suspiciousElements;
//   },

//   // Check for DOM node leaks
//   detectDOMNodeLeaks(): { nodeCount: number; suspiciousNodes: number } {
//     if (typeof document === 'undefined') return { nodeCount: 0, suspiciousNodes: 0 };
    
//     const allNodes = document.querySelectorAll('*');
//     const nodeCount = allNodes.length;
    
//     // Check for suspicious patterns
//     let suspiciousNodes = 0;
    
//     allNodes.forEach(node => {
//       // Check for nodes with many children (potential bloat)
//       if (node.children.length > 100) {
//         suspiciousNodes++;
//       }
      
//       // Check for nodes with long text content (potential memory bloat)
//       if (node.textContent && node.textContent.length > 10000) {
//         suspiciousNodes++;
//       }
//     });
    
//     return { nodeCount, suspiciousNodes };
//   },

//   // Monitor audio/video resources
//   monitorMediaResources(): { activeStreams: number; activeContexts: number } {
//     if (typeof window === 'undefined') return { activeStreams: 0, activeContexts: 0 };
    
//     let activeStreams = 0;
//     let activeContexts = 0;
    
//     // Count active media streams (simplified check)
//     try {
//       if ('MediaStream' in window) {
//         // This would require actual tracking in the application
//         // For now, we'll use a placeholder implementation
//         activeStreams = 0; // Would need to track actual streams
//       }
      
//       if ('AudioContext' in window) {
//         // This would also require actual tracking
//         activeContexts = 0; // Would need to track actual contexts
//       }
//     } catch (error) {
//       console.warn('Failed to monitor media resources:', error);
//     }
    
//     return { activeStreams, activeContexts };
//   }
// };

// // Cleanup function for page unload
// if (typeof window !== 'undefined') {
//   window.addEventListener('beforeunload', () => {
//     if (globalMemoryProfiler) {
//       globalMemoryProfiler.stopMonitoring();
//     }
//   });
// }

// export default AdvancedMemoryProfiler;
