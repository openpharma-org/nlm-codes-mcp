#!/usr/bin/env node

import Benchmark from 'benchmark';
import fs from 'fs';
import path from 'path';
import { mkdirSync } from 'fs';

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

const suite = new Benchmark.Suite();

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

console.log('🔧 Tool Performance Benchmarks');
console.log('================================');
console.log('📝 Note: Using mock implementations for consistent performance testing');
console.log('   Real API performance should be tested separately in integration tests\n');

// Clinical tool comprehensive benchmarks
const clinicalMethods = ['icd-10-cm', 'hcpcs-LII', 'npi-organizations', 'rx-terms'];
const testTerms = [
  'diabetes',
  'hypertension',
  'pneumonia',
  'fracture',
  'infection'
];

clinicalMethods.forEach(method => {
  suite.add(`Clinical Tool - ${method} (simple)`, {
    defer: true,
    fn: function(deferred) {
      mockNlmCtCodesHandler({ method, terms: 'test', maxList: 5 })
        .then(() => deferred.resolve())
        .catch(() => deferred.resolve());
    }
  });
});

// Stress test with various search terms
testTerms.forEach((term, index) => {
  suite.add(`Clinical Tool - ICD-10-CM (term ${index + 1})`, {
    defer: true,
    fn: function(deferred) {
      mockNlmCtCodesHandler({ method: 'icd-10-cm', terms: term, maxList: 5 })
        .then(() => deferred.resolve())
        .catch(() => deferred.resolve());
    }
  });
});

// Clinical tool with different result set sizes
const resultSizes = [3, 10, 25, 50];

resultSizes.forEach((size, index) => {
  suite.add(`Clinical Tool - Result Size (${size} results)`, {
    defer: true,
    fn: function(deferred) {
      mockNlmCtCodesHandler({ method: 'icd-10-cm', terms: 'diabetes', maxList: size })
        .then(() => deferred.resolve())
        .catch(() => deferred.resolve());
    }
  });
});

// Tool discovery performance
suite.add('Tool Discovery - getToolDefinitions (repeated)', function() {
  for (let i = 0; i < 100; i++) {
    getToolDefinitions();
  }
});

suite.add('Tool Discovery - getToolHandler (cache test)', function() {
  const tools = ['nlm_ct_codes', 'nonexistent_tool'];
  for (let i = 0; i < 100; i++) {
    tools.forEach(tool => getToolHandler(tool));
  }
});

// Concurrent tool execution
suite.add('Concurrent Clinical Searches (10x)', {
  defer: true,
  fn: function(deferred) {
    const promises = Array.from({ length: 10 }, (_, i) => 
      mockNlmCtCodesHandler({ method: 'icd-10-cm', terms: `test${i}`, maxList: 3 })
    );
    Promise.all(promises)
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

suite.add('Concurrent Multi-Method Searches (5x)', {
  defer: true,
  fn: function(deferred) {
    const methods = ['icd-10-cm', 'hcpcs-LII', 'rx-terms', 'conditions', 'npi-organizations'];
    const promises = methods.map(method => 
      mockNlmCtCodesHandler({ method, terms: 'test', maxList: 3 })
    );
    Promise.all(promises)
      .then(() => deferred.resolve())
      .catch(() => deferred.resolve());
  }
});

// Error handling performance (test with real handler for actual error logic)
const realNlmCtCodesHandler = getToolHandler('nlm_ct_codes');

suite.add('Error Recovery - Invalid Operations', {
  defer: true,
  fn: function(deferred) {
    if (realNlmCtCodesHandler) {
    const invalidOps = [
        realNlmCtCodesHandler({ method: 'invalid-method', terms: 'test' }),
        realNlmCtCodesHandler({ method: 'icd-10-cm' }), // Missing required terms
        realNlmCtCodesHandler({ terms: 'test' }), // Missing required method
        realNlmCtCodesHandler({ method: 'icd-10-cm', terms: 'test', maxList: -1 }) // Invalid maxList
    ];
    
    Promise.allSettled(invalidOps)
      .then(() => deferred.resolve());
    } else {
      deferred.resolve();
    }
  }
});

// Data processing benchmarks
suite.add('JSON Processing - Large Dataset', function() {
  const largeDataset = {
    results: Array.from({ length: 1000 }, (_, i) => ({
      code: `CODE${i}`,
      name: `Medical condition ${i}`,
      description: `Description for condition ${i}`,
      metadata: { 
        id: i, 
        category: `category${i % 10}`, 
        active: i % 2 === 0,
        tags: [`tag${i % 5}`, `tag${i % 7}`]
      }
    })),
    total: 1000,
    method: 'icd-10-cm',
    terms: 'benchmark'
  };
  
  // Process the JSON (stringify and parse to simulate real usage)
  JSON.parse(JSON.stringify(largeDataset));
});

suite.add('Array Processing - Filtering and Mapping', function() {
  const data = Array.from({ length: 100 }, (_, i) => ({
    code: `CODE${i}`,
    name: `Condition ${i}`,
    active: i % 2 === 0
  }));
  
  // Simulate common data processing operations
  data
    .filter(item => item.active)
    .map(item => ({ ...item, displayName: `${item.code}: ${item.name}` }))
    .slice(0, 10);
});

// Set a global timeout to prevent infinite runs
const benchmarkTimeout = setTimeout(() => {
  console.error('⚠️ Benchmark timeout reached (5 minutes), stopping...');
  process.exit(1);
}, 5 * 60 * 1000); // 5 minutes

// Run benchmarks
suite
  .on('cycle', function(event) {
    const benchmark = event.target;
    const ops = Math.round(benchmark.hz).toLocaleString();
    const rme = Math.round(benchmark.stats.rme * 100) / 100;
    console.log(`${benchmark.name}: ${ops} ops/sec ±${rme}%`);
  })
  .on('error', function(event) {
    console.error('Benchmark error:', event.target.error);
  })
  .on('complete', function() {
    clearTimeout(benchmarkTimeout);
    console.log('\n🏁 All tool benchmarks completed!');
    
    // Convert results to the array format expected by github-action-benchmark
    const toolResults = [];
    
    // Add each benchmark result as an array entry
    this.forEach(function(bench) {
      if (!bench.error) {
        toolResults.push({
          name: bench.name,
          unit: 'ops/sec',
          value: bench.hz || bench.stats.mean || 0,
          range: bench.stats.rme ? bench.stats.rme.toFixed(2) + '%' : undefined,
          extra: `samples: ${bench.stats.sample.length}, mean: ${(bench.stats.mean || 0).toFixed(6)}s`
        });
      }
    });

    const outputFile = path.join(outputDir, 'tool-benchmark-results.json');
    fs.writeFileSync(outputFile, JSON.stringify(toolResults, null, 2));
    console.log(`\n💾 Results saved to: ${outputFile}`);
    
    console.log('\n📊 Tool Benchmark Summary:');
    toolResults.forEach(result => {
      console.log(`  ${result.name}: ${result.value.toFixed(2)} ${result.unit}`);
    });
    
    process.exit(0);
  })
  .run({ async: true }); 