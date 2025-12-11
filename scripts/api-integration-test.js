#!/usr/bin/env node

import { getToolHandler } from '../dist/tools/index.js';
import { createLogger } from '../dist/utils/logger.js';

const logger = createLogger('info', false);

console.log('🔗 API Integration Performance Test');
console.log('===================================');
console.log('📝 This script tests actual API calls to measure real-world performance');
console.log('   Use this to verify API connectivity and measure network performance\n');

const nlmCtCodesHandler = getToolHandler('nlm_ct_codes');

if (!nlmCtCodesHandler) {
  console.error('❌ nlm_ct_codes handler not available');
  process.exit(1);
}

// Test configuration
const tests = [
  {
    name: 'ICD-10-CM Search',
    params: { method: 'icd-10-cm', terms: 'hypertension', maxList: 5 }
  },
  {
    name: 'HCPCS Search',
    params: { method: 'hcpcs-LII', terms: 'wheelchair', maxList: 5 }
  },
  {
    name: 'NPI Organizations',
    params: { method: 'npi-organizations', terms: 'hospital', maxList: 5 }
  },
  {
    name: 'Drug Search',
    params: { method: 'rx-terms', terms: 'aspirin', maxList: 5 }
  },
  {
    name: 'HPO Vocabulary',
    params: { method: 'hpo-vocabulary', terms: 'seizure', maxList: 5 }
  }
];

async function measureApiCall(test) {
  const startTime = process.hrtime.bigint();
  
  try {
    const result = await nlmCtCodesHandler(test.params);
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    
    return {
      success: true,
      duration: durationMs,
      resultCount: result.results?.length || 0,
      total: result.total || 0
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    
    return {
      success: false,
      duration: durationMs,
      error: error.message
    };
  }
}

async function runIntegrationTests() {
  const results = [];
  
  console.log('🚀 Starting API integration tests...\n');
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}...`);
    
    // Run multiple iterations to get average performance
    const iterations = 3;
    const iterationResults = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await measureApiCall(test);
      iterationResults.push(result);
      
      if (result.success) {
        console.log(`  Iteration ${i + 1}: ${result.duration.toFixed(1)}ms (${result.resultCount} results)`);
      } else {
        console.log(`  Iteration ${i + 1}: FAILED - ${result.error}`);
      }
      
      // Small delay between iterations to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Calculate statistics
    const successfulResults = iterationResults.filter(r => r.success);
    
    if (successfulResults.length > 0) {
      const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
      const minDuration = Math.min(...successfulResults.map(r => r.duration));
      const maxDuration = Math.max(...successfulResults.map(r => r.duration));
      
      results.push({
        test: test.name,
        success: true,
        avgDuration,
        minDuration,
        maxDuration,
        successRate: (successfulResults.length / iterations) * 100,
        resultCount: successfulResults[0].resultCount
      });
      
      console.log(`  ✅ Average: ${avgDuration.toFixed(1)}ms (${minDuration.toFixed(1)}-${maxDuration.toFixed(1)}ms)`);
    } else {
      results.push({
        test: test.name,
        success: false,
        error: iterationResults[0].error
      });
      
      console.log(`  ❌ All iterations failed`);
    }
    
    console.log();
  }
  
  // Summary
  console.log('📊 Integration Test Summary');
  console.log('===========================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  if (successfulTests.length > 0) {
    console.log('\n✅ Successful Tests:');
    successfulTests.forEach(result => {
      const opsPerSec = (1000 / result.avgDuration).toFixed(1);
      console.log(`  ${result.test}: ${result.avgDuration.toFixed(1)}ms avg (~${opsPerSec} ops/sec)`);
    });
    
    const overallAvg = successfulTests.reduce((sum, r) => sum + r.avgDuration, 0) / successfulTests.length;
    console.log(`\n  Overall average: ${overallAvg.toFixed(1)}ms (~${(1000 / overallAvg).toFixed(1)} ops/sec)`);
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(result => {
      console.log(`  ${result.test}: ${result.error}`);
    });
  }
  
  console.log(`\nTest Summary: ${successfulTests.length}/${results.length} passed`);
  
  // Exit with error code if any tests failed
  if (failedTests.length > 0) {
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('❌ Integration test runner failed:', error);
  process.exit(1);
}); 