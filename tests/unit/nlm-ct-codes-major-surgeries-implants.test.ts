/// <reference types="jest" />
import { searchMajorSurgeriesImplants } from '../../src/tools/nlm-ct-codes/major-surgeries-implants.js';
import { MajorSurgeriesImplantsMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchMajorSurgeriesImplants', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search Major Surgeries and Implants successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['GS001', 'CV002', 'OR003'], // codes
        {}, // extra data
        [
          // display data
          ['Gastrostomy'],
          ['Coronary artery bypass graft'],
          ['Orthopedic knee implant'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.method).toBe('major-surgeries-implants');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: 'GS001',
        display: 'Gastrostomy',
      });
      expect(result.results[1]).toEqual({
        code: 'CV002',
        display: 'Coronary artery bypass graft',
      });
      expect(result.results[2]).toEqual({
        code: 'OR003',
        display: 'Orthopedic knee implant',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/procedures/v3/search?terms=gastrostomy&maxList=7&sf=consumer_name%2Cprimary_name%2Cword_synonyms%2Csynonyms%2Cterm_icd9_code%2Cterm_icd9_text&df=consumer_name&cf=key_id&offset=0'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle array display strings correctly', async () => {
      const mockApiResponse = [
        5, // total count
        ['GS001', 'CV002'], // codes
        {}, // extra data
        [
          // display data with multiple elements
          ['Gastrostomy', 'Feeding tube placement'],
          ['Coronary artery bypass graft', 'CABG', 'Heart bypass surgery'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: 'GS001',
        display: 'Gastrostomy | Feeding tube placement',
      });
      expect(result.results[1]).toEqual({
        code: 'CV002',
        display: 'Coronary artery bypass graft | CABG | Heart bypass surgery',
      });
    });

    test('should handle non-array display strings', async () => {
      const mockApiResponse = [
        1, // total count
        ['GS001'], // codes
        {}, // extra data
        ['Gastrostomy'], // display data as string
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: 'GS001',
        display: 'Gastrostomy',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'test',
      };

      await searchMajorSurgeriesImplants(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/procedures/v3/search?terms=test&maxList=7&sf=consumer_name%2Cprimary_name%2Cword_synonyms%2Csynonyms%2Cterm_icd9_code%2Cterm_icd9_text&df=consumer_name&cf=key_id&offset=0';
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

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        maxList: 10,
        offset: 20,
        count: 5,
        q: 'term_icd9_code:*',
        df: 'consumer_name,primary_name,term_icd9_code',
        sf: 'consumer_name,primary_name',
        cf: 'key_id',
        extraFields: 'primary_name,term_icd9_code,term_icd9_text',
      };

      await searchMajorSurgeriesImplants(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/procedures/v3/search?terms=gastrostomy&maxList=10&sf=consumer_name%2Cprimary_name&df=consumer_name%2Cprimary_name%2Cterm_icd9_code&cf=key_id&offset=20&count=5&q=term_icd9_code%3A*&ef=primary_name%2Cterm_icd9_code%2Cterm_icd9_text';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        q: undefined,
        df: undefined,
        sf: undefined,
        cf: undefined,
        extraFields: undefined,
      };

      await searchMajorSurgeriesImplants(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/procedures/v3/search?terms=gastrostomy&maxList=7&sf=consumer_name%2Cprimary_name%2Cword_synonyms%2Csynonyms%2Cterm_icd9_code%2Cterm_icd9_text&df=consumer_name&cf=key_id&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        q: '',
        extraFields: '',
      };

      await searchMajorSurgeriesImplants(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/procedures/v3/search?terms=gastrostomy&maxList=7&sf=consumer_name%2Cprimary_name%2Cword_synonyms%2Csynonyms%2Cterm_icd9_code%2Cterm_icd9_text&df=consumer_name&cf=key_id&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['GS001', 'CV002'], // codes
        {
          // extraData
          procedure_primary_name: ['Gastrostomy', 'Coronary artery bypass graft'],
          procedure_consumer_name: ['Feeding tube placement', 'Heart bypass surgery'],
          procedure_icd9_code: ['43.1', '36.10'],
          procedure_icd9_text: [
            'Gastrostomy',
            'Aortocoronary bypass for heart revascularization, not otherwise specified',
          ],
        },
        [['Gastrostomy'], ['Coronary artery bypass graft']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        extraFields:
          'procedure_primary_name,procedure_consumer_name,procedure_icd9_code,procedure_icd9_text',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.results).toEqual([
        {
          code: 'GS001',
          display: 'Gastrostomy',
          procedure_primary_name: 'Gastrostomy',
          procedure_consumer_name: 'Feeding tube placement',
          procedure_icd9_code: '43.1',
          procedure_icd9_text: 'Gastrostomy',
        },
        {
          code: 'CV002',
          display: 'Coronary artery bypass graft',
          procedure_primary_name: 'Coronary artery bypass graft',
          procedure_consumer_name: 'Heart bypass surgery',
          procedure_icd9_code: '36.10',
          procedure_icd9_text:
            'Aortocoronary bypass for heart revascularization, not otherwise specified',
        },
      ]);
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['GS001'], // codes
        null, // extraData is null
        [['Gastrostomy']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        extraFields: 'procedure_primary_name,procedure_icd9_code',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.results).toEqual([
        {
          code: 'GS001',
          display: 'Gastrostomy',
        },
      ]);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['GS001', 'CV002'], // 2 codes
        {},
        [['Gastrostomy'], ['Coronary artery bypass graft']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        offset: 0,
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['GS001', 'CV002'], // 2 codes
        {},
        [['Gastrostomy'], ['Coronary artery bypass graft']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        offset: 0,
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['GS001'], // 1 code
        {},
        [['Gastrostomy']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        offset: 10,
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: '',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        maxList: 600, // exceeds limit
      };

      await searchMajorSurgeriesImplants(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        offset: -5, // negative offset
      };

      await searchMajorSurgeriesImplants(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Network error'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['GS001']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Invalid API response format'
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

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Invalid response structure from Major Surgeries and Implants API'
      );
    });

    test('should handle invalid display data structure', async () => {
      const mockResponse = [
        50, // total
        ['GS001'], // codes
        {},
        'invalid display data', // displayData should be array
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Invalid response structure from Major Surgeries and Implants API'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Unknown error'
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

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.method).toBe('major-surgeries-implants');
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
        ['GS001'],
        {},
        [['Gastrostomy']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      const result = await searchMajorSurgeriesImplants(args);

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

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
      };

      await expect(searchMajorSurgeriesImplants(args)).rejects.toThrow(
        'Failed to search Major Surgeries and Implants: Invalid response structure from Major Surgeries and Implants API'
      );
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy & bypass (major)',
      };

      await searchMajorSurgeriesImplants(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=gastrostomy+%26+bypass+%28major%29');
    });
  });

  describe('Major Surgeries and Implants specific features', () => {
    test('should handle Major Surgeries and Implants specific extra fields', async () => {
      const mockApiResponse = [
        1, // total
        ['GS001'], // codes
        {
          // extraData
          procedure_primary_name: ['Gastrostomy'],
          procedure_consumer_name: ['Feeding tube placement'],
          procedure_key_id: ['GS001'],
          procedure_icd9_code: ['43.1'],
          procedure_icd9_text: ['Gastrostomy'],
          procedure_word_synonyms: ['feeding tube placement stomach'],
          procedure_synonyms: ['PEG tube placement', 'Percutaneous endoscopic gastrostomy'],
          procedure_info_links: [['https://example.com/gastrostomy-info']],
        },
        [['Gastrostomy']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy',
        extraFields:
          'procedure_primary_name,procedure_consumer_name,procedure_key_id,procedure_icd9_code,procedure_icd9_text,procedure_word_synonyms,procedure_synonyms,procedure_info_links',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.results).toEqual([
        {
          code: 'GS001',
          display: 'Gastrostomy',
          procedure_primary_name: 'Gastrostomy',
          procedure_consumer_name: 'Feeding tube placement',
          procedure_key_id: 'GS001',
          procedure_icd9_code: '43.1',
          procedure_icd9_text: 'Gastrostomy',
          procedure_word_synonyms: 'feeding tube placement stomach',
          procedure_synonyms: 'PEG tube placement',
          procedure_info_links: ['https://example.com/gastrostomy-info'],
        },
      ]);
    });

    test('should handle complex synonyms structure', async () => {
      const mockApiResponse = [
        1, // total
        ['CV002'], // codes
        {
          // extraData
          procedure_synonyms: [
            [
              'CABG',
              'Heart bypass surgery',
              'Coronary artery bypass surgery',
              'Aortocoronary bypass',
            ],
          ],
          procedure_word_synonyms: [
            [
              'coronary heart cardiac',
              'artery vessel',
              'bypass graft',
              'surgery operation procedure',
            ],
          ],
        },
        [['Coronary artery bypass graft']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'bypass',
        extraFields: 'procedure_synonyms,procedure_word_synonyms',
      };

      const result = await searchMajorSurgeriesImplants(args);

      expect(result.results[0].procedure_synonyms).toEqual([
        'CABG',
        'Heart bypass surgery',
        'Coronary artery bypass surgery',
        'Aortocoronary bypass',
      ]);
      expect(result.results[0].procedure_word_synonyms).toEqual([
        'coronary heart cardiac',
        'artery vessel',
        'bypass graft',
        'surgery operation procedure',
      ]);
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: MajorSurgeriesImplantsMethodArgs = {
        terms: 'gastrostomy & bypass surgery',
        q: 'term_icd9_code:* AND primary_name:gastrostomy',
        sf: 'consumer_name,primary_name,synonyms',
        df: 'consumer_name,primary_name,term_icd9_code',
      };

      await searchMajorSurgeriesImplants(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/procedures/v3/search?terms=gastrostomy+%26+bypass+surgery&maxList=7&sf=consumer_name%2Cprimary_name%2Csynonyms&df=consumer_name%2Cprimary_name%2Cterm_icd9_code&cf=key_id&offset=0&q=term_icd9_code%3A*+AND+primary_name%3Agastrostomy'
      );
    });
  });
});
