/// <reference types="jest" />
import { searchIcd11 } from '../../src/tools/nlm-ct-codes/icd-11.js';
import { Icd11MethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchIcd11', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search ICD-11 codes successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['1B12.0', 'QB25', '5A11'], // codes
        {}, // extra data
        [
          // display data
          ['1B12.0', 'Pneumonia due to pneumococcus', 'category'],
          ['QB25', 'Hypertensive heart disease', 'category'],
          ['5A11', 'Diabetes mellitus', 'category'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      const result = await searchIcd11(args);

      expect(result.method).toBe('icd-11');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: '1B12.0',
        display: '1B12.0 | Pneumonia due to pneumococcus | category',
      });
      expect(result.results[1]).toEqual({
        code: 'QB25',
        display: 'QB25 | Hypertensive heart disease | category',
      });
      expect(result.results[2]).toEqual({
        code: '5A11',
        display: '5A11 | Diabetes mellitus | category',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=pneumonia&maxList=7&sf=code%2Ctitle&df=code%2Ctitle%2Ctype&cf=code&type=category&offset=0'
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
        ['1B12.0', 'QB25'], // codes
        {}, // extra data
        [
          // display data with single elements
          ['Pneumonia due to pneumococcus'],
          ['Hypertensive heart disease'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      const result = await searchIcd11(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: '1B12.0',
        display: 'Pneumonia due to pneumococcus',
      });
      expect(result.results[1]).toEqual({
        code: 'QB25',
        display: 'Hypertensive heart disease',
      });
    });

    test('should handle non-array display strings', async () => {
      const mockApiResponse = [
        1, // total count
        ['1B12.0'], // codes
        {}, // extra data
        ['Pneumonia due to pneumococcus'], // display data as string
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      const result = await searchIcd11(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: '1B12.0',
        display: 'Pneumonia due to pneumococcus',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'test',
      };

      await searchIcd11(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=test&maxList=7&sf=code%2Ctitle&df=code%2Ctitle%2Ctype&cf=code&type=category&offset=0';
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

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        maxList: 10,
        offset: 20,
        count: 5,
        q: 'chapter:1',
        type: 'stem',
        df: 'code,title,definition',
        sf: 'code,title',
        cf: 'code',
        extraFields: 'definition,chapter',
      };

      await searchIcd11(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=pneumonia&maxList=10&sf=code%2Ctitle&df=code%2Ctitle%2Cdefinition&cf=code&type=stem&offset=20&count=5&q=chapter%3A1&ef=definition%2Cchapter';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        q: undefined,
        type: undefined,
        df: undefined,
        sf: undefined,
        cf: undefined,
        extraFields: undefined,
      };

      await searchIcd11(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=pneumonia&maxList=7&sf=code%2Ctitle&df=code%2Ctitle%2Ctype&cf=code&type=category&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        q: '',
        extraFields: '',
      };

      await searchIcd11(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=pneumonia&maxList=7&sf=code%2Ctitle&df=code%2Ctitle%2Ctype&cf=code&type=category&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });
  });

  describe('Type parameter handling', () => {
    test('should handle stem type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        type: 'stem',
      };

      await searchIcd11(args);

      expect(mockFetch.calls[0][0]).toContain('type=stem');
    });

    test('should handle extension type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        type: 'extension',
      };

      await searchIcd11(args);

      expect(mockFetch.calls[0][0]).toContain('type=extension');
    });

    test('should default to category type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await searchIcd11(args);

      expect(mockFetch.calls[0][0]).toContain('type=category');
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['1B12.0', 'QB25'], // codes
        {
          // extraData
          icd11_title: ['Pneumonia due to pneumococcus', 'Hypertensive heart disease'],
          icd11_definition: [
            'Inflammation of the lungs caused by pneumococcus bacteria',
            'Heart disease caused by high blood pressure',
          ],
          icd11_chapter: ['1', '11'],
        },
        [
          ['1B12.0', 'Pneumonia due to pneumococcus'],
          ['QB25', 'Hypertensive heart disease'],
        ], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        extraFields: 'icd11_title,icd11_definition,icd11_chapter',
      };

      const result = await searchIcd11(args);

      expect(result.results).toEqual([
        {
          code: '1B12.0',
          display: '1B12.0 | Pneumonia due to pneumococcus',
          icd11_title: 'Pneumonia due to pneumococcus',
          icd11_definition: 'Inflammation of the lungs caused by pneumococcus bacteria',
          icd11_chapter: '1',
        },
        {
          code: 'QB25',
          display: 'QB25 | Hypertensive heart disease',
          icd11_title: 'Hypertensive heart disease',
          icd11_definition: 'Heart disease caused by high blood pressure',
          icd11_chapter: '11',
        },
      ]);
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['1B12.0'], // codes
        null, // extraData is null
        [['1B12.0', 'Pneumonia due to pneumococcus']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        extraFields: 'icd11_title,icd11_definition',
      };

      const result = await searchIcd11(args);

      expect(result.results).toEqual([
        {
          code: '1B12.0',
          display: '1B12.0 | Pneumonia due to pneumococcus',
        },
      ]);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['1B12.0', 'QB25'], // 2 codes
        {},
        [
          ['1B12.0', 'Pneumonia due to pneumococcus'],
          ['QB25', 'Hypertensive heart disease'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        offset: 0,
      };

      const result = await searchIcd11(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['1B12.0', 'QB25'], // 2 codes
        {},
        [
          ['1B12.0', 'Pneumonia due to pneumococcus'],
          ['QB25', 'Hypertensive heart disease'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        offset: 0,
      };

      const result = await searchIcd11(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['1B12.0'], // 1 code
        {},
        [['1B12.0', 'Pneumonia due to pneumococcus']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        offset: 10,
      };

      const result = await searchIcd11(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: Icd11MethodArgs = {
        terms: '',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        maxList: 600, // exceeds limit
      };

      await searchIcd11(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        offset: -5, // negative offset
      };

      await searchIcd11(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow('Failed to search ICD-11: Network error');
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'Failed to search ICD-11: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'Failed to search ICD-11: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['1B12.0']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'Failed to search ICD-11: Invalid API response format'
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

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'Failed to search ICD-11: Invalid response structure from ICD-11 API'
      );
    });

    test('should handle invalid display data structure', async () => {
      const mockResponse = [
        50, // total
        ['1B12.0'], // codes
        {},
        'invalid display data', // displayData should be array
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'Failed to search ICD-11: Invalid response structure from ICD-11 API'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow('Failed to search ICD-11: Unknown error');
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

      const args: Icd11MethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchIcd11(args);

      expect(result.method).toBe('icd-11');
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
        ['1B12.0'],
        {},
        [['1B12.0', 'Pneumonia due to pneumococcus']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      const result = await searchIcd11(args);

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

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
      };

      await expect(searchIcd11(args)).rejects.toThrow(
        'Failed to search ICD-11: Invalid response structure from ICD-11 API'
      );
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia & respiratory (complex)',
      };

      await searchIcd11(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=pneumonia+%26+respiratory+%28complex%29');
    });
  });

  describe('ICD-11 specific features', () => {
    test('should handle ICD-11 specific extra fields', async () => {
      const mockApiResponse = [
        1, // total
        ['1B12.0'], // codes
        {
          // extraData
          icd11_title: ['Pneumonia due to pneumococcus'],
          icd11_definition: ['Inflammation of the lungs caused by pneumococcus bacteria'],
          icd11_type: ['stem'],
          icd11_chapter: ['1'],
          icd11_entityId: ['http://id.who.int/icd/entity/123456789'],
          icd11_source: ['http://id.who.int/icd/foundation/123456789'],
          icd11_browserUrl: ['https://icd.who.int/browse11/123456789'],
          icd11_parent: ['http://id.who.int/icd/linearization/parent/123456789'],
        },
        [['1B12.0', 'Pneumonia due to pneumococcus']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: Icd11MethodArgs = {
        terms: 'pneumonia',
        extraFields:
          'icd11_title,icd11_definition,icd11_type,icd11_chapter,icd11_entityId,icd11_source,icd11_browserUrl,icd11_parent',
      };

      const result = await searchIcd11(args);

      expect(result.results).toEqual([
        {
          code: '1B12.0',
          display: '1B12.0 | Pneumonia due to pneumococcus',
          icd11_title: 'Pneumonia due to pneumococcus',
          icd11_definition: 'Inflammation of the lungs caused by pneumococcus bacteria',
          icd11_type: 'stem',
          icd11_chapter: '1',
          icd11_entityId: 'http://id.who.int/icd/entity/123456789',
          icd11_source: 'http://id.who.int/icd/foundation/123456789',
          icd11_browserUrl: 'https://icd.who.int/browse11/123456789',
          icd11_parent: 'http://id.who.int/icd/linearization/parent/123456789',
        },
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

      const args: Icd11MethodArgs = {
        terms: 'pneumonia & respiratory diseases',
        q: 'chapter:1 AND type:stem',
        sf: 'code,title,definition',
        df: 'code,title,type,definition',
      };

      await searchIcd11(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=pneumonia+%26+respiratory+diseases&maxList=7&sf=code%2Ctitle%2Cdefinition&df=code%2Ctitle%2Ctype%2Cdefinition&cf=code&type=category&offset=0&q=chapter%3A1+AND+type%3Astem'
      );
    });
  });
});
