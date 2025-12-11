/// <reference types="jest" />
import { searchHcpcsLII } from '../../src/tools/nlm-ct-codes/hcpcs-LII.js';
import { HcpcsMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchHcpcsLII', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search HCPCS codes successfully with minimal parameters', async () => {
      const mockApiResponse = [
        25, // total count
        ['E0470', 'E0471', 'E0472'], // codes
        {}, // extra data
        [
          // display data
          ['E0470', 'Respiratory assist device'],
          ['E0471', 'Expiratory positive airway pressure device'],
          ['E0472', 'Respiratory assist device, bi-level pressure capability'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'oxygen',
      };

      const result = await searchHcpcsLII(args);

      expect(result.method).toBe('hcpcs-LII');
      expect(result.totalCount).toBe(25);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'Respiratory assist device',
      });
      expect(result.results[1]).toEqual({
        code: 'E0471',
        display: 'Expiratory positive airway pressure device',
      });
      expect(result.results[2]).toEqual({
        code: 'E0472',
        display: 'Respiratory assist device, bi-level pressure capability',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=oxygen&maxList=7&count=7&offset=0&sf=code%2Cshort_desc%2Clong_desc&df=code%2Cdisplay&cf=code'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle single display strings correctly', async () => {
      const mockApiResponse = [
        5, // total count
        ['E0470', 'E0471'], // codes
        {}, // extra data
        [
          // display data
          ['Single display string'],
          ['Another single display'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'Single display string',
      });
      expect(result.results[1]).toEqual({
        code: 'E0471',
        display: 'Another single display',
      });
    });

    test('should handle non-array display strings', async () => {
      const mockApiResponse = [
        1, // total count
        ['E0470'], // codes
        {}, // extra data
        ['Simple string display'], // display data (not nested array)
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'E0470', // Falls back to code when display is not properly formatted
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'test',
      };

      await searchHcpcsLII(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=test&maxList=7&count=7&offset=0&sf=code%2Cshort_desc%2Clong_desc&df=code%2Cdisplay&cf=code';
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

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
        maxList: 10,
        count: 5,
        offset: 20,
        searchFields: 'code,short_desc',
        displayFields: 'code,short_desc,long_desc',
        additionalQuery: 'manual wheelchair',
        extraFields: 'short_desc,long_desc,obsolete',
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=wheelchair&maxList=10&count=5&offset=20&sf=code%2Cshort_desc&df=code%2Cshort_desc%2Clong_desc&cf=code&ef=short_desc%2Clong_desc%2Cobsolete&q=manual+wheelchair'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'glucose',
        maxList: undefined,
        count: undefined,
        offset: undefined,
        searchFields: undefined,
        displayFields: undefined,
        additionalQuery: undefined,
        extraFields: undefined,
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=glucose&maxList=7&count=7&offset=0&sf=code%2Cshort_desc%2Clong_desc&df=code%2Cdisplay&cf=code'
      );
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
        additionalQuery: '',
        extraFields: '',
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=device&maxList=7&count=7&offset=0&sf=code%2Cshort_desc%2Clong_desc&df=code%2Cdisplay&cf=code'
      );
    });

    test('should handle whitespace in additional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
        additionalQuery: '  manual wheelchair  ',
        extraFields: '  short_desc,long_desc  ',
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=device&maxList=7&count=7&offset=0&sf=code%2Cshort_desc%2Clong_desc&df=code%2Cdisplay&cf=code&ef=short_desc%2Clong_desc&q=manual+wheelchair'
      );
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields in results when available', async () => {
      const mockApiResponse = [
        1, // total count
        ['E0470'], // codes
        {
          // extra data
          short_desc: ['Respiratory assist device'],
          long_desc: ['Respiratory assist device, includes any type unless otherwise specified'],
          add_dt: ['20200101'],
          term_dt: ['20201231'],
          act_eff_dt: ['20200101'],
          obsolete: [false],
          is_noc: [true],
        },
        [['E0470', 'Respiratory assist device']], // display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'respiratory',
        extraFields: 'short_desc,long_desc,add_dt,term_dt,act_eff_dt,obsolete,is_noc',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'Respiratory assist device',
        shortDescription: 'Respiratory assist device',
        longDescription: 'Respiratory assist device, includes any type unless otherwise specified',
        addDate: '20200101',
        termDate: '20201231',
        actualEffectiveDate: '20200101',
        obsolete: false,
        isNoc: true,
      });
    });

    test('should handle missing extra data fields gracefully', async () => {
      const mockApiResponse = [
        2, // total count
        ['E0470', 'E0471'], // codes
        {
          // extra data - only partial fields
          short_desc: ['Respiratory assist device'], // Missing second entry
          long_desc: ['Long description 1', 'Long description 2'],
          obsolete: [false, true],
        },
        [
          ['E0470', 'Display 1'],
          ['E0471', 'Display 2'],
        ], // display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'Display 1',
        shortDescription: 'Respiratory assist device',
        longDescription: 'Long description 1',
        obsolete: false,
      });
      expect(result.results[1]).toEqual({
        code: 'E0471',
        display: 'Display 2',
        longDescription: 'Long description 2',
        obsolete: true,
      });
    });

    test('should handle non-object extra data', async () => {
      const mockApiResponse = [
        1, // total count
        ['E0470'], // codes
        null, // extra data is null
        [['E0470', 'Display']], // display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'Display',
      });
    });
  });

  describe('Pagination', () => {
    test('should calculate pagination correctly when hasMore is true', async () => {
      const mockApiResponse = [
        100, // total count
        ['E0470', 'E0471'], // codes (2 results)
        {},
        [
          ['E0470', 'Display 1'],
          ['E0471', 'Display 2'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
        offset: 10,
        count: 2,
      };

      const result = await searchHcpcsLII(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 2,
        hasMore: true, // 100 > (10 + 2)
      });
    });

    test('should calculate pagination correctly when hasMore is false', async () => {
      const mockApiResponse = [
        12, // total count
        ['E0470', 'E0471'], // codes (2 results)
        {},
        [
          ['E0470', 'Display 1'],
          ['E0471', 'Display 2'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
        offset: 10,
        count: 2,
      };

      const result = await searchHcpcsLII(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 2,
        hasMore: false, // 12 <= (10 + 2)
      });
    });
  });

  describe('Error handling', () => {
    test('should throw error when API request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
      };

      await expect(searchHcpcsLII(args)).rejects.toThrow(
        'Failed to search HCPCS Level II codes: Network error'
      );
    });

    test('should throw error when API response is invalid format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ['invalid'], // Less than 4 elements
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
      };

      await expect(searchHcpcsLII(args)).rejects.toThrow(
        'Failed to search HCPCS Level II codes: Invalid API response format'
      );
    });

    test('should throw error when API response is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
      };

      await expect(searchHcpcsLII(args)).rejects.toThrow(
        'Failed to search HCPCS Level II codes: Invalid API response format'
      );
    });

    test('should throw error when HTTP response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
      };

      await expect(searchHcpcsLII(args)).rejects.toThrow(
        'Failed to search HCPCS Level II codes: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle unknown error types', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error type' as any);

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair',
      };

      await expect(searchHcpcsLII(args)).rejects.toThrow(
        'Failed to search HCPCS Level II codes: Unknown error'
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

      const args: HcpcsMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchHcpcsLII(args);

      expect(result.totalCount).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.pagination).toEqual({
        offset: 0,
        count: 0,
        hasMore: false,
      });
    });

    test('should handle missing display data for some codes', async () => {
      const mockApiResponse = [
        3, // total count
        ['E0470', 'E0471', 'E0472'], // codes
        {}, // extra data
        [
          ['E0470', 'Display 1'],
          ['E0471', 'Display 2'],
        ], // display data (only 2 elements for 3 codes)
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: 'E0470',
        display: 'Display 1',
      });
      expect(result.results[1]).toEqual({
        code: 'E0471',
        display: 'Display 2',
      });
      expect(result.results[2]).toEqual({
        code: 'E0472',
        display: 'E0472', // Falls back to code when no display data available
      });
    });

    test('should handle non-array codes or displayStrings', async () => {
      const mockApiResponse = [
        1, // total count
        'invalid codes', // not an array
        {},
        [], // displayStrings
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device',
      };

      const result = await searchHcpcsLII(args);

      expect(result.results).toHaveLength(0);
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'wheelchair & accessories',
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=wheelchair+%26+accessories&maxList=7&count=7&offset=0&sf=code%2Cshort_desc%2Clong_desc&df=code%2Cdisplay&cf=code'
      );
    });
  });

  describe('URL construction', () => {
    test('should correctly encode URL parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'device with spaces',
        additionalQuery: 'manual wheelchair & accessories',
        searchFields: 'code,short_desc',
        displayFields: 'code,display',
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=device+with+spaces&maxList=7&count=7&offset=0&sf=code%2Cshort_desc&df=code%2Cdisplay&cf=code&q=manual+wheelchair+%26+accessories'
      );
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: HcpcsMethodArgs = {
        terms: '', // Empty string should be invalid
      };

      await expect(searchHcpcsLII(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should apply maxList limits', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'test',
        maxList: 1000, // Should be capped at 500
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should apply count limits', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'test',
        count: 1000, // Should be capped at 500
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toContain('count=500');
    });

    test('should ensure non-negative offset', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: HcpcsMethodArgs = {
        terms: 'test',
        offset: -10, // Should be set to 0
      };

      await searchHcpcsLII(args);

      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });
});
