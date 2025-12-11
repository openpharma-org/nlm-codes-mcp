#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('📊 MCP Server Dashboard');
console.log('=======================\n');

// Read coverage data
function readCoverageData() {
  try {
    const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    if (!fs.existsSync(coverageFile)) {
      return null;
    }
    
    const rawData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    const files = Object.keys(rawData);
    
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;
    
    files.forEach(file => {
      const data = rawData[file];
      totalStatements += Object.keys(data.s).length;
      coveredStatements += Object.values(data.s).filter(count => count > 0).length;
      totalBranches += Object.keys(data.b).length * 2; // Each branch has 2 paths
      coveredBranches += Object.values(data.b).flat().filter(count => count > 0).length;
      totalFunctions += Object.keys(data.f).length;
      coveredFunctions += Object.values(data.f).filter(count => count > 0).length;
      totalLines += Object.keys(data.l).length;
      coveredLines += Object.values(data.l).filter(count => count > 0).length;
    });
    
    return {
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
      },
      lines: {
        total: totalLines,
        covered: coveredLines,
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      },
      files: files.length
    };
  } catch (error) {
    console.warn('Could not read coverage data:', error.message);
    return null;
  }
}

// Read benchmark data
function readBenchmarkData() {
  const benchmarkFiles = [
    'benchmark-results.json',
    'tool-benchmark-results.json',
    'transport-benchmark-results.json'
  ];
  
  const benchmarkData = {};
  
  benchmarkFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        benchmarkData[file] = JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read ${file}:`, error.message);
    }
  });
  
  return benchmarkData;
}

// Read performance report
function readPerformanceReport() {
  try {
    const perfFile = 'performance-report.json';
    if (fs.existsSync(perfFile)) {
      return JSON.parse(fs.readFileSync(perfFile, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not read performance report:', error.message);
  }
  return null;
}

// Generate coverage badge color
function getCoverageColor(percentage) {
  if (percentage >= 80) return '🟢';
  if (percentage >= 60) return '🟡';
  if (percentage >= 40) return '🟠';
  return '🔴';
}

// Generate performance indicator
function getPerformanceIndicator(opsPerSec) {
  if (opsPerSec >= 100000) return '🚀';
  if (opsPerSec >= 10000) return '⚡';
  if (opsPerSec >= 1000) return '🟢';
  if (opsPerSec >= 100) return '🟡';
  return '🔴';
}

// Display dashboard
function displayDashboard() {
  const coverage = readCoverageData();
  const benchmarks = readBenchmarkData();
  const performance = readPerformanceReport();
  
  console.log('🎯 Test Coverage Summary');
  console.log('========================');
  
  if (coverage) {
    console.log(`${getCoverageColor(coverage.statements.percentage)} Statements: ${coverage.statements.covered}/${coverage.statements.total} (${coverage.statements.percentage.toFixed(1)}%)`);
    console.log(`${getCoverageColor(coverage.branches.percentage)} Branches:   ${coverage.branches.covered}/${coverage.branches.total} (${coverage.branches.percentage.toFixed(1)}%)`);
    console.log(`${getCoverageColor(coverage.functions.percentage)} Functions:  ${coverage.functions.covered}/${coverage.functions.total} (${coverage.functions.percentage.toFixed(1)}%)`);
    console.log(`${getCoverageColor(coverage.lines.percentage)} Lines:      ${coverage.lines.covered}/${coverage.lines.total} (${coverage.lines.percentage.toFixed(1)}%)`);
    console.log(`📁 Files covered: ${coverage.files}`);
    
    // Coverage trend
    const avgCoverage = (coverage.statements.percentage + coverage.branches.percentage + 
                        coverage.functions.percentage + coverage.lines.percentage) / 4;
    console.log(`📊 Average coverage: ${avgCoverage.toFixed(1)}%`);
    
    if (avgCoverage >= 80) {
      console.log('🏆 Excellent test coverage!');
    } else if (avgCoverage >= 60) {
      console.log('👍 Good test coverage');
    } else if (avgCoverage >= 40) {
      console.log('⚠️  Test coverage needs improvement');
    } else {
      console.log('❌ Low test coverage - action required');
    }
  } else {
    console.log('❌ No coverage data available. Run: npm run test:coverage');
  }
  
  console.log('\n⚡ Performance Benchmarks');
  console.log('=========================');
  
  const allBenchmarks = [];
  
  // Process benchmark data
  Object.entries(benchmarks).forEach(([filename, data]) => {
    if (data.results) {
      allBenchmarks.push(...data.results);
    }
  });
  
  if (allBenchmarks.length > 0) {
    // Sort by ops/sec descending
    allBenchmarks.sort((a, b) => b.ops - a.ops);
    
    console.log('🏆 Top 5 Fastest Operations:');
    allBenchmarks.slice(0, 5).forEach((benchmark, index) => {
      const indicator = getPerformanceIndicator(benchmark.ops);
      console.log(`${index + 1}. ${indicator} ${benchmark.name}: ${benchmark.ops.toLocaleString()} ops/sec`);
    });
    
    console.log('\n🐌 Slowest Operations:');
    allBenchmarks.slice(-3).reverse().forEach(benchmark => {
      const indicator = getPerformanceIndicator(benchmark.ops);
      console.log(`   ${indicator} ${benchmark.name}: ${benchmark.ops.toLocaleString()} ops/sec`);
    });
    
    const avgOps = allBenchmarks.reduce((sum, b) => sum + b.ops, 0) / allBenchmarks.length;
    console.log(`\n📊 Average performance: ${avgOps.toFixed(0)} ops/sec`);
    
    // Performance categories
    const categories = {};
    allBenchmarks.forEach(benchmark => {
      const category = benchmark.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(benchmark);
    });
    
    if (Object.keys(categories).length > 1) {
      console.log('\n📈 Performance by Category:');
      Object.entries(categories).forEach(([category, benchmarks]) => {
        const avgCategoryOps = benchmarks.reduce((sum, b) => sum + b.ops, 0) / benchmarks.length;
        console.log(`   ${category}: ${avgCategoryOps.toFixed(0)} avg ops/sec`);
      });
    }
  } else {
    console.log('❌ No benchmark data available. Run: npm run bench');
  }
  
  console.log('\n🔬 Performance Monitoring');
  console.log('=========================');
  
  if (performance) {
    console.log(`📅 Last run: ${new Date(performance.timestamp).toLocaleString()}`);
    console.log(`🖥️  Platform: ${performance.platform} (${performance.arch})`);
    console.log(`📦 Node.js: ${performance.node_version}`);
    
    if (performance.memory_usage) {
      const heapMB = (performance.memory_usage.heapUsed / 1024 / 1024).toFixed(1);
      console.log(`🧠 Memory usage: ${heapMB} MB`);
    }
    
    if (performance.summary) {
      console.log(`⚡ Operations monitored: ${performance.metrics.length}`);
      console.log(`🏃 Total duration: ${performance.summary.total_duration.toFixed(2)}ms`);
      console.log(`⏱️  Average duration: ${performance.summary.average_duration.toFixed(2)}ms`);
      
      if (performance.summary.fastest_operation) {
        console.log(`🏆 Fastest: ${performance.summary.fastest_operation.label} (${performance.summary.fastest_operation.duration.toFixed(2)}ms)`);
      }
      
      if (performance.summary.slowest_operation) {
        console.log(`🐌 Slowest: ${performance.summary.slowest_operation.label} (${performance.summary.slowest_operation.duration.toFixed(2)}ms)`);
      }
    }
  } else {
    console.log('❌ No performance data available. Run: npm run perf');
  }
  
  console.log('\n🎯 Health Score');
  console.log('===============');
  
  let healthScore = 0;
  let maxScore = 0;
  
  // Coverage score (40 points max)
  if (coverage) {
    const avgCoverage = (coverage.statements.percentage + coverage.branches.percentage + 
                        coverage.functions.percentage + coverage.lines.percentage) / 4;
    healthScore += (avgCoverage / 100) * 40;
  }
  maxScore += 40;
  
  // Performance score (30 points max)
  if (allBenchmarks.length > 0) {
    const avgOps = allBenchmarks.reduce((sum, b) => sum + b.ops, 0) / allBenchmarks.length;
    if (avgOps >= 10000) {
      healthScore += 30;
    } else if (avgOps >= 1000) {
      healthScore += 20;
    } else if (avgOps >= 100) {
      healthScore += 10;
    }
  }
  maxScore += 30;
  
  // Performance monitoring score (20 points max)
  if (performance) {
    healthScore += 20;
  }
  maxScore += 20;
  
  // Tests running score (10 points max)
  if (coverage && coverage.files > 0) {
    healthScore += 10;
  }
  maxScore += 10;
  
  const healthPercentage = (healthScore / maxScore) * 100;
  let healthEmoji = '❌';
  if (healthPercentage >= 90) healthEmoji = '💚';
  else if (healthPercentage >= 75) healthEmoji = '💛';
  else if (healthPercentage >= 50) healthEmoji = '🧡';
  else if (healthPercentage >= 25) healthEmoji = '❤️';
  
  console.log(`${healthEmoji} Overall Health Score: ${healthScore.toFixed(1)}/${maxScore} (${healthPercentage.toFixed(1)}%)`);
  
  console.log('\n📋 Quick Actions');
  console.log('================');
  
  if (!coverage) {
    console.log('🔧 Run tests with coverage: npm run test:coverage');
  }
  
  if (allBenchmarks.length === 0) {
    console.log('🔧 Run performance benchmarks: npm run bench');
  }
  
  if (!performance) {
    console.log('🔧 Run performance monitoring: npm run perf');
  }
  
  if (coverage && coverage.statements.percentage < 80) {
    console.log('🔧 Improve test coverage: Add more tests in tests/ directory');
  }
  
  if (allBenchmarks.length > 0) {
    const slowOps = allBenchmarks.filter(b => b.ops < 1000);
    if (slowOps.length > 0) {
      console.log(`🔧 Optimize slow operations: ${slowOps.length} operations below 1000 ops/sec`);
    }
  }
  
  console.log('\n✨ Dashboard updated!');
}

// Generate markdown report
function generateMarkdownReport() {
  const coverage = readCoverageData();
  const benchmarks = readBenchmarkData();
  const performance = readPerformanceReport();
  
  let markdown = '# MCP Server Status Report\n\n';
  markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  // Coverage section
  markdown += '## 📊 Test Coverage\n\n';
  if (coverage) {
    markdown += '| Metric | Coverage | Status |\n';
    markdown += '|--------|----------|--------|\n';
    markdown += `| Statements | ${coverage.statements.percentage.toFixed(1)}% | ${getCoverageColor(coverage.statements.percentage)} |\n`;
    markdown += `| Branches | ${coverage.branches.percentage.toFixed(1)}% | ${getCoverageColor(coverage.branches.percentage)} |\n`;
    markdown += `| Functions | ${coverage.functions.percentage.toFixed(1)}% | ${getCoverageColor(coverage.functions.percentage)} |\n`;
    markdown += `| Lines | ${coverage.lines.percentage.toFixed(1)}% | ${getCoverageColor(coverage.lines.percentage)} |\n\n`;
  } else {
    markdown += '*No coverage data available*\n\n';
  }
  
  // Performance section
  markdown += '## ⚡ Performance Benchmarks\n\n';
  const allBenchmarks = [];
  Object.entries(benchmarks).forEach(([filename, data]) => {
    if (data.results) {
      allBenchmarks.push(...data.results);
    }
  });
  
  if (allBenchmarks.length > 0) {
    allBenchmarks.sort((a, b) => b.ops - a.ops);
    markdown += '### Top Performers\n\n';
    markdown += '| Operation | Ops/sec | Performance |\n';
    markdown += '|-----------|---------|-------------|\n';
    allBenchmarks.slice(0, 5).forEach(benchmark => {
      markdown += `| ${benchmark.name} | ${benchmark.ops.toLocaleString()} | ${getPerformanceIndicator(benchmark.ops)} |\n`;
    });
    markdown += '\n';
  } else {
    markdown += '*No benchmark data available*\n\n';
  }
  
  // Save markdown report
  fs.writeFileSync('status-report.md', markdown);
  console.log('📄 Markdown report saved to: status-report.md');
}

// Main execution
if (process.argv.includes('--markdown')) {
  generateMarkdownReport();
} else {
  displayDashboard();
} 