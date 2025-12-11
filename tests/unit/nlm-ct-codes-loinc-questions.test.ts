/// <reference types="jest" />
import { searchLoincQuestions } from '../../src/tools/nlm-ct-codes/loinc-questions.js';
import { LoincQuestionsMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchLoincQuestions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search LOINC Questions successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['45593-1', '72133-2', '8310-5'], // codes
        {}, // extra data
        [
          // display data
          ['How often do you walk for exercise?'],
          ['Does your heart pound or race?'],
          ['Height'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      const result = await searchLoincQuestions(args);

      expect(result.method).toBe('loinc-questions');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: '45593-1',
        display: 'How often do you walk for exercise?',
      });
      expect(result.results[1]).toEqual({
        code: '72133-2',
        display: 'Does your heart pound or race?',
      });
      expect(result.results[2]).toEqual({
        code: '8310-5',
        display: 'Height',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=walk&maxList=7&sf=text%2CCOMPONENT%2CCONSUMER_NAME%2CRELATEDNAMES2%2CMETHOD_TYP%2CSHORTNAME%2CLONG_COMMON_NAME%2CLOINC_NUM&df=text&cf=LOINC_NUM&offset=0'
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
        ['45593-1', '72133-2'], // codes
        {}, // extra data
        [
          // display data with multiple elements
          ['How often do you walk for exercise?', 'Walking frequency question'],
          ['Does your heart pound or race?', 'Heart pounding question'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      const result = await searchLoincQuestions(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: '45593-1',
        display: 'How often do you walk for exercise? | Walking frequency question',
      });
      expect(result.results[1]).toEqual({
        code: '72133-2',
        display: 'Does your heart pound or race? | Heart pounding question',
      });
    });

    test('should handle non-array display strings', async () => {
      const mockApiResponse = [
        1, // total count
        ['45593-1'], // codes
        {}, // extra data
        ['How often do you walk for exercise?'], // display data as string
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      const result = await searchLoincQuestions(args);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        code: '45593-1',
        display: 'How often do you walk for exercise?',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'test',
      };

      await searchLoincQuestions(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=test&maxList=7&sf=text%2CCOMPONENT%2CCONSUMER_NAME%2CRELATEDNAMES2%2CMETHOD_TYP%2CSHORTNAME%2CLONG_COMMON_NAME%2CLOINC_NUM&df=text&cf=LOINC_NUM&offset=0';
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

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        maxList: 10,
        offset: 20,
        count: 5,
        q: 'datatype:CNE',
        df: 'text,LOINC_NUM,COMPONENT',
        sf: 'text,COMPONENT',
        cf: 'LOINC_NUM',
        extraFields: 'PROPERTY,METHOD_TYP,datatype',
        excludeCopyrighted: true,
      };

      await searchLoincQuestions(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=walk&maxList=10&sf=text%2CCOMPONENT&df=text%2CLOINC_NUM%2CCOMPONENT&cf=LOINC_NUM&offset=20&count=5&q=datatype%3ACNE&ef=PROPERTY%2CMETHOD_TYP%2Cdatatype&excludeCopyrighted=true';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        q: undefined,
        df: undefined,
        sf: undefined,
        cf: undefined,
        extraFields: undefined,
        type: undefined,
        available: undefined,
        excludeCopyrighted: undefined,
      };

      await searchLoincQuestions(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=walk&maxList=7&sf=text%2CCOMPONENT%2CCONSUMER_NAME%2CRELATEDNAMES2%2CMETHOD_TYP%2CSHORTNAME%2CLONG_COMMON_NAME%2CLOINC_NUM&df=text&cf=LOINC_NUM&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        q: '',
        extraFields: '',
      };

      await searchLoincQuestions(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=walk&maxList=7&sf=text%2CCOMPONENT%2CCONSUMER_NAME%2CRELATEDNAMES2%2CMETHOD_TYP%2CSHORTNAME%2CLONG_COMMON_NAME%2CLOINC_NUM&df=text&cf=LOINC_NUM&offset=0';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle boolean parameters correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        excludeCopyrighted: false,
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('excludeCopyrighted=false');
    });
  });

  describe('Type parameter handling', () => {
    test('should handle question type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'question',
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=question');
    });

    test('should handle form type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'form',
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=form');
    });

    test('should handle form_and_section type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'form_and_section',
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=form_and_section');
    });

    test('should handle panel type', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'panel',
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=panel');
    });

    test('should handle form type with available parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'form',
        available: true,
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=form');
      expect(mockFetch.calls[0][0]).toContain('available=true');
    });

    test('should handle form_and_section type with available parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'form_and_section',
        available: false,
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=form_and_section');
      expect(mockFetch.calls[0][0]).toContain('available=false');
    });

    test('should ignore available parameter for non-form types', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        type: 'question',
        available: true,
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls[0][0]).toContain('type=question');
      expect(mockFetch.calls[0][0]).not.toContain('available=');
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['45593-1', '72133-2'], // codes
        {
          // extraData
          PROPERTY: ['Find', 'Find'],
          METHOD_TYP: ['Reported', 'Reported'],
          datatype: ['CNE', 'CNE'],
          COMPONENT: ['Physical activity', 'Heart pounding'],
        },
        [['How often do you walk for exercise?'], ['Does your heart pound or race?']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        extraFields: 'PROPERTY,METHOD_TYP,datatype,COMPONENT',
      };

      const result = await searchLoincQuestions(args);

      expect(result.results).toEqual([
        {
          code: '45593-1',
          display: 'How often do you walk for exercise?',
          PROPERTY: 'Find',
          METHOD_TYP: 'Reported',
          datatype: 'CNE',
          COMPONENT: 'Physical activity',
        },
        {
          code: '72133-2',
          display: 'Does your heart pound or race?',
          PROPERTY: 'Find',
          METHOD_TYP: 'Reported',
          datatype: 'CNE',
          COMPONENT: 'Heart pounding',
        },
      ]);
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['45593-1'], // codes
        null, // extraData is null
        [['How often do you walk for exercise?']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        extraFields: 'PROPERTY,METHOD_TYP',
      };

      const result = await searchLoincQuestions(args);

      expect(result.results).toEqual([
        {
          code: '45593-1',
          display: 'How often do you walk for exercise?',
        },
      ]);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['45593-1', '72133-2'], // 2 codes
        {},
        [['How often do you walk for exercise?'], ['Does your heart pound or race?']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        offset: 0,
      };

      const result = await searchLoincQuestions(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['45593-1', '72133-2'], // 2 codes
        {},
        [['How often do you walk for exercise?'], ['Does your heart pound or race?']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        offset: 0,
      };

      const result = await searchLoincQuestions(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['45593-1'], // 1 code
        {},
        [['How often do you walk for exercise?']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        offset: 10,
      };

      const result = await searchLoincQuestions(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: LoincQuestionsMethodArgs = {
        terms: '',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        maxList: 600, // exceeds limit
      };

      await searchLoincQuestions(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        offset: -5, // negative offset
      };

      await searchLoincQuestions(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Network error'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['45593-1']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Invalid API response format'
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

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Invalid response structure from LOINC Questions API'
      );
    });

    test('should handle invalid display data structure', async () => {
      const mockResponse = [
        50, // total
        ['45593-1'], // codes
        {},
        'invalid display data', // displayData should be array
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Invalid response structure from LOINC Questions API'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Unknown error'
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

      const args: LoincQuestionsMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchLoincQuestions(args);

      expect(result.method).toBe('loinc-questions');
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
        ['45593-1'],
        {},
        [['How often do you walk for exercise?']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      const result = await searchLoincQuestions(args);

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

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
      };

      await expect(searchLoincQuestions(args)).rejects.toThrow(
        'Failed to search LOINC Questions: Invalid response structure from LOINC Questions API'
      );
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk & exercise (daily)',
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=walk+%26+exercise+%28daily%29');
    });
  });

  describe('LOINC specific features', () => {
    test('should handle LOINC specific extra fields', async () => {
      const mockApiResponse = [
        1, // total
        ['45593-1'], // codes
        {
          // extraData
          PROPERTY: ['Find'],
          METHOD_TYP: ['Reported'],
          datatype: ['CNE'],
          COMPONENT: ['Physical activity'],
          CONSUMER_NAME: ['How often do you walk for exercise?'],
          LONG_COMMON_NAME: ['How often do you walk for exercise?'],
          SHORTNAME: ['Walk frequency'],
          LOINC_NUM: ['45593-1'],
          AnswerLists: [['Always', 'Often', 'Sometimes', 'Never']],
          units: [null],
          isCopyrighted: [false],
          containsCopyrighted: [false],
          EXTERNAL_COPYRIGHT_NOTICE: [null],
          EXTERNAL_COPYRIGHT_LINK: [null],
        },
        [['How often do you walk for exercise?']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        extraFields:
          'PROPERTY,METHOD_TYP,datatype,COMPONENT,CONSUMER_NAME,LONG_COMMON_NAME,SHORTNAME,LOINC_NUM,AnswerLists,units,isCopyrighted,containsCopyrighted,EXTERNAL_COPYRIGHT_NOTICE,EXTERNAL_COPYRIGHT_LINK',
      };

      const result = await searchLoincQuestions(args);

      expect(result.results).toEqual([
        {
          code: '45593-1',
          display: 'How often do you walk for exercise?',
          PROPERTY: 'Find',
          METHOD_TYP: 'Reported',
          datatype: 'CNE',
          COMPONENT: 'Physical activity',
          CONSUMER_NAME: 'How often do you walk for exercise?',
          LONG_COMMON_NAME: 'How often do you walk for exercise?',
          SHORTNAME: 'Walk frequency',
          LOINC_NUM: '45593-1',
          AnswerLists: ['Always', 'Often', 'Sometimes', 'Never'],
          units: null,
          isCopyrighted: false,
          containsCopyrighted: false,
          EXTERNAL_COPYRIGHT_NOTICE: null,
          EXTERNAL_COPYRIGHT_LINK: null,
        },
      ]);
    });

    test('should handle complex answer lists structure', async () => {
      const mockApiResponse = [
        1, // total
        ['45593-1'], // codes
        {
          // extraData
          AnswerLists: [
            [
              { value: 'LA6111-4', display: 'Always' },
              { value: 'LA6270-8', display: 'Often' },
              { value: 'LA6874-7', display: 'Sometimes' },
              { value: 'LA6568-5', display: 'Never' },
            ],
          ],
        },
        [['How often do you walk for exercise?']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk',
        extraFields: 'AnswerLists',
      };

      const result = await searchLoincQuestions(args);

      expect(result.results[0].AnswerLists).toEqual([
        { value: 'LA6111-4', display: 'Always' },
        { value: 'LA6270-8', display: 'Often' },
        { value: 'LA6874-7', display: 'Sometimes' },
        { value: 'LA6568-5', display: 'Never' },
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

      const args: LoincQuestionsMethodArgs = {
        terms: 'walk & exercise daily',
        q: 'datatype:CNE AND isCopyrighted:false',
        sf: 'text,COMPONENT,CONSUMER_NAME',
        df: 'text,LOINC_NUM,COMPONENT',
        type: 'question',
      };

      await searchLoincQuestions(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=walk+%26+exercise+daily&maxList=7&sf=text%2CCOMPONENT%2CCONSUMER_NAME&df=text%2CLOINC_NUM%2CCOMPONENT&cf=LOINC_NUM&offset=0&q=datatype%3ACNE+AND+isCopyrighted%3Afalse&type=question'
      );
    });
  });
});
