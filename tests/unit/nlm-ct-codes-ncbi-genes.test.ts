/// <reference types="jest" />
import { searchNcbiGenes } from '../../src/tools/nlm-ct-codes/ncbi-genes.js';
import { NcbiGenesMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

// Mock the global fetch function
type MockFetchResponse = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<any>;
};

interface MockFetch {
  (url: string, options?: any): Promise<MockFetchResponse>;
  mockResolvedValueOnce: (value: MockFetchResponse) => void;
  mockRejectedValueOnce: (error: Error) => void;
  mockClear: () => void;
  calls: Array<[string, any?]>;
}

const mockFetch: MockFetch = (() => {
  let mockResponses: (MockFetchResponse | Error)[] = [];
  let isError: boolean[] = [];
  let callHistory: Array<[string, any?]> = [];

  const fetchMock = async (url: string, options?: any) => {
    callHistory.push([url, options]);

    if (mockResponses.length === 0) {
      throw new Error('No mock response set');
    }

    const response = mockResponses.shift();
    const error = isError.shift();

    if (error) {
      throw response;
    }

    return response as MockFetchResponse;
  };

  fetchMock.mockResolvedValueOnce = (value: MockFetchResponse) => {
    mockResponses.push(value);
    isError.push(false);
  };

  fetchMock.mockRejectedValueOnce = (error: Error) => {
    mockResponses.push(error);
    isError.push(true);
  };

  fetchMock.mockClear = () => {
    mockResponses = [];
    isError = [];
    callHistory = [];
  };

  Object.defineProperty(fetchMock, 'calls', {
    get: () => callHistory,
  });

  return fetchMock as MockFetch;
})();

global.fetch = mockFetch as any;

describe('searchNcbiGenes', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search NCBI Genes successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['672', '7157', '2064'], // codes (GeneIDs)
        {}, // extra data
        [
          // display data
          ['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding'],
          ['NCBI', '7157', '17', 'TP53', 'tumor protein p53', 'protein-coding'],
          ['NCBI', '2064', '17', 'ERBB2', 'erb-b2 receptor tyrosine kinase 2', 'protein-coding'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      const result = await searchNcbiGenes(args);

      expect(result.method).toBe('ncbi-genes');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: '672',
        display: 'NCBI | 672 | 17 | BRCA1 | BRCA1 DNA repair associated | protein-coding',
      });
      expect(result.results[1]).toEqual({
        code: '7157',
        display: 'NCBI | 7157 | 17 | TP53 | tumor protein p53 | protein-coding',
      });
      expect(result.results[2]).toEqual({
        code: '2064',
        display: 'NCBI | 2064 | 17 | ERBB2 | erb-b2 receptor tyrosine kinase 2 | protein-coding',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?terms=BRCA1&maxList=7&sf=GeneID%2CSymbol%2CSynonyms%2Cdescription%2Cchromosome%2Cmap_location%2Ctype_of_gene%2CHGNC_ID%2CdbXrefs&df=_code_system%2C_code%2Cchromosome%2CSymbol%2Cdescription%2Ctype_of_gene&cf=GeneID&offset=0'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle single display element correctly', async () => {
      const mockApiResponse = [
        5, // total count
        ['672', '7157'], // codes
        {}, // extra data
        [
          // display data with single elements
          ['BRCA1 DNA repair associated'],
          ['tumor protein p53'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      const result = await searchNcbiGenes(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: '672',
        display: 'BRCA1 DNA repair associated',
      });
      expect(result.results[1]).toEqual({
        code: '7157',
        display: 'tumor protein p53',
      });
    });

    test('should handle non-array display strings', async () => {
      const mockApiResponse = [
        1, // total count
        ['672'], // codes
        {}, // extra data
        ['BRCA1 DNA repair associated'], // display data as string
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      const result = await searchNcbiGenes(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: '672',
        display: 'BRCA1 DNA repair associated',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'test',
      };

      await searchNcbiGenes(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?terms=test&maxList=7&sf=GeneID%2CSymbol%2CSynonyms%2Cdescription%2Cchromosome%2Cmap_location%2Ctype_of_gene%2CHGNC_ID%2CdbXrefs&df=_code_system%2C_code%2Cchromosome%2CSymbol%2Cdescription%2Ctype_of_gene&cf=GeneID&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });
  });

  describe('Parameter handling', () => {
    test('should include all optional parameters in API request', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        maxList: 10,
        offset: 20,
        count: 5,
        q: 'chromosome:17',
        df: 'GeneID,Symbol,chromosome,description',
        sf: 'Symbol,Synonyms,description',
        cf: 'GeneID',
        extraFields: 'HGNC_ID,dbXrefs,map_location,type_of_gene',
      };

      await searchNcbiGenes(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?terms=BRCA1&maxList=10&sf=Symbol%2CSynonyms%2Cdescription&df=GeneID%2CSymbol%2Cchromosome%2Cdescription&cf=GeneID&offset=20&count=5&q=chromosome%3A17&ef=HGNC_ID%2CdbXrefs%2Cmap_location%2Ctype_of_gene';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        q: undefined,
        df: undefined,
        sf: undefined,
        cf: undefined,
        extraFields: undefined,
      };

      await searchNcbiGenes(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?terms=BRCA1&maxList=7&sf=GeneID%2CSymbol%2CSynonyms%2Cdescription%2Cchromosome%2Cmap_location%2Ctype_of_gene%2CHGNC_ID%2CdbXrefs&df=_code_system%2C_code%2Cchromosome%2CSymbol%2Cdescription%2Ctype_of_gene&cf=GeneID&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        q: '',
        extraFields: '',
      };

      await searchNcbiGenes(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?terms=BRCA1&maxList=7&sf=GeneID%2CSymbol%2CSynonyms%2Cdescription%2Cchromosome%2Cmap_location%2Ctype_of_gene%2CHGNC_ID%2CdbXrefs&df=_code_system%2C_code%2Cchromosome%2CSymbol%2Cdescription%2Ctype_of_gene&cf=GeneID&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['672', '7157'], // codes
        {
          // extraData
          GeneID: ['672', '7157'],
          HGNC_ID: ['HGNC:1100', 'HGNC:11998'],
          Symbol: ['BRCA1', 'TP53'],
          Synonyms: [
            'BRCAI|BRCC1|BROVCA1|FANCS|IRIS|PNCA4|PPP1R53|PSCP|RNF53',
            'BCC7|BMFS5|LFS1|P53|TRP53',
          ],
          dbXrefs: [
            'MIM:113705|HGNC:HGNC:1100|Ensembl:ENSG00000012048',
            'MIM:191170|HGNC:HGNC:11998|Ensembl:ENSG00000141510',
          ],
          chromosome: ['17', '17'],
          map_location: ['17q21.31', '17p13.1'],
          type_of_gene: ['protein-coding', 'protein-coding'],
        },
        [
          ['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding'],
          ['NCBI', '7157', '17', 'TP53', 'tumor protein p53', 'protein-coding'],
        ], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        extraFields: 'GeneID,HGNC_ID,Symbol,Synonyms,dbXrefs,chromosome,map_location,type_of_gene',
      };

      const result = await searchNcbiGenes(args);

      expect(result.results).toEqual([
        {
          code: '672',
          display: 'NCBI | 672 | 17 | BRCA1 | BRCA1 DNA repair associated | protein-coding',
          GeneID: '672',
          HGNC_ID: 'HGNC:1100',
          Symbol: 'BRCA1',
          Synonyms: 'BRCAI|BRCC1|BROVCA1|FANCS|IRIS|PNCA4|PPP1R53|PSCP|RNF53',
          dbXrefs: 'MIM:113705|HGNC:HGNC:1100|Ensembl:ENSG00000012048',
          chromosome: '17',
          map_location: '17q21.31',
          type_of_gene: 'protein-coding',
        },
        {
          code: '7157',
          display: 'NCBI | 7157 | 17 | TP53 | tumor protein p53 | protein-coding',
          GeneID: '7157',
          HGNC_ID: 'HGNC:11998',
          Symbol: 'TP53',
          Synonyms: 'BCC7|BMFS5|LFS1|P53|TRP53',
          dbXrefs: 'MIM:191170|HGNC:HGNC:11998|Ensembl:ENSG00000141510',
          chromosome: '17',
          map_location: '17p13.1',
          type_of_gene: 'protein-coding',
        },
      ]);
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['672'], // codes
        null, // extraData is null
        [['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        extraFields: 'HGNC_ID,Symbol,chromosome',
      };

      const result = await searchNcbiGenes(args);

      expect(result.results).toEqual([
        {
          code: '672',
          display: 'NCBI | 672 | 17 | BRCA1 | BRCA1 DNA repair associated | protein-coding',
        },
      ]);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['672', '7157'], // 2 codes
        {},
        [
          ['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding'],
          ['NCBI', '7157', '17', 'TP53', 'tumor protein p53', 'protein-coding'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        offset: 0,
      };

      const result = await searchNcbiGenes(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['672', '7157'], // 2 codes
        {},
        [
          ['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding'],
          ['NCBI', '7157', '17', 'TP53', 'tumor protein p53', 'protein-coding'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        offset: 0,
      };

      const result = await searchNcbiGenes(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['672'], // 1 code
        {},
        [['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        offset: 10,
      };

      const result = await searchNcbiGenes(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: NcbiGenesMethodArgs = {
        terms: '',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        maxList: 600, // exceeds limit
      };

      await searchNcbiGenes(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        offset: -5, // negative offset
      };

      await searchNcbiGenes(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Network error'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['672']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Invalid API response format'
      );
    });

    test('should handle invalid response structure', async () => {
      const mockResponse = [
        50, // total
        'invalid codes', // codes should be array
        {},
        [['Test']], // displayData
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Invalid response structure from NCBI Genes API'
      );
    });

    test('should handle invalid display data structure', async () => {
      const mockResponse = [
        50, // total
        ['672'], // codes
        {},
        'invalid display data', // displayData should be array
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Invalid response structure from NCBI Genes API'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Unknown error'
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle empty results', async () => {
      const mockApiResponse = [
        0, // total count
        [], // codes
        {}, // extra data
        [], // display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchNcbiGenes(args);

      expect(result.method).toBe('ncbi-genes');
      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
      expect(result.pagination).toEqual({
        offset: 0,
        count: 0,
        hasMore: false,
      });
    });

    test('should handle null totalCount', async () => {
      const mockApiResponse = [
        null, // null total count
        ['672'],
        {},
        [['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      const result = await searchNcbiGenes(args);

      expect(result.totalCount).toBe(0); // Should default to 0
    });

    test('should handle non-array codes or displayData', async () => {
      const mockApiResponse = [
        1,
        'not an array', // codes should be array
        {},
        'not an array', // displayData should be array
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
      };

      await expect(searchNcbiGenes(args)).rejects.toThrow(
        'Failed to search NCBI Genes: Invalid response structure from NCBI Genes API'
      );
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1 & TP53 (tumor)',
      };

      await searchNcbiGenes(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=BRCA1+%26+TP53+%28tumor%29');
    });
  });

  describe('NCBI Genes specific features', () => {
    test('should handle NCBI Genes specific extra fields', async () => {
      const mockApiResponse = [
        1, // total
        ['672'], // codes
        {
          // extraData
          GeneID: ['672'],
          HGNC_ID: ['HGNC:1100'],
          Symbol: ['BRCA1'],
          Synonyms: ['BRCAI|BRCC1|BROVCA1|FANCS|IRIS|PNCA4|PPP1R53|PSCP|RNF53'],
          dbXrefs: ['MIM:113705|HGNC:HGNC:1100|Ensembl:ENSG00000012048'],
          chromosome: ['17'],
          map_location: ['17q21.31'],
          description: ['BRCA1 DNA repair associated'],
          type_of_gene: ['protein-coding'],
          na_symbol: ['BRCA1'],
          na_name: ['BRCA1 DNA repair associated'],
          Other_designations: [
            'BRCA1, DNA repair associated|breast cancer 1|breast cancer 1, early onset',
          ],
          Modification_date: ['20240315'],
          _code_system: ['NCBI'],
          _code: ['672'],
        },
        [['NCBI', '672', '17', 'BRCA1', 'BRCA1 DNA repair associated', 'protein-coding']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1',
        extraFields:
          'GeneID,HGNC_ID,Symbol,Synonyms,dbXrefs,chromosome,map_location,description,type_of_gene,na_symbol,na_name,Other_designations,Modification_date,_code_system,_code',
      };

      const result = await searchNcbiGenes(args);

      expect(result.results).toEqual([
        {
          code: '672',
          display: 'NCBI | 672 | 17 | BRCA1 | BRCA1 DNA repair associated | protein-coding',
          GeneID: '672',
          HGNC_ID: 'HGNC:1100',
          Symbol: 'BRCA1',
          Synonyms: 'BRCAI|BRCC1|BROVCA1|FANCS|IRIS|PNCA4|PPP1R53|PSCP|RNF53',
          dbXrefs: 'MIM:113705|HGNC:HGNC:1100|Ensembl:ENSG00000012048',
          chromosome: '17',
          map_location: '17q21.31',
          description: 'BRCA1 DNA repair associated',
          type_of_gene: 'protein-coding',
          na_symbol: 'BRCA1',
          na_name: 'BRCA1 DNA repair associated',
          Other_designations:
            'BRCA1, DNA repair associated|breast cancer 1|breast cancer 1, early onset',
          Modification_date: '20240315',
          _code_system: 'NCBI',
          _code: '672',
        },
      ]);
    });

    test('should handle complex synonyms and cross-references', async () => {
      const mockApiResponse = [
        1, // total
        ['7157'], // codes
        {
          // extraData
          Synonyms: ['BCC7|BMFS5|LFS1|P53|TRP53'],
          dbXrefs: [
            'MIM:191170|HGNC:HGNC:11998|Ensembl:ENSG00000141510|UniProtKB/Swiss-Prot:P04637',
          ],
          Other_designations: [
            'tumor protein p53|antigen NY-CO-13|cellular tumor antigen p53|phosphoprotein p53|transformation-related protein 53|tumor suppressor p53',
          ],
        },
        [['NCBI', '7157', '17', 'TP53', 'tumor protein p53', 'protein-coding']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'TP53',
        extraFields: 'Synonyms,dbXrefs,Other_designations',
      };

      const result = await searchNcbiGenes(args);

      expect(result.results[0].Synonyms).toBe('BCC7|BMFS5|LFS1|P53|TRP53');
      expect(result.results[0].dbXrefs).toBe(
        'MIM:191170|HGNC:HGNC:11998|Ensembl:ENSG00000141510|UniProtKB/Swiss-Prot:P04637'
      );
      expect(result.results[0].Other_designations).toBe(
        'tumor protein p53|antigen NY-CO-13|cellular tumor antigen p53|phosphoprotein p53|transformation-related protein 53|tumor suppressor p53'
      );
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NcbiGenesMethodArgs = {
        terms: 'BRCA1 & TP53 genes',
        q: 'chromosome:17 AND type_of_gene:protein-coding',
        sf: 'Symbol,Synonyms,description',
        df: 'GeneID,Symbol,chromosome,description',
      };

      await searchNcbiGenes(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?terms=BRCA1+%26+TP53+genes&maxList=7&sf=Symbol%2CSynonyms%2Cdescription&df=GeneID%2CSymbol%2Cchromosome%2Cdescription&cf=GeneID&offset=0&q=chromosome%3A17+AND+type_of_gene%3Aprotein-coding'
      );
    });
  });
});
