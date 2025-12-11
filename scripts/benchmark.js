#!/usr/bin/env node

import Benchmark from 'benchmark';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

// ES module support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine output directory: current dir for CI, temp dir for local development
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const outputDir = isCI ? '.' : './temp';

// Ensure output directory exists
if (!isCI) {
  mkdirSync(outputDir, { recursive: true });
}

console.log(`📁 Output directory: ${path.resolve(outputDir)} ${isCI ? '(CI mode)' : '(local mode)'}`);

// Import our tools for benchmarking
import { getToolDefinitions, getToolHandler } from '../dist/tools/index.js';
import { loadConfig } from '../dist/utils/config.js';
import { createLogger } from '../dist/utils/logger.js';

const suite = new Benchmark.Suite();
const results = [];

// Create a mock handler for performance testing (no actual API calls)
const mockNlmCtCodesHandler = async (params) => {
  // Simulate some processing time without network calls
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        results: Array.from({ length: params.maxList || 5 }, (_, i) => ({
          code: `MOCK${i + 1}`,
          name: `Mock ${params.method} result ${i + 1} for "${params.terms}"`,
          display: `Mock display text ${i + 1}`
        })),
        total: params.maxList || 5,
        method: params.method,
        terms: params.terms
      });
    }, 1); // Minimal delay to simulate processing
  });
};

// Helper function to add benchmark results
function addResult(name, benchmark) {
  const result = {
    name,
    ops: Math.round(benchmark.hz),
    rme: Math.round(benchmark.stats.rme * 100) / 100,
    samples: benchmark.stats.sample.length,
    mean: Math.round(benchmark.stats.mean * 1000000) / 1000, // Convert to microseconds
    faster: '',
    slower: ''
  };
  results.push(result);
  console.log(`${name}: ${Math.round(benchmark.hz).toLocaleString()} ops/sec ±${Math.round(benchmark.stats.rme * 100) / 100}%`);
}

// Benchmark tool operations using mock handler for consistent performance testing
suite.add('Clinical Tool - ICD-10-CM Search', {
  defer: true,
  fn: function(deferred) {
    mockNlmCtCodesHandler({ method: 'icd-10-cm', terms: 'hypertension', maxList: 5 })
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

suite.add('Clinical Tool - HCPCS Search', {
  defer: true,
  fn: function(deferred) {
    mockNlmCtCodesHandler({ method: 'hcpcs-LII', terms: 'wheelchair', maxList: 5 })
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

suite.add('Clinical Tool - NPI Search', {
  defer: true,
  fn: function(deferred) {
    mockNlmCtCodesHandler({ method: 'npi-organizations', terms: 'hospital', maxList: 5 })
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

suite.add('Clinical Tool - Drug Search', {
  defer: true,
  fn: function(deferred) {
    mockNlmCtCodesHandler({ method: 'rx-terms', terms: 'aspirin', maxList: 5 })
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

// Benchmark tool discovery
suite.add('Tool Discovery - getToolDefinitions', function() {
  getToolDefinitions();
});

suite.add('Tool Discovery - getToolHandler', function() {
  getToolHandler('nlm_ct_codes');
  getToolHandler('nonexistent_tool');
});

// Benchmark configuration loading
suite.add('Config Loading', function() {
  loadConfig();
});

// Benchmark logger creation
suite.add('Logger Creation', function() {
  createLogger('info', false);
});

// Large data processing benchmarks
const clinicalTerms = ['diabetes', 'hypertension', 'pneumonia', 'fracture', 'infection'];

suite.add('Batch Clinical Searches (10 items)', {
  defer: true,
  fn: function(deferred) {
    const searches = clinicalTerms.slice(0, 10).map(term => 
      mockNlmCtCodesHandler({ method: 'icd-10-cm', terms: term, maxList: 3 })
    );
    Promise.all(searches)
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

// Different method benchmarks
const clinicalMethods = ['icd-10-cm', 'hcpcs-LII', 'rx-terms', 'conditions'];

suite.add('Multi-Method Clinical Searches (4 methods)', {
  defer: true,
  fn: function(deferred) {
    const searches = clinicalMethods.map(method => 
      mockNlmCtCodesHandler({ method, terms: 'test', maxList: 3 })
    );
    Promise.all(searches)
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

// Error handling performance (test the actual error handling logic)
const realNlmCtCodesHandler = getToolHandler('nlm_ct_codes');

suite.add('Error Handling - Invalid Method', {
  defer: true,
  fn: function(deferred) {
    if (realNlmCtCodesHandler) {
      realNlmCtCodesHandler({ method: 'invalid-method', terms: 'test' })
        .catch(() => deferred.resolve());
    } else {
      deferred.resolve();
    }
  }
});

suite.add('Error Handling - Missing Required Parameters', {
  defer: true,
  fn: function(deferred) {
    if (realNlmCtCodesHandler) {
      realNlmCtCodesHandler({ method: 'icd-10-cm' }) // Missing required 'terms' parameter
      .catch(() => deferred.resolve());
    } else {
      deferred.resolve();
    }
  }
});

// Memory usage benchmark
suite.add('Memory Usage - Large Result Set', {
  defer: true,
  fn: function(deferred) {
    mockNlmCtCodesHandler({ method: 'icd-10-cm', terms: 'test', maxList: 100 })
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

// JSON processing benchmark
suite.add('JSON Processing - Complex Response', function() {
  const complexResponse = {
    results: Array.from({ length: 50 }, (_, i) => ({
      code: `TEST${i}`,
      name: `Test condition ${i}`,
      description: `A test medical condition with ID ${i}`,
      metadata: { id: i, category: 'test', active: true }
    })),
    total: 50,
    method: 'icd-10-cm',
    terms: 'benchmark'
  };
  
  // Process the JSON (stringify and parse to simulate real usage)
  JSON.parse(JSON.stringify(complexResponse));
});

// Set a global timeout to prevent infinite runs
const benchmarkTimeout = setTimeout(() => {
  console.error('⚠️ Benchmark timeout reached (5 minutes), stopping...');
  process.exit(1);
}, 5 * 60 * 1000); // 5 minutes

// Run the benchmark suite
console.log('🚀 Starting Performance Benchmarks...\n');
console.log('==========================================');
console.log('📝 Note: Using mock implementations for consistent performance testing');
console.log('   Real API performance should be tested separately in integration tests\n');

suite
  .on('cycle', function(event) {
    addResult(event.target.name, event.target);
  })
  .on('error', function(event) {
    console.error('Benchmark error:', event.target.error);
  })
  .on('complete', function() {
    clearTimeout(benchmarkTimeout);
    console.log('\n==========================================');
    console.log('📊 Benchmark Results Summary:');
    console.log('==========================================\n');
    
    // Sort results by operations per second (descending)
    results.sort((a, b) => b.ops - a.ops);
    
    // Calculate relative performance
    const fastest = results[0];
    results.forEach((result, index) => {
      if (index === 0) {
        result.faster = 'baseline (fastest)';
      } else {
        const times = fastest.ops / result.ops;
        result.slower = `${Math.round(times * 100) / 100}x slower`;
      }
    });
    
    // Display formatted results
    console.log('Rank | Operation                              | Ops/sec    | ±RME    | Relative Performance');
    console.log('-----|----------------------------------------|------------|---------|--------------------');
    
    results.forEach((result, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = result.name.padEnd(38);
      const ops = result.ops.toLocaleString().padStart(10);
      const rme = `±${result.rme}%`.padStart(7);
      const relative = result.faster || result.slower;
      
      console.log(`${rank} | ${name} | ${ops} | ${rme} | ${relative}`);
    });
    
    // Convert results to GitHub Action benchmark format
    const githubBenchmarkData = results.map(result => ({
      name: result.name,
      unit: 'ops/sec',
      value: result.ops,
      range: result.rme ? `±${result.rme}%` : undefined,
      extra: `samples: ${result.samples}\nmean: ${result.mean}ms${result.faster ? `\nperformance: ${result.faster}` : ''}${result.slower ? `\nperformance: ${result.slower}` : ''}`
    }));
    
    // Save results to JSON for CI/CD (GitHub Action format)
    fs.writeFileSync(
      path.join(outputDir, 'benchmark-results.json'),
      JSON.stringify(githubBenchmarkData, null, 2)
    );
    
    // Also save detailed results for local analysis
    const detailedResults = {
      timestamp: new Date().toISOString(),
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      results: results,
      summary: {
        fastest: fastest.name,
        fastest_ops: fastest.ops,
        total_benchmarks: results.length,
        total_samples: results.reduce((sum, r) => sum + r.samples, 0)
      }
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'benchmark-results-detailed.json'),
      JSON.stringify(detailedResults, null, 2)
    );
    
    console.log('\n✅ Benchmarks completed!');
    console.log(`📁 GitHub Action results saved to: benchmark-results.json`);
    console.log(`📊 Detailed results saved to: benchmark-results-detailed.json`);
    console.log(`🎯 Fastest operation: ${fastest.name} (${fastest.ops.toLocaleString()} ops/sec)`);
    
    // Performance insights
    console.log('\n💡 Performance Insights:');
    if (fastest.ops > 1000000) {
      console.log('🟢 Excellent performance detected (>1M ops/sec)');
    } else if (fastest.ops > 100000) {
      console.log('🟡 Good performance (>100K ops/sec)');
    } else if (fastest.ops > 10000) {
      console.log('🟠 Moderate performance (>10K ops/sec)');
    } else {
      console.log('🔴 Performance needs optimization (<10K ops/sec)');
    }
    
    const asyncOps = results.filter(r => r.name.includes('Tool') || r.name.includes('Batch'));
    const syncOps = results.filter(r => !r.name.includes('Tool') && !r.name.includes('Batch'));
    
    if (asyncOps.length > 0 && syncOps.length > 0) {
      const avgAsync = asyncOps.reduce((sum, r) => sum + r.ops, 0) / asyncOps.length;
      const avgSync = syncOps.reduce((sum, r) => sum + r.ops, 0) / syncOps.length;
      
      console.log(`📈 Async operations average: ${Math.round(avgAsync).toLocaleString()} ops/sec`);
      console.log(`⚡ Sync operations average: ${Math.round(avgSync).toLocaleString()} ops/sec`);
      
      if (avgSync > avgAsync * 10) {
        console.log('💭 Consider optimizing async operations for better performance');
      }
    }
  })
  .run({ async: true }); 