# Codes MCP Server

An MCP server providing access to clinical table search services and medical coding systems. This server enables AI assistants to query various clinical data tables including ICD codes, LOINC, HCPCS, medication databases, and other healthcare terminology systems through the National Library of Medicine's Clinical Tables API.

## 🏥 Supported Clinical Data Sources

This server provides a unified tool to search and access various clinical coding systems and medical data tables:

### Medical Coding Systems
- **ICD-10-CM** - International Classification of Diseases, 10th Revision, Clinical Modification
- **ICD-11** - WHO's latest International Classification of Diseases (2023)
- **HCPCS Level II** - Healthcare Common Procedure Coding System

### Healthcare Providers
- **NPI Organizations** - National Provider Identifier lookup for healthcare organizations
- **NPI Individuals** - National Provider Identifier lookup for individual providers

### Clinical Terminologies & Conditions
- **HPO Vocabulary** - Human Phenotype Ontology for standardized phenotypic abnormalities
- **Medical Conditions** - Curated list of 2,400+ medical conditions with ICD-9/ICD-10 mappings
- **Major Surgeries & Implants** - 280+ major surgical procedures and implants

### Medication & Drug Information
- **RxTerms** - Drug interface terminology with name/route pairs, strengths and forms

### Laboratory & Testing
- **LOINC Questions** - Logical Observation Identifiers Names and Codes for medical tests and measurements

### Genomics & Genetics
- **NCBI Genes** - Human gene information from NCBI's Gene dataset

## Project Structure

```
src/
├── index.ts              # Main entry point
├── types.ts              # TypeScript type definitions
├── tools/                # Clinical search tool implementations
│   ├── index.ts          # Tool registry
│   └── nlm-ct-codes/     # Unified clinical search tools
│       ├── index.ts      # Main tool definition and handler
│       ├── types.ts      # Type definitions for all methods
│       ├── utils.ts      # Shared utilities
│       ├── icd-10-cm.ts  # ICD-10-CM search implementation
│       ├── icd-11.ts     # ICD-11 search implementation
│       ├── hcpcs-LII.ts  # HCPCS Level II search implementation
│       ├── npi-organizations.ts    # NPI organization search
│       ├── npi-individuals.ts      # NPI individual search
│       ├── hpo-vocabulary.ts       # HPO phenotype search
│       ├── conditions.ts           # Medical conditions search
│       ├── rx-terms.ts             # Drug terminology search
│       ├── loinc-questions.ts      # LOINC search
│       ├── ncbi-genes.ts           # Gene information search
│       └── major-surgeries-implants.ts # Surgical procedures
├── transports/           # Transport implementations
│   ├── mcp-server.ts     # Shared MCP server factory
│   ├── stdio.ts          # Stdio transport
│   ├── sse.ts            # Server-Sent Events transport
│   └── http.ts           # HTTP transport
└── utils/                # Utility modules
    ├── config.ts         # Configuration loader
    └── logger.ts         # Logging utility
```

## 🔧 Configuration

The server can be configured using environment variables:

### Clinical API Settings
- `CLINICAL_API_BASE_URL`: Base URL for clinical table search API (default: 'https://clinicaltables.nlm.nih.gov')
- `ENABLE_ICD_TOOLS`: Enable ICD code search tools (default: true)
- `ENABLE_LOINC_TOOLS`: Enable LOINC search tools (default: true)
- `ENABLE_DRUG_TOOLS`: Enable medication/drug search tools (default: true)
- `ENABLE_GENOMIC_TOOLS`: Enable genomic search tools (default: true)
- `ENABLE_NPI_TOOLS`: Enable NPI provider search tools (default: true)

### Server Settings
- `SERVER_NAME`: Server name (default: 'codes-mcp-server')
- `SERVER_VERSION`: Server version (default: '0.1.2')
- `USE_HTTP`: Set to 'true' for HTTP mode, 'false' for stdio mode (default: false)
- `USE_SSE`: Set to 'true' for SSE mode (default: false)
- `PORT`: HTTP server port (default: 3000)
- `SSE_PATH`: SSE endpoint path (default: '/mcp')
- `LOG_LEVEL`: Logging level - 'error', 'warn', 'info', 'debug' (default: 'info')

### Security & Performance
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins (default: '*')
- `REQUEST_TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `MAX_REQUEST_SIZE`: Maximum request size in bytes (default: 1048576)
- `MAX_CONNECTIONS`: Maximum concurrent connections (default: 100)
- `ENABLE_PERFORMANCE_MONITORING`: Enable performance monitoring (default: false)

### Development Settings
- `NODE_ENV`: Environment mode (default: 'production')
- `DEV_MODE`: Enable development mode (default: false)
- `DEBUG`: Enable debug logging (default: false)
- `ENABLE_EXPERIMENTAL_FEATURES`: Enable experimental features (default: false)

## Cursor MCP Settings

To use this server with Cursor, add this configuration to your `~/.cursor/mcp.json`:

   ```json
   {
  "codes-mcp-server": {
       "command": "node",
    "args": ["/path/to/codes-mcp-server/dist/index.js"],
       "env": {
         "USE_HTTP": "false",
      "LOG_LEVEL": "info",
      "ENABLE_ICD_TOOLS": "true",
      "ENABLE_LOINC_TOOLS": "true",
      "ENABLE_DRUG_TOOLS": "true",
      "ENABLE_GENOMIC_TOOLS": "true",
      "ENABLE_NPI_TOOLS": "true"
       }
     }
   }
   ```

Make sure to:
1. Build the TypeScript files first with `npm run build`
2. Replace `/path/to/codes-mcp-server` with your actual project path
3. Restart Cursor after making changes to `mcp.json`

## 🔍 Available Tool

### Unified Clinical Search Tool: `nlm_ct_codes`

This server provides **one unified tool** that handles all clinical data searches through different methods:

**Tool Name**: `nlm_ct_codes`

**Description**: Search clinical coding systems using the NLM Clinical Tables API. Supports multiple medical coding systems, provider databases, and clinical terminologies.

**Usage Example**:
```javascript
// Search ICD-10-CM codes for hypertension
{
  "method": "icd-10-cm",
  "terms": "hypertension",
  "maxList": 10
}

// Search for healthcare providers in California
{
  "method": "npi-organizations", 
  "terms": "cardiology",
  "additionalQuery": "addr_practice.state:CA",
  "maxList": 5
}

// Search HCPCS codes for wheelchairs
{
  "method": "hcpcs-LII",
  "terms": "wheelchair",
  "maxList": 15
}

// Complex boolean query with parentheses (automatically optimized)
{
  "method": "npi-organizations",
  "terms": "hospital OR medical",
  "additionalQuery": "addr_practice.state:CA AND (addr_practice.city:\"Los Angeles\" OR addr_practice.city:\"San Francisco\")",
  "extraFields": "provider_type,addr_practice.city,addr_practice.state,name.full,NPI",
  "maxList": 5
}
```

### Advanced Query Capabilities

The `additionalQuery` parameter supports sophisticated boolean expressions with parentheses grouping. The tool automatically detects and optimizes complex queries for best API compatibility:

**Simple Filtering**:
- `"addr_practice.state:CA"` - Single condition
- `"obsolete:false"` - Boolean filtering

**Boolean Expressions**:
- `"gender:F AND addr_practice.state:CA"` - AND operations
- `"cardiology OR neurology"` - OR operations

**Complex Parentheses Grouping** (automatically optimized):
- `"addr_practice.state:CA AND (addr_practice.city:\"Los Angeles\" OR addr_practice.city:\"San Francisco\")"` 
- `"hospital OR medical AND (addr_practice.state:CA OR addr_practice.state:NY)"`
- `"(provider_type:Physician* OR provider_type:Nurse*) AND addr_practice.state:TX"`

The tool transforms complex parentheses expressions using boolean algebra for optimal performance while maintaining the intended logic.

**Supported Methods**:
- `icd-10-cm` - Search ICD-10-CM diagnosis codes
- `icd-11` - Search ICD-11 codes
- `hcpcs-LII` - Search HCPCS Level II procedure/equipment codes
- `npi-organizations` - Search healthcare organizations
- `npi-individuals` - Search individual healthcare providers
- `hpo-vocabulary` - Search phenotypic abnormality terms
- `conditions` - Search medical conditions
- `rx-terms` - Search prescription drug terminology
- `loinc-questions` - Search LOINC codes and forms
- `ncbi-genes` - Search gene information
- `major-surgeries-implants` - Search surgical procedures and implants

**Parameters**:
- `method` (required): The coding system to search
- `terms` (required): Search query string
- `maxList`: Maximum results to return (1-500, default: 7)
- `searchFields`: Comma-separated fields to search in
- `displayFields`: Comma-separated fields to display
- `extraFields`: Additional fields to include in results
- `additionalQuery`: Elasticsearch query for advanced filtering
- `offset`: Starting result number for pagination (default: 0)
- `count`: Page size for pagination (1-500, default: 7)

## Development

1. Start in watch mode:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Run type checking:
   ```bash
   npm run type-check
   ```

4. Format code:
   ```bash
   npm run format
   ```

## 📚 Resources

- [Clinical Table Search Service](https://clinicaltables.nlm.nih.gov/)
- [Healthcare Terminology Standards](https://www.nlm.nih.gov/research/umls/)
- [FHIR Terminology Services](https://hl7.org/fhir/terminology-service.html)