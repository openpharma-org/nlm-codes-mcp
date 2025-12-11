window.BENCHMARK_DATA = {
  "lastUpdate": 1765450127997,
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
    ],
    "Tool Performance": [
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
        "date": 1765450125716,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Clinical Tool - icd-10-cm (simple)",
            "value": 913.8570671560203,
            "range": "0.38%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001094s"
          },
          {
            "name": "Clinical Tool - hcpcs-LII (simple)",
            "value": 917.1760442071599,
            "range": "0.30%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001090s"
          },
          {
            "name": "Clinical Tool - npi-organizations (simple)",
            "value": 919.545006855011,
            "range": "0.34%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001087s"
          },
          {
            "name": "Clinical Tool - rx-terms (simple)",
            "value": 921.0166921935145,
            "range": "0.33%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001086s"
          },
          {
            "name": "Clinical Tool - ICD-10-CM (term 1)",
            "value": 920.680213401686,
            "range": "0.31%",
            "unit": "ops/sec",
            "extra": "samples: 90, mean: 0.001086s"
          },
          {
            "name": "Clinical Tool - ICD-10-CM (term 2)",
            "value": 920.3819956540839,
            "range": "0.34%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001087s"
          },
          {
            "name": "Clinical Tool - ICD-10-CM (term 3)",
            "value": 922.5240038306063,
            "range": "0.28%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001084s"
          },
          {
            "name": "Clinical Tool - ICD-10-CM (term 4)",
            "value": 921.6489757428368,
            "range": "0.30%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001085s"
          },
          {
            "name": "Clinical Tool - ICD-10-CM (term 5)",
            "value": 924.1832816563182,
            "range": "0.25%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001082s"
          },
          {
            "name": "Clinical Tool - Result Size (3 results)",
            "value": 927.4853637558817,
            "range": "0.20%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001078s"
          },
          {
            "name": "Clinical Tool - Result Size (10 results)",
            "value": 925.4894898500361,
            "range": "0.24%",
            "unit": "ops/sec",
            "extra": "samples: 89, mean: 0.001081s"
          },
          {
            "name": "Clinical Tool - Result Size (25 results)",
            "value": 928.4980769470109,
            "range": "0.22%",
            "unit": "ops/sec",
            "extra": "samples: 90, mean: 0.001077s"
          },
          {
            "name": "Clinical Tool - Result Size (50 results)",
            "value": 923.8846552951,
            "range": "0.18%",
            "unit": "ops/sec",
            "extra": "samples: 90, mean: 0.001082s"
          },
          {
            "name": "Tool Discovery - getToolDefinitions (repeated)",
            "value": 118881.75458631616,
            "range": "0.25%",
            "unit": "ops/sec",
            "extra": "samples: 91, mean: 0.000008s"
          },
          {
            "name": "Tool Discovery - getToolHandler (cache test)",
            "value": 382719.5075424928,
            "range": "0.52%",
            "unit": "ops/sec",
            "extra": "samples: 95, mean: 0.000003s"
          },
          {
            "name": "Concurrent Clinical Searches (10x)",
            "value": 919.4561979140888,
            "range": "0.14%",
            "unit": "ops/sec",
            "extra": "samples: 91, mean: 0.001088s"
          },
          {
            "name": "Concurrent Multi-Method Searches (5x)",
            "value": 925.1717193177321,
            "range": "0.20%",
            "unit": "ops/sec",
            "extra": "samples: 88, mean: 0.001081s"
          },
          {
            "name": "Error Recovery - Invalid Operations",
            "value": 16.122194358302448,
            "range": "25.16%",
            "unit": "ops/sec",
            "extra": "samples: 86, mean: 0.062026s"
          },
          {
            "name": "JSON Processing - Large Dataset",
            "value": 536.8572122652901,
            "range": "0.26%",
            "unit": "ops/sec",
            "extra": "samples: 93, mean: 0.001863s"
          },
          {
            "name": "Array Processing - Filtering and Mapping",
            "value": 28308.298060665897,
            "range": "1.93%",
            "unit": "ops/sec",
            "extra": "samples: 93, mean: 0.000035s"
          }
        ]
      }
    ],
    "Transport Performance": [
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
        "date": 1765450127351,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "MCP Server Creation",
            "value": 103221.76612923322,
            "range": "1.05%",
            "unit": "ops/sec",
            "extra": "samples: 95, mean: 0.000010s"
          },
          {
            "name": "Config Loading - Default",
            "value": 3359.8693337295526,
            "range": "1.08%",
            "unit": "ops/sec",
            "extra": "samples: 92, mean: 0.000298s"
          },
          {
            "name": "Config Loading - With Environment Variables",
            "value": 74052.97490605009,
            "range": "0.23%",
            "unit": "ops/sec",
            "extra": "samples: 97, mean: 0.000014s"
          },
          {
            "name": "Logger Creation - error level",
            "value": 174131243.77466947,
            "range": "0.06%",
            "unit": "ops/sec",
            "extra": "samples: 95, mean: 0.000000s"
          },
          {
            "name": "Logger Creation - warn level",
            "value": 172227406.24798974,
            "range": "1.03%",
            "unit": "ops/sec",
            "extra": "samples: 94, mean: 0.000000s"
          },
          {
            "name": "Logger Creation - info level",
            "value": 173902592.99636352,
            "range": "0.11%",
            "unit": "ops/sec",
            "extra": "samples: 100, mean: 0.000000s"
          },
          {
            "name": "Logger - Info Messages (100x)",
            "value": 3403489.349241179,
            "range": "0.41%",
            "unit": "ops/sec",
            "extra": "samples: 93, mean: 0.000000s"
          },
          {
            "name": "Logger - Error Messages (100x)",
            "value": 2285299.022350087,
            "range": "0.32%",
            "unit": "ops/sec",
            "extra": "samples: 98, mean: 0.000000s"
          },
          {
            "name": "JSON Serialization - Small Message",
            "value": 2438657.986746548,
            "range": "0.17%",
            "unit": "ops/sec",
            "extra": "samples: 97, mean: 0.000000s"
          },
          {
            "name": "JSON Serialization - Medium Message",
            "value": 29884.358232374765,
            "range": "0.09%",
            "unit": "ops/sec",
            "extra": "samples: 96, mean: 0.000033s"
          },
          {
            "name": "JSON Serialization - Large Message",
            "value": 1415.8506509975136,
            "range": "0.06%",
            "unit": "ops/sec",
            "extra": "samples: 96, mean: 0.000706s"
          },
          {
            "name": "JSON Parse - Small Message",
            "value": 934465.8491984353,
            "range": "0.14%",
            "unit": "ops/sec",
            "extra": "samples: 98, mean: 0.000001s"
          },
          {
            "name": "JSON Parse - Medium Message",
            "value": 10878.807213661941,
            "range": "0.09%",
            "unit": "ops/sec",
            "extra": "samples: 94, mean: 0.000092s"
          },
          {
            "name": "JSON Parse - Large Message",
            "value": 565.4110460019119,
            "range": "0.55%",
            "unit": "ops/sec",
            "extra": "samples: 95, mean: 0.001769s"
          },
          {
            "name": "Message Processing - Request Validation",
            "value": 839979060.610322,
            "range": "0.09%",
            "unit": "ops/sec",
            "extra": "samples: 97, mean: 0.000000s"
          },
          {
            "name": "Mock Transport - Connection Setup",
            "value": 8748111.788104521,
            "range": "0.60%",
            "unit": "ops/sec",
            "extra": "samples: 90, mean: 0.000000s"
          },
          {
            "name": "Mock Transport - Message Sending (10x)",
            "value": 375824.3810483244,
            "range": "0.43%",
            "unit": "ops/sec",
            "extra": "samples: 88, mean: 0.000003s"
          },
          {
            "name": "Concurrent Config Loading (10x)",
            "value": 11055.795840107345,
            "range": "0.44%",
            "unit": "ops/sec",
            "extra": "samples: 88, mean: 0.000090s"
          },
          {
            "name": "Concurrent Logger Creation (10x)",
            "value": 467493.0274106673,
            "range": "0.34%",
            "unit": "ops/sec",
            "extra": "samples: 90, mean: 0.000002s"
          }
        ]
      }
    ]
  }
}