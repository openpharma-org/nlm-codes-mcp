/// <reference types="jest" />
import { searchIcd10Cm } from '../../src/tools/nlm-ct-codes/icd-10-cm.js';
import { IcdMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchIcd10Cm', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search ICD-10-CM codes successfully with minimal parameters', async () => {
      const mockApiResponse = [
        25, // total count
        ['E11.9', 'I10', 'K59.00'], // codes
        {}, // extra data
        [
          // display data
          ['E11.9', 'Type 2 diabetes mellitus without complications'],
          ['I10', 'Essential (primary) hypertension'],
          ['K59.00', 'Constipation, unspecified'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      const result = await searchIcd10Cm(args);

      expect(result.method).toBe('icd-10-cm');
      expect(result.totalCount).toBe(25);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: 'E11.9',
        name: 'Type 2 diabetes mellitus without complications',
      });
      expect(result.results[1]).toEqual({
        code: 'I10',
        name: 'Essential (primary) hypertension',
      });
      expect(result.results[2]).toEqual({
        code: 'K59.00',
        name: 'Constipation, unspecified',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=diabetes&maxList=7&sf=code%2Cname&df=code%2Cname&cf=code&offset=0'
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
        ['E11.9', 'I10'], // codes
        {}, // extra data
        [
          // display data with single elements
          ['Type 2 diabetes mellitus without complications'],
          ['Essential (primary) hypertension'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      const result = await searchIcd10Cm(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: 'E11.9',
        name: 'Type 2 diabetes mellitus without complications',
      });
      expect(result.results[1]).toEqual({
        code: 'I10',
        name: 'Essential (primary) hypertension',
      });
    });

    test('should fallback to code when no display data available', async () => {
      const mockApiResponse = [
        1, // total count
        ['E11.9'], // codes
        {}, // extra data
        [null], // no display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      const result = await searchIcd10Cm(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: 'E11.9',
        name: 'E11.9', // Falls back to code
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'test',
      };

      await searchIcd10Cm(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=test&maxList=7&sf=code%2Cname&df=code%2Cname&cf=code&offset=0';
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

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        maxList: 10,
        offset: 20,
        searchFields: 'code,name',
        displayFields: 'code,name',
        additionalQuery: 'E11*',
      };

      await searchIcd10Cm(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=diabetes&maxList=10&sf=code%2Cname&df=code%2Cname&cf=code&offset=20&q=E11*';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        maxList: undefined,
        offset: undefined,
        searchFields: undefined,
        displayFields: undefined,
        additionalQuery: undefined,
      };

      await searchIcd10Cm(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=diabetes&maxList=7&sf=code%2Cname&df=code%2Cname&cf=code&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string additionalQuery', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        additionalQuery: '',
      };

      await searchIcd10Cm(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=diabetes&maxList=7&sf=code%2Cname&df=code%2Cname&cf=code&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should trim additionalQuery whitespace', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        additionalQuery: '  E11*  ',
      };

      await searchIcd10Cm(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=diabetes&maxList=7&sf=code%2Cname&df=code%2Cname&cf=code&offset=0&q=E11*';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['E11.9', 'I10'], // 2 codes
        {},
        [
          ['E11.9', 'Type 2 diabetes mellitus without complications'],
          ['I10', 'Essential (primary) hypertension'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        offset: 0,
      };

      const result = await searchIcd10Cm(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['E11.9', 'I10'], // 2 codes
        {},
        [
          ['E11.9', 'Type 2 diabetes mellitus without complications'],
          ['I10', 'Essential (primary) hypertension'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        offset: 0,
      };

      const result = await searchIcd10Cm(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['E11.0'], // 1 code
        {},
        [['E11.0', 'Type 2 diabetes mellitus with hyperosmolarity']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        offset: 10,
      };

      const result = await searchIcd10Cm(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: IcdMethodArgs = {
        terms: '',
      };

      await expect(searchIcd10Cm(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        maxList: 600, // exceeds limit
      };

      await searchIcd10Cm(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
        offset: -5, // negative offset
      };

      await searchIcd10Cm(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchIcd10Cm(args)).rejects.toThrow(
        'Failed to search ICD-10-CM codes: Network error'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchIcd10Cm(args)).rejects.toThrow(
        'Failed to search ICD-10-CM codes: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchIcd10Cm(args)).rejects.toThrow(
        'Failed to search ICD-10-CM codes: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [25, ['E11.9']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchIcd10Cm(args)).rejects.toThrow(
        'Failed to search ICD-10-CM codes: Invalid API response format'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchIcd10Cm(args)).rejects.toThrow(
        'Failed to search ICD-10-CM codes: Unknown error'
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

      const args: IcdMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchIcd10Cm(args);

      expect(result.method).toBe('icd-10-cm');
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
        ['E11.9'],
        {},
        [['E11.9', 'Type 2 diabetes mellitus without complications']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      const result = await searchIcd10Cm(args);

      expect(result.totalCount).toBe(0); // Should default to 0
    });

    test('should handle non-array codes or displayStrings', async () => {
      const mockApiResponse = [
        1,
        'not an array', // codes should be array
        {},
        'not an array', // displayStrings should be array
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes',
      };

      const result = await searchIcd10Cm(args);

      expect(result.results).toEqual([]);
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes & hypertension (complex)',
      };

      await searchIcd10Cm(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=diabetes+%26+hypertension+%28complex%29');
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: IcdMethodArgs = {
        terms: 'diabetes & complications',
        additionalQuery: 'type:diagnosis AND status:active',
        searchFields: 'code,name,description',
        displayFields: 'code,name,fullDescription',
      };

      await searchIcd10Cm(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=diabetes+%26+complications&maxList=7&sf=code%2Cname%2Cdescription&df=code%2Cname%2CfullDescription&cf=code&offset=0&q=type%3Adiagnosis+AND+status%3Aactive'
      );
    });
  });
});
