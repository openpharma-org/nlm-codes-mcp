window.BENCHMARK_DATA = {
  "lastUpdate": 1765450124779,
  "repoUrl": "https://github.com/openpharma-org/nlm-codes-mcp",
  "entries": {
    "Node.js Benchmark": [
      {
        "commit": {
          "author": {
            "email": "janisaez@gmail.com",
            "name": "Joan",
            "username": "uh-joan"
          },
          "committer": {
            "email": "janisaez@gmail.com",
            "name": "Joan",
            "username": "uh-joan"
          },
          "distinct": true,
          "id": "c9d3aee7dce6da1fbe9d750fe74a1814df722756",
          "message": "Initial commit: nlm-codes-mcp\n\nOpenPharma MCP server - pharmaceutical and biomedical data access\n\nMigrated to openpharma-org with clean history and updated package scope.\nAll sensitive data removed, ready for public release.\n\nPart of OpenPharma: https://github.com/openpharma-org",
          "timestamp": "2025-12-11T10:42:36Z",
          "tree_id": "9fc5c8320481220eff84af75916c22973ef1fe2d",
          "url": "https://github.com/openpharma-org/nlm-codes-mcp/commit/c9d3aee7dce6da1fbe9d750fe74a1814df722756"
        },
        "date": 1765449940558,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Logger Creation",
            "value": 174100311,
            "range": "±0.09%",
            "unit": "ops/sec",
            "extra": "samples: 99\nmean: 0ms\nperformance: baseline (fastest)"
          },
          {
            "name": "Tool Discovery - getToolHandler",
            "value": 47236499,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "samples: 97\nmean: 0ms\nperformance: 3.69x slower"
          },
          {
            "name": "Tool Discovery - getToolDefinitions",
            "value": 11428670,
            "range": "±0.38%",
            "unit": "ops/sec",
            "extra": "samples: 97\nmean: 0ms\nperformance: 15.23x slower"
          },
          {
            "name": "Error Handling - Invalid Method",
            "value": 181195,
            "range": "±0.19%",
            "unit": "ops/sec",
            "extra": "samples: 88\nmean: 0.006ms\nperformance: 960.85x slower"
          },
          {
            "name": "Error Handling - Missing Required Parameters",
            "value": 132636,
            "range": "±0.25%",
            "unit": "ops/sec",
            "extra": "samples: 91\nmean: 0.008ms\nperformance: 1312.62x slower"
          },
          {
            "name": "Config Loading",
            "value": 116992,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "samples: 95\nmean: 0.009ms\nperformance: 1488.14x slower"
          },
          {
            "name": "JSON Processing - Complex Response",
            "value": 15046,
            "range": "±0.18%",
            "unit": "ops/sec",
            "extra": "samples: 93\nmean: 0.066ms\nperformance: 11571.2x slower"
          },
          {
            "name": "Multi-Method Clinical Searches (4 methods)",
            "value": 928,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "samples: 90\nmean: 1.078ms\nperformance: 187608.09x slower"
          },
          {
            "name": "Clinical Tool - ICD-10-CM Search",
            "value": 923,
            "range": "±0.54%",
            "unit": "ops/sec",
            "extra": "samples: 35\nmean: 1.083ms\nperformance: 188624.39x slower"
          },
          {
            "name": "Batch Clinical Searches (10 items)",
            "value": 922,
            "range": "±0.19%",
            "unit": "ops/sec",
            "extra": "samples: 89\nmean: 1.084ms\nperformance: 188828.97x slower"
          },
          {
            "name": "Clinical Tool - Drug Search",
            "value": 916,
            "range": "±0.41%",
            "unit": "ops/sec",
            "extra": "samples: 88\nmean: 1.092ms\nperformance: 190065.84x slower"
          },
          {
            "name": "Clinical Tool - NPI Search",
            "value": 913,
            "range": "±0.43%",
            "unit": "ops/sec",
            "extra": "samples: 88\nmean: 1.095ms\nperformance: 190690.37x slower"
          },
          {
            "name": "Clinical Tool - HCPCS Search",
            "value": 906,
            "range": "±0.47%",
            "unit": "ops/sec",
            "extra": "samples: 87\nmean: 1.103ms\nperformance: 192163.7x slower"
          },
          {
            "name": "Memory Usage - Large Result Set",
            "value": 903,
            "range": "±0.43%",
            "unit": "ops/sec",
            "extra": "samples: 88\nmean: 1.108ms\nperformance: 192802.12x slower"
          }
        ]
      }
    ],
    "MCP Server Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "janisaez@gmail.com",
            "name": "Joan",
            "username": "uh-joan"
          },
          "committer": {
            "email": "janisaez@gmail.com",
            "name": "Joan",
            "username": "uh-joan"
          },
          "distinct": true,
          "id": "c9d3aee7dce6da1fbe9d750fe74a1814df722756",
          "message": "Initial commit: nlm-codes-mcp\n\nOpenPharma MCP server - pharmaceutical and biomedical data access\n\nMigrated to openpharma-org with clean history and updated package scope.\nAll sensitive data removed, ready for public release.\n\nPart of OpenPharma: https://github.com/openpharma-org",
          "timestamp": "2025-12-11T10:42:36Z",
          "tree_id": "9fc5c8320481220eff84af75916c22973ef1fe2d",
          "url": "https://github.com/openpharma-org/nlm-codes-mcp/commit/c9d3aee7dce6da1fbe9d750fe74a1814df722756"
        },
        "date": 1765450123825,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Logger Creation",
            "value": 173671553,
            "range": "±0.08%",
            "unit": "ops/sec",
            "extra": "samples: 95\nmean: 0ms\nperformance: baseline (fastest)"
          },
          {
            "name": "Tool Discovery - getToolHandler",
            "value": 47348047,
            "range": "±0.48%",
            "unit": "ops/sec",
            "extra": "samples: 90\nmean: 0ms\nperformance: 3.67x slower"
          },
          {
            "name": "Tool Discovery - getToolDefinitions",
            "value": 11514621,
            "range": "±0.46%",
            "unit": "ops/sec",
            "extra": "samples: 97\nmean: 0ms\nperformance: 15.08x slower"
          },
          {
            "name": "Error Handling - Invalid Method",
            "value": 183988,
            "range": "±0.55%",
            "unit": "ops/sec",
            "extra": "samples: 86\nmean: 0.005ms\nperformance: 943.93x slower"
          },
          {
            "name": "Error Handling - Missing Required Parameters",
            "value": 132875,
            "range": "±0.54%",
            "unit": "ops/sec",
            "extra": "samples: 86\nmean: 0.008ms\nperformance: 1307.03x slower"
          },
          {
            "name": "Config Loading",
            "value": 120054,
            "range": "±0.56%",
            "unit": "ops/sec",
            "extra": "samples: 96\nmean: 0.008ms\nperformance: 1446.61x slower"
          },
          {
            "name": "JSON Processing - Complex Response",
            "value": 14979,
            "range": "±0.13%",
            "unit": "ops/sec",
            "extra": "samples: 92\nmean: 0.067ms\nperformance: 11594.34x slower"
          },
          {
            "name": "Clinical Tool - HCPCS Search",
            "value": 911,
            "range": "±0.44%",
            "unit": "ops/sec",
            "extra": "samples: 89\nmean: 1.098ms\nperformance: 190638.37x slower"
          },
          {
            "name": "Clinical Tool - Drug Search",
            "value": 911,
            "range": "±0.42%",
            "unit": "ops/sec",
            "extra": "samples: 90\nmean: 1.098ms\nperformance: 190638.37x slower"
          },
          {
            "name": "Clinical Tool - NPI Search",
            "value": 910,
            "range": "±0.49%",
            "unit": "ops/sec",
            "extra": "samples: 90\nmean: 1.099ms\nperformance: 190847.86x slower"
          },
          {
            "name": "Batch Clinical Searches (10 items)",
            "value": 906,
            "range": "±0.39%",
            "unit": "ops/sec",
            "extra": "samples: 89\nmean: 1.103ms\nperformance: 191690.46x slower"
          },
          {
            "name": "Multi-Method Clinical Searches (4 methods)",
            "value": 906,
            "range": "±0.39%",
            "unit": "ops/sec",
            "extra": "samples: 88\nmean: 1.104ms\nperformance: 191690.46x slower"
          },
          {
            "name": "Memory Usage - Large Result Set",
            "value": 906,
            "range": "±0.33%",
            "unit": "ops/sec",
            "extra": "samples: 90\nmean: 1.103ms\nperformance: 191690.46x slower"
          },
          {
            "name": "Clinical Tool - ICD-10-CM Search",
            "value": 904,
            "range": "±0.56%",
            "unit": "ops/sec",
            "extra": "samples: 87\nmean: 1.106ms\nperformance: 192114.55x slower"
          }
        ]
      }
    ]
  }
}