/// <reference types="jest" />
import { searchConditions } from '../../src/tools/nlm-ct-codes/conditions.js';
import { ConditionsMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchConditions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search conditions successfully with minimal parameters', async () => {
      const mockApiResponse = [
        10, // total count
        ['4458', '1234', '5678'], // codes
        {}, // extra data
        [
          // display data
          ['Gastroenteritis', 'Inflammation of stomach and intestines'],
          ['Diabetes mellitus', 'Chronic metabolic disorder'],
          ['Hypertension', 'High blood pressure'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'gastroenteritis',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        code: '4458',
        display: 'Gastroenteritis | Inflammation of stomach and intestines',
      });
      expect(result[1]).toEqual({
        code: '1234',
        display: 'Diabetes mellitus | Chronic metabolic disorder',
      });
      expect(result[2]).toEqual({
        code: '5678',
        display: 'Hypertension | High blood pressure',
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=gastroenteritis'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle single display strings correctly', async () => {
      const mockApiResponse = [
        2, // total count
        ['1234', '5678'], // codes
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

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        code: '1234',
        display: 'Single display string',
      });
      expect(result[1]).toEqual({
        code: '5678',
        display: 'Another single display',
      });
    });

    test('should handle non-array display strings', async () => {
      const mockApiResponse = [
        1, // total count
        ['1234'], // codes
        {}, // extra data
        ['Simple string display'], // display data (not nested array)
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'condition',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: '1234',
        display: 'Simple string display',
      });
    });
  });

  describe('Parameter handling', () => {
    test('should include all optional parameters in API request', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
        maxList: 10,
        count: 5,
        offset: 20,
        q: 'additional query',
        df: 'consumer_name,primary_name',
        sf: 'consumer_name,synonyms',
        cf: 'key_id',
        extraFields: 'icd10cm_codes,word_synonyms',
      };

      await searchConditions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=diabetes&maxList=10&count=5&offset=20&q=additional+query&df=consumer_name%2Cprimary_name&sf=consumer_name%2Csynonyms&cf=key_id&ef=icd10cm_codes%2Cword_synonyms'
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

      const args: ConditionsMethodArgs = {
        terms: 'hypertension',
        maxList: undefined,
        count: undefined,
        offset: undefined,
        q: undefined,
        df: undefined,
        sf: undefined,
        cf: undefined,
        extraFields: undefined,
      };

      await searchConditions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=hypertension'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'condition',
        q: '',
        df: '',
        sf: '',
        cf: '',
        extraFields: '',
      };

      await searchConditions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=condition'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields in results when available', async () => {
      const mockApiResponse = [
        1, // total count
        ['1234'], // codes
        {
          // extra data
          primaryName: ['Primary Condition Name'],
          consumerName: ['Consumer Friendly Name'],
          icd10cmCodes: ['E11.9,E11.0'],
        },
        [['Display Name']], // display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
        extraFields: 'primaryName,consumerName,icd10cmCodes',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: '1234',
        display: 'Display Name',
        primaryName: 'Primary Condition Name',
        consumerName: 'Consumer Friendly Name',
        icd10cmCodes: 'E11.9,E11.0',
      });
    });

    test('should handle missing extra data fields gracefully', async () => {
      const mockApiResponse = [
        2, // total count
        ['1234', '5678'], // codes
        {
          // extra data
          primaryName: ['First Name'], // Only one field, missing second
          consumerName: ['First Consumer', 'Second Consumer'],
        },
        [['Display 1'], ['Display 2']], // display data
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'condition',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        code: '1234',
        display: 'Display 1',
        primaryName: 'First Name',
        consumerName: 'First Consumer',
      });
      expect(result[1]).toEqual({
        code: '5678',
        display: 'Display 2',
        consumerName: 'Second Consumer',
      });
    });
  });

  describe('Error handling', () => {
    test('should throw error when API request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API request failed'));

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchConditions(args)).rejects.toThrow('API request failed');
    });

    test('should throw error when API response is invalid format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ['invalid'], // Less than 4 elements
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchConditions(args)).rejects.toThrow('Invalid API response format');
    });

    test('should throw error when API response is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchConditions(args)).rejects.toThrow('Invalid API response format');
    });

    test('should throw error when codes or displayData are not arrays', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          10, // total count
          'invalid codes', // not an array
          {},
          [], // displayData
        ],
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchConditions(args)).rejects.toThrow(
        'Invalid response structure from Conditions API'
      );
    });

    test('should throw error when displayData is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          10, // total count
          [], // codes
          {},
          'invalid display data', // not an array
        ],
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchConditions(args)).rejects.toThrow(
        'Invalid response structure from Conditions API'
      );
    });

    test('should throw error when HTTP response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes',
      };

      await expect(searchConditions(args)).rejects.toThrow('API request failed: 404 Not Found');
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

      const args: ConditionsMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(0);
    });

    test('should handle missing display data for some codes', async () => {
      const mockApiResponse = [
        3, // total count
        ['1234', '5678', '9012'], // codes
        {}, // extra data
        [['Display 1'], ['Display 2']], // display data (only 2 elements for 3 codes)
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'condition',
      };

      const result = await searchConditions(args);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        code: '1234',
        display: 'Display 1',
      });
      expect(result[1]).toEqual({
        code: '5678',
        display: 'Display 2',
      });
      expect(result[2]).toEqual({
        code: '9012',
        display: undefined,
      });
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'diabetes & hypertension',
      };

      await searchConditions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=diabetes+%26+hypertension'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });
  });

  describe('URL construction', () => {
    test('should correctly encode URL parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: ConditionsMethodArgs = {
        terms: 'condition with spaces',
        q: 'additional query with spaces',
        df: 'field1,field2',
        sf: 'search1,search2',
      };

      await searchConditions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=condition+with+spaces&q=additional+query+with+spaces&df=field1%2Cfield2&sf=search1%2Csearch2'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });
  });
});
