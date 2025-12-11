#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

console.log('🔍 Performance Monitor');
console.log('=====================\n');

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.startTimes = new Map();
  }
  
  start(label) {
    this.startTimes.set(label, performance.now());
  }
  
  end(label) {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      console.warn(`No start time found for ${label}`);
      return;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.push({
      label,
      duration,
      timestamp: new Date().toISOString()
    });
    
    this.startTimes.delete(label);
    return duration;
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  report() {
    console.log('📊 Performance Report:');
    console.log('======================');
    
    this.metrics.forEach(metric => {
      console.log(`${metric.label}: ${metric.duration.toFixed(2)}ms`);
    });
    
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    console.log(`\nTotal monitored time: ${totalTime.toFixed(2)}ms`);
    
    return this.metrics;
  }
  
  async saveReport(filename = 'performance-report.json') {
    const report = {
      timestamp: new Date().toISOString(),
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory_usage: process.memoryUsage(),
      metrics: this.metrics,
      summary: {
        total_duration: this.metrics.reduce((sum, m) => sum + m.duration, 0),
        average_duration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
        fastest_operation: this.metrics.reduce((min, m) => m.duration < min.duration ? m : min),
        slowest_operation: this.metrics.reduce((max, m) => m.duration > max.duration ? m : max)
      }
    };
    
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${filename}`);
  }
}

// Main monitoring function
async function runPerformanceMonitoring() {
  const monitor = new PerformanceMonitor();
  
  try {
    // Monitor module loading
    monitor.start('Module Loading');
    const [
      { loadConfig },
      { createLogger },
      { getToolDefinitions, getToolHandler }
    ] = await Promise.all([
      import('../dist/utils/config.js'),
      import('../dist/utils/logger.js'),
      import('../dist/tools/index.js')
    ]);
    
    // Get the actual available tool handler
    const nlmCtCodesHandler = getToolHandler('nlm_ct_codes');
    monitor.end('Module Loading');
    
    // Monitor config operations
    monitor.start('Config Loading');
    const config = loadConfig();
    monitor.end('Config Loading');
    
    // Monitor logger creation
    monitor.start('Logger Creation');
    const logger = createLogger('info', false);
    monitor.end('Logger Creation');
    
    // Monitor tool discovery
    monitor.start('Tool Discovery');
    const toolDefs = getToolDefinitions();
    const clinicalTool = getToolHandler('nlm_ct_codes');
    monitor.end('Tool Discovery');
    
    // Monitor tool operations
    if (nlmCtCodesHandler) {
      monitor.start('Clinical Tool - Simple Search');
      await nlmCtCodesHandler({ method: 'icd-10-cm', terms: 'diabetes', maxList: 5 });
      monitor.end('Clinical Tool - Simple Search');
    
      monitor.start('Clinical Tool - Complex Search');
      await nlmCtCodesHandler({ method: 'npi-organizations', terms: 'hospital', maxList: 10 });
      monitor.end('Clinical Tool - Complex Search');
    
      monitor.start('Clinical Tool - Drug Search');
      await nlmCtCodesHandler({ method: 'rx-terms', terms: 'aspirin', maxList: 5 });
      monitor.end('Clinical Tool - Drug Search');
    }
    
    // Monitor batch operations
    if (nlmCtCodesHandler) {
      monitor.start('Batch Clinical Searches');
      const batchPromises = Array.from({ length: 10 }, (_, i) => {
        const terms = ['diabetes', 'hypertension', 'pneumonia', 'fracture', 'infection'];
        return nlmCtCodesHandler({ method: 'icd-10-cm', terms: terms[i % terms.length], maxList: 3 });
      });
    await Promise.all(batchPromises);
      monitor.end('Batch Clinical Searches');
    }
    
    // Monitor memory usage during operations
    const memBefore = process.memoryUsage();
    
    monitor.start('Memory Intensive Operations');
    if (nlmCtCodesHandler) {
      const clinicalTerms = ['diabetes', 'hypertension', 'pneumonia', 'fracture', 'infection', 'cancer', 'asthma', 'arthritis'];
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        method: 'icd-10-cm',
        terms: clinicalTerms[i % clinicalTerms.length],
        maxList: 5
    }));
    
      await Promise.all(largeDataset.map(data => nlmCtCodesHandler(data)));
    }
    monitor.end('Memory Intensive Operations');
    
    const memAfter = process.memoryUsage();
    
    // Display real-time metrics
    console.log('💡 Real-time Performance Insights:');
    console.log('===================================');
    
    const metrics = monitor.getMetrics();
    const moduleLoadTime = metrics.find(m => m.label === 'Module Loading');
    const batchTime = metrics.find(m => m.label === 'Batch Clinical Searches');
    
    if (moduleLoadTime && moduleLoadTime.duration > 100) {
      console.log('⚠️  Module loading seems slow (>100ms)');
    } else {
      console.log('✅ Module loading performance is good');
    }
    
    if (batchTime) {
      const opsPerMs = 10 / batchTime.duration;
      console.log(`📈 Batch search throughput: ${(opsPerMs * 1000).toFixed(0)} searches/sec`);
    }
    
    // Memory analysis
    const heapGrowth = memAfter.heapUsed - memBefore.heapUsed;
    console.log(`🧠 Memory analysis:`);
    console.log(`   Heap before: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap after: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Growth: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB`);
    
    if (heapGrowth > 10 * 1024 * 1024) { // 10MB
      console.log('⚠️  Significant memory usage detected');
    } else {
      console.log('✅ Memory usage within normal range');
    }
    
    // Generate final report
    monitor.report();
    await monitor.saveReport();
    
    // Performance recommendations
    console.log('\n🚀 Performance Recommendations:');
    console.log('================================');
    
    const slowOperations = metrics.filter(m => m.duration > 50);
    if (slowOperations.length > 0) {
      console.log('🔍 Operations taking >50ms:');
      slowOperations.forEach(op => {
        console.log(`   - ${op.label}: ${op.duration.toFixed(2)}ms`);
      });
    }
    
    const fastestOp = metrics.reduce((min, m) => m.duration < min.duration ? m : min);
    const slowestOp = metrics.reduce((max, m) => m.duration > max.duration ? m : max);
    
    console.log(`🏆 Fastest operation: ${fastestOp.label} (${fastestOp.duration.toFixed(2)}ms)`);
    console.log(`🐌 Slowest operation: ${slowestOp.label} (${slowestOp.duration.toFixed(2)}ms)`);
    
    if (slowestOp.duration > fastestOp.duration * 10) {
      console.log('💡 Consider optimizing the slowest operation');
    }
    
    // Check for potential improvements
    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    if (avgDuration > 20) {
      console.log('💡 Average operation time is high - consider async optimizations');
    }
    
    console.log('\n✅ Performance monitoring completed!');
    
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    process.exit(1);
  }
}

// CPU monitoring helper
function startCPUMonitoring() {
  const startUsage = process.cpuUsage();
  
  return () => {
    const usage = process.cpuUsage(startUsage);
    return {
      user: usage.user / 1000, // Convert to milliseconds
      system: usage.system / 1000
    };
  };
}

// Enhanced monitoring with CPU tracking
async function runEnhancedMonitoring() {
  const getCPUUsage = startCPUMonitoring();
  
  console.log('🔬 Enhanced Performance Monitoring');
  console.log('==================================\n');
  
  await runPerformanceMonitoring();
  
  const cpuUsage = getCPUUsage();
  console.log('\n⚡ CPU Usage Summary:');
  console.log(`   User CPU time: ${cpuUsage.user.toFixed(2)}ms`);
  console.log(`   System CPU time: ${cpuUsage.system.toFixed(2)}ms`);
  console.log(`   Total CPU time: ${(cpuUsage.user + cpuUsage.system).toFixed(2)}ms`);
}

// Run monitoring
if (process.argv.includes('--enhanced')) {
  runEnhancedMonitoring();
} else {
  runPerformanceMonitoring();
} 