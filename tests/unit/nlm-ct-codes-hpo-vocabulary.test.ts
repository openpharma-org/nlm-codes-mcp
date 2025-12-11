/// <reference types="jest" />
import { searchHpoVocabulary } from '../../src/tools/nlm-ct-codes/hpo-vocabulary.js';
import { HpoVocabularyMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('HPO Vocabulary Search', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should make API request with correct URL and return results', async () => {
      const mockResponse = [
        10, // total
        ['HP:0001871', 'HP:0000822'], // codes
        {
          // extraData
          definition: ['Abnormality of the hematologic system', 'Elevated blood pressure'],
        },
        [['Abnormality of blood and blood-forming tissues'], ['Hypertension']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood pressure',
      };

      const results = await searchHpoVocabulary(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=blood+pressure'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
          definition: 'Abnormality of the hematologic system',
        },
        {
          code: 'HP:0000822',
          display: 'Hypertension',
          definition: 'Elevated blood pressure',
        },
      ]);
    });

    test('should handle single display strings', async () => {
      const mockResponse = [
        1, // total
        ['HP:0001871'], // codes
        {}, // extraData
        ['Abnormality of blood and blood-forming tissues'], // displayData as string
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood abnormality',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
        },
      ]);
    });

    test('should handle array display strings by joining with pipe', async () => {
      const mockResponse = [
        1, // total
        ['HP:0001871'], // codes
        {}, // extraData
        [['Abnormality of blood', 'Blood disorder', 'Hematologic abnormality']], // displayData as array
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood | Blood disorder | Hematologic abnormality',
        },
      ]);
    });
  });

  describe('Parameter handling', () => {
    test('should include all optional parameters in API request', async () => {
      const mockResponse = [1, ['HP:0001871'], {}, ['Test']];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
        maxList: 10,
        count: 5,
        offset: 0,
        q: 'is_obsolete:false',
        df: 'id,name',
        sf: 'id,name,synonym.term',
        cf: 'id',
        extraFields: 'definition,synonym',
      };

      await searchHpoVocabulary(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=seizure&maxList=10&count=5&offset=0&q=is_obsolete%3Afalse&df=id%2Cname&sf=id%2Cname%2Csynonym.term&cf=id&ef=definition%2Csynonym'
      );
    });

    test('should handle undefined optional parameters', async () => {
      const mockResponse = [1, ['HP:0001871'], {}, ['Test']];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
        maxList: undefined,
        count: undefined,
        offset: undefined,
        q: undefined,
        df: undefined,
        sf: undefined,
        cf: undefined,
        extraFields: undefined,
      };

      await searchHpoVocabulary(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=seizure'
      );
    });

    test('should handle empty string optional parameters', async () => {
      const mockResponse = [1, ['HP:0001871'], {}, ['Test']];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
        q: '',
        df: '',
        sf: '',
        cf: '',
        extraFields: '',
      };

      await searchHpoVocabulary(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=seizure'
      );
    });
  });

  describe('Extra data handling', () => {
    test('should include extra fields when available', async () => {
      const mockResponse = [
        2, // total
        ['HP:0001871', 'HP:0000822'], // codes
        {
          // extraData
          definition: ['Abnormality of the hematologic system', 'Elevated blood pressure'],
          synonym: [
            [{ term: 'Blood abnormality', relation: 'exact' }],
            [{ term: 'High blood pressure', relation: 'exact' }],
          ],
          isObsolete: [false, false],
        },
        [['Abnormality of blood and blood-forming tissues'], ['Hypertension']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood pressure',
        extraFields: 'definition,synonym,isObsolete',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
          definition: 'Abnormality of the hematologic system',
          synonym: [{ term: 'Blood abnormality', relation: 'exact' }],
          isObsolete: false,
        },
        {
          code: 'HP:0000822',
          display: 'Hypertension',
          definition: 'Elevated blood pressure',
          synonym: [{ term: 'High blood pressure', relation: 'exact' }],
          isObsolete: false,
        },
      ]);
    });

    test('should handle missing extra data gracefully', async () => {
      const mockResponse = [
        1, // total
        ['HP:0001871'], // codes
        null, // extraData is null
        ['Abnormality of blood and blood-forming tissues'], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood',
        extraFields: 'definition,synonym',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
        },
      ]);
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
      };

      await expect(searchHpoVocabulary(args)).rejects.toThrow('Network error');
    });

    test('should throw error for invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
      };

      await expect(searchHpoVocabulary(args)).rejects.toThrow('Invalid API response format');
    });

    test('should throw error for response with insufficient array elements', async () => {
      const mockResponse = [1, ['HP:0001871']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
      };

      await expect(searchHpoVocabulary(args)).rejects.toThrow('Invalid API response format');
    });

    test('should throw error for invalid response structure', async () => {
      const mockResponse = [
        1, // total
        'invalid codes', // codes should be array
        {},
        ['Test'], // displayData
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
      };

      await expect(searchHpoVocabulary(args)).rejects.toThrow(
        'Invalid response structure from HPO API'
      );
    });

    test('should throw error for invalid display data structure', async () => {
      const mockResponse = [
        1, // total
        ['HP:0001871'], // codes
        {},
        'invalid display data', // displayData should be array
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
      };

      await expect(searchHpoVocabulary(args)).rejects.toThrow(
        'Invalid response structure from HPO API'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure',
      };

      await expect(searchHpoVocabulary(args)).rejects.toThrow(
        'API request failed: 500 Internal Server Error'
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle empty results', async () => {
      const mockResponse = [
        0, // total
        [], // codes
        {}, // extraData
        [], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'nonexistent',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([]);
    });

    test('should handle missing display data for some codes', async () => {
      const mockResponse = [
        2, // total
        ['HP:0001871', 'HP:0000822'], // codes
        {},
        ['Abnormality of blood and blood-forming tissues'], // displayData missing for second code
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood pressure',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
        },
        {
          code: 'HP:0000822',
          display: undefined,
        },
      ]);
    });

    test('should handle special characters in terms', async () => {
      const mockResponse = [1, ['HP:0001871'], {}, ['Test']];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'seizure & epilepsy (complex)',
      };

      await searchHpoVocabulary(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=seizure+%26+epilepsy+%28complex%29'
      );
    });
  });

  describe('HPO-specific features', () => {
    test('should handle HPO-specific extra fields', async () => {
      const mockResponse = [
        1, // total
        ['HP:0001871'], // codes
        {
          // extraData
          definition: ['Abnormality of the hematologic system'],
          createdBy: ['user123'],
          creationDate: ['2023-01-01'],
          isObsolete: [false],
          altId: [['HP:0001872', 'HP:0001873']],
          xref: [['UMLS:C0018939', 'MESH:D006402']],
        },
        [['Abnormality of blood and blood-forming tissues']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood abnormality',
        extraFields: 'definition,createdBy,creationDate,isObsolete,altId,xref',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
          definition: 'Abnormality of the hematologic system',
          createdBy: 'user123',
          creationDate: '2023-01-01',
          isObsolete: false,
          altId: ['HP:0001872', 'HP:0001873'],
          xref: ['UMLS:C0018939', 'MESH:D006402'],
        },
      ]);
    });

    test('should handle complex HPO synonym structures', async () => {
      const mockResponse = [
        1, // total
        ['HP:0001871'], // codes
        {
          // extraData
          synonym: [
            [
              { term: 'Blood abnormality', relation: 'exact', type: 'layperson' },
              { term: 'Hematologic abnormality', relation: 'exact', type: 'medical' },
            ],
          ],
        },
        [['Abnormality of blood and blood-forming tissues']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood',
        extraFields: 'synonym',
      };

      const results = await searchHpoVocabulary(args);

      expect(results).toEqual([
        {
          code: 'HP:0001871',
          display: 'Abnormality of blood and blood-forming tissues',
          synonym: [
            { term: 'Blood abnormality', relation: 'exact', type: 'layperson' },
            { term: 'Hematologic abnormality', relation: 'exact', type: 'medical' },
          ],
        },
      ]);
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: HpoVocabularyMethodArgs = {
        terms: 'blood pressure & heart rate',
        q: 'is_obsolete:false AND type:phenotype',
        df: 'id,name,definition',
        sf: 'id,name,synonym.term',
      };

      await searchHpoVocabulary(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/hpo/v3/search?terms=blood+pressure+%26+heart+rate&q=is_obsolete%3Afalse+AND+type%3Aphenotype&df=id%2Cname%2Cdefinition&sf=id%2Cname%2Csynonym.term'
      );
    });
  });
});
