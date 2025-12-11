/// <reference types="jest" />
import { searchRxTerms } from '../../src/tools/nlm-ct-codes/rx-terms.js';
import { RxTermsMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchRxTerms', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search RxTerms successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['arava 10 mg oral tablet', 'arava 20 mg oral tablet', 'arava 100 mg oral tablet'], // codes
        {}, // extra data
        [['arava 10 mg oral tablet'], ['arava 20 mg oral tablet'], ['arava 100 mg oral tablet']], // display data
        [], // code systems
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      const result = await searchRxTerms(args);

      expect(result.method).toBe('rx-terms');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: 'arava 10 mg oral tablet',
        display: 'arava 10 mg oral tablet',
      });
      expect(result.results[1]).toEqual({
        code: 'arava 20 mg oral tablet',
        display: 'arava 20 mg oral tablet',
      });
      expect(result.results[2]).toEqual({
        code: 'arava 100 mg oral tablet',
        display: 'arava 100 mg oral tablet',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=arava&maxList=7&sf=DISPLAY_NAME%2CDISPLAY_NAME_SYNONYM&df=DISPLAY_NAME&cf=DISPLAY_NAME&offset=0'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle single element display data', async () => {
      const mockApiResponse = [
        5, // total count
        ['lisinopril 10 mg oral tablet', 'lisinopril 20 mg oral tablet'], // codes
        {}, // extra data
        ['lisinopril 10 mg oral tablet', 'lisinopril 20 mg oral tablet'], // display data as strings, not arrays
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'lisinopril',
      };

      const result = await searchRxTerms(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: 'lisinopril 10 mg oral tablet',
        display: 'lisinopril 10 mg oral tablet',
      });
      expect(result.results[1]).toEqual({
        code: 'lisinopril 20 mg oral tablet',
        display: 'lisinopril 20 mg oral tablet',
      });
    });

    test('should handle array display data by joining with pipes', async () => {
      const mockApiResponse = [
        3, // total count
        ['metformin 500 mg oral tablet'], // codes
        {}, // extra data
        [
          [
            'metformin 500 mg oral tablet',
            'metformin hydrochloride 500 mg oral tablet',
            'METFORMIN 500MG TAB',
          ],
        ], // display data as array
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'metformin',
      };

      const result = await searchRxTerms(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: 'metformin 500 mg oral tablet',
        display:
          'metformin 500 mg oral tablet | metformin hydrochloride 500 mg oral tablet | METFORMIN 500MG TAB',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'test',
      };

      await searchRxTerms(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=test&maxList=7&sf=DISPLAY_NAME%2CDISPLAY_NAME_SYNONYM&df=DISPLAY_NAME&cf=DISPLAY_NAME&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });
  });

  describe('Parameter handling', () => {
    test('should include all optional parameters in API request', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        maxList: 10,
        offset: 20,
        count: 5,
        sf: 'DISPLAY_NAME',
        df: 'DISPLAY_NAME,STRENGTHS_AND_FORMS',
        cf: 'DISPLAY_NAME',
        q: 'strength:*10*',
        extraFields: 'STRENGTHS_AND_FORMS,RXCUIS',
      };

      await searchRxTerms(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=arava&maxList=10&sf=DISPLAY_NAME&df=DISPLAY_NAME%2CSTRENGTHS_AND_FORMS&cf=DISPLAY_NAME&offset=20&count=5&q=strength%3A*10*&ef=STRENGTHS_AND_FORMS%2CRXCUIS';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        sf: undefined,
        df: undefined,
        cf: undefined,
        q: undefined,
        extraFields: undefined,
      };

      await searchRxTerms(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=arava&maxList=7&sf=DISPLAY_NAME%2CDISPLAY_NAME_SYNONYM&df=DISPLAY_NAME&cf=DISPLAY_NAME&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        q: '',
        extraFields: '',
      };

      await searchRxTerms(args);

      // Empty string parameters are not added to the URL (they're falsy)
      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=arava&maxList=7&sf=DISPLAY_NAME%2CDISPLAY_NAME_SYNONYM&df=DISPLAY_NAME&cf=DISPLAY_NAME&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle search field parameters correctly', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'lisinopril',
        sf: 'DISPLAY_NAME_SYNONYM',
        df: 'DISPLAY_NAME,STRENGTHS_AND_FORMS',
        cf: 'RXCUIS',
      };

      await searchRxTerms(args);

      expect(mockFetch.calls[0][0]).toContain('sf=DISPLAY_NAME_SYNONYM');
      expect(mockFetch.calls[0][0]).toContain('df=DISPLAY_NAME%2CSTRENGTHS_AND_FORMS');
      expect(mockFetch.calls[0][0]).toContain('cf=RXCUIS');
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['arava 10 mg oral tablet', 'arava 20 mg oral tablet'], // codes
        {
          // extraData
          STRENGTHS_AND_FORMS: [
            ['10 mg oral tablet', '10 mg tablet'],
            ['20 mg oral tablet', '20 mg tablet'],
          ],
          RXCUIS: [
            ['152923', '209224'],
            ['152924', '209225'],
          ],
          DISPLAY_NAME_SYNONYM: ['arava 10 mg tab', 'arava 20 mg tab'],
        },
        [['arava 10 mg oral tablet'], ['arava 20 mg oral tablet']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        extraFields: 'STRENGTHS_AND_FORMS,RXCUIS,DISPLAY_NAME_SYNONYM',
      };

      const result = await searchRxTerms(args);

      expect(result.results).toEqual([
        {
          code: 'arava 10 mg oral tablet',
          display: 'arava 10 mg oral tablet',
          STRENGTHS_AND_FORMS: ['10 mg oral tablet', '10 mg tablet'],
          RXCUIS: ['152923', '209224'],
          DISPLAY_NAME_SYNONYM: 'arava 10 mg tab',
        },
        {
          code: 'arava 20 mg oral tablet',
          display: 'arava 20 mg oral tablet',
          STRENGTHS_AND_FORMS: ['20 mg oral tablet', '20 mg tablet'],
          RXCUIS: ['152924', '209225'],
          DISPLAY_NAME_SYNONYM: 'arava 20 mg tab',
        },
      ]);
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['arava 10 mg oral tablet'], // codes
        null, // extraData is null
        [['arava 10 mg oral tablet']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        extraFields: 'STRENGTHS_AND_FORMS,RXCUIS',
      };

      const result = await searchRxTerms(args);

      expect(result.results).toEqual([
        {
          code: 'arava 10 mg oral tablet',
          display: 'arava 10 mg oral tablet',
        },
      ]);
    });

    test('should handle empty extra data object', async () => {
      const mockApiResponse = [
        1, // total
        ['arava 10 mg oral tablet'], // codes
        {}, // empty extraData
        [['arava 10 mg oral tablet']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        extraFields: 'STRENGTHS_AND_FORMS',
      };

      const result = await searchRxTerms(args);

      expect(result.results).toEqual([
        {
          code: 'arava 10 mg oral tablet',
          display: 'arava 10 mg oral tablet',
        },
      ]);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['arava 10 mg oral tablet', 'arava 20 mg oral tablet'], // 2 codes
        {},
        [['arava 10 mg oral tablet'], ['arava 20 mg oral tablet']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        offset: 0,
      };

      const result = await searchRxTerms(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['arava 10 mg oral tablet', 'arava 20 mg oral tablet'], // 2 codes
        {},
        [['arava 10 mg oral tablet'], ['arava 20 mg oral tablet']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        offset: 0,
      };

      const result = await searchRxTerms(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['arava 10 mg oral tablet'], // 1 code
        {},
        [['arava 10 mg oral tablet']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        offset: 10,
      };

      const result = await searchRxTerms(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: RxTermsMethodArgs = {
        terms: '',
      };

      await expect(searchRxTerms(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        maxList: 600, // exceeds limit
      };

      await searchRxTerms(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
        offset: -5, // negative offset
      };

      await searchRxTerms(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      await expect(searchRxTerms(args)).rejects.toThrow('Failed to search RxTerms: Network error');
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      await expect(searchRxTerms(args)).rejects.toThrow(
        'Failed to search RxTerms: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      await expect(searchRxTerms(args)).rejects.toThrow(
        'Failed to search RxTerms: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['arava 10 mg oral tablet']]; // Missing displayData and other elements
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      await expect(searchRxTerms(args)).rejects.toThrow(
        'Failed to search RxTerms: Invalid API response format'
      );
    });

    test('should handle invalid response structure', async () => {
      const mockResponse = [50, 'not an array', {}, []]; // codes should be array
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      await expect(searchRxTerms(args)).rejects.toThrow(
        'Failed to search RxTerms: Invalid response structure from RxTerms API'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      await expect(searchRxTerms(args)).rejects.toThrow('Failed to search RxTerms: Unknown error');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty results', async () => {
      const mockApiResponse = [
        0, // total count
        [], // codes
        {}, // extra data
        [], // display data
        [], // code systems
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'nonexistentdrug',
      };

      const result = await searchRxTerms(args);

      expect(result.method).toBe('rx-terms');
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
        ['arava 10 mg oral tablet'],
        {},
        [['arava 10 mg oral tablet']],
        [],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'arava',
      };

      const result = await searchRxTerms(args);

      expect(result.totalCount).toBe(0); // Should default to 0
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'aspirin/dipyridamole 25-200 mg',
      };

      await searchRxTerms(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=aspirin%2Fdipyridamole+25-200+mg');
    });
  });

  describe('RxTerms specific features', () => {
    test('should handle RXCUI and strengths fields', async () => {
      const mockApiResponse = [
        1, // total
        ['metformin 500 mg oral tablet'], // codes
        {
          // extraData
          RXCUIS: [['860975', '860976']],
          STRENGTHS_AND_FORMS: [['500 mg oral tablet', '500 mg tab']],
          SXDG_RXCUI: ['123456'],
        },
        [['metformin 500 mg oral tablet']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'metformin',
        extraFields: 'RXCUIS,STRENGTHS_AND_FORMS,SXDG_RXCUI',
      };

      const result = await searchRxTerms(args);

      expect(result.results[0]).toEqual({
        code: 'metformin 500 mg oral tablet',
        display: 'metformin 500 mg oral tablet',
        RXCUIS: ['860975', '860976'],
        STRENGTHS_AND_FORMS: ['500 mg oral tablet', '500 mg tab'],
        SXDG_RXCUI: '123456',
      });
    });

    test('should handle display name synonyms', async () => {
      const mockApiResponse = [
        1, // total
        ['lisinopril 10 mg oral tablet'], // codes
        {
          // extraData
          DISPLAY_NAME_SYNONYM: [['LISINOPRIL 10MG TAB', 'PRINIVIL 10MG TAB', 'ZESTRIL 10MG TAB']],
        },
        [['lisinopril 10 mg oral tablet']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'lisinopril',
        extraFields: 'DISPLAY_NAME_SYNONYM',
      };

      const result = await searchRxTerms(args);

      expect(result.results[0]).toEqual({
        code: 'lisinopril 10 mg oral tablet',
        display: 'lisinopril 10 mg oral tablet',
        DISPLAY_NAME_SYNONYM: ['LISINOPRIL 10MG TAB', 'PRINIVIL 10MG TAB', 'ZESTRIL 10MG TAB'],
      });
    });

    test('should handle complex drug name patterns', async () => {
      const mockApiResponse = [
        2, // total
        [
          'insulin lispro 100 unit/ml prefilled pen',
          'insulin lispro protamine/insulin lispro 75-25 unit/ml vial',
        ], // codes
        {
          // extraData
          STRENGTHS_AND_FORMS: [
            ['100 unit/ml prefilled pen', '100 unit/ml pen injector'],
            ['75-25 unit/ml vial', '75-25 unit/ml injection vial'],
          ],
        },
        [
          [
            'insulin lispro 100 unit/ml prefilled pen',
            'HUMALOG 100 unit/ml prefilled pen',
            'insulin lispro (human recombinant) 100 unit/ml prefilled pen',
          ],
          ['insulin lispro protamine/insulin lispro 75-25 unit/ml vial', 'HUMALOG MIX75/25 vial'],
        ], // displayData with multiple synonyms
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'insulin lispro',
        extraFields: 'STRENGTHS_AND_FORMS',
      };

      const result = await searchRxTerms(args);

      expect(result.results).toEqual([
        {
          code: 'insulin lispro 100 unit/ml prefilled pen',
          display:
            'insulin lispro 100 unit/ml prefilled pen | HUMALOG 100 unit/ml prefilled pen | insulin lispro (human recombinant) 100 unit/ml prefilled pen',
          STRENGTHS_AND_FORMS: ['100 unit/ml prefilled pen', '100 unit/ml pen injector'],
        },
        {
          code: 'insulin lispro protamine/insulin lispro 75-25 unit/ml vial',
          display:
            'insulin lispro protamine/insulin lispro 75-25 unit/ml vial | HUMALOG MIX75/25 vial',
          STRENGTHS_AND_FORMS: ['75-25 unit/ml vial', '75-25 unit/ml injection vial'],
        },
      ]);
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockApiResponse = [0, [], {}, [], []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: RxTermsMethodArgs = {
        terms: 'aspirin & codeine',
        q: 'strength:*325* AND form:tablet',
        sf: 'DISPLAY_NAME,DISPLAY_NAME_SYNONYM',
        df: 'DISPLAY_NAME,STRENGTHS_AND_FORMS',
      };

      await searchRxTerms(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=aspirin+%26+codeine&maxList=7&sf=DISPLAY_NAME%2CDISPLAY_NAME_SYNONYM&df=DISPLAY_NAME%2CSTRENGTHS_AND_FORMS&cf=DISPLAY_NAME&offset=0&q=strength%3A*325*+AND+form%3Atablet'
      );
    });
  });
});
