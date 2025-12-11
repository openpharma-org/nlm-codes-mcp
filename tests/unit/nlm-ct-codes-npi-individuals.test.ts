/// <reference types="jest" />
import { searchNpiIndividuals } from '../../src/tools/nlm-ct-codes/npi-individuals.js';
import { NpiIndividualsMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchNpiIndividuals', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search NPI Individuals successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['1234567890', '9876543210', '5555555555'], // codes (NPIs)
        {}, // extra data
        [
          // display data
          ['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001'],
          ['9876543210', 'Dr. Jane Doe', 'Cardiology', '456 Oak Ave, Los Angeles, CA 90210'],
          ['5555555555', 'Dr. Mike Johnson', 'Pediatrics', '789 Pine Rd, Chicago, IL 60601'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.method).toBe('npi-individuals');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: '1234567890',
        npi: '1234567890',
        fullName: 'Dr. John Smith',
        providerType: 'Internal Medicine',
        practiceAddress: '123 Main St, New York, NY 10001',
      });
      expect(result.results[1]).toEqual({
        code: '9876543210',
        npi: '9876543210',
        fullName: 'Dr. Jane Doe',
        providerType: 'Cardiology',
        practiceAddress: '456 Oak Ave, Los Angeles, CA 90210',
      });
      expect(result.results[2]).toEqual({
        code: '5555555555',
        npi: '5555555555',
        fullName: 'Dr. Mike Johnson',
        providerType: 'Pediatrics',
        practiceAddress: '789 Pine Rd, Chicago, IL 60601',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=Smith&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI'
      );
      expect(mockFetch.calls[0][1]).toEqual({
        headers: {
          'User-Agent': 'codes-mcp-server/0.1.2',
        },
      });
    });

    test('should handle incomplete display data gracefully', async () => {
      const mockApiResponse = [
        5, // total count
        ['1234567890', '9876543210'], // codes
        {}, // extra data
        [
          // display data with missing elements
          ['1234567890', 'Dr. John Smith'],
          ['9876543210', 'Dr. Jane Doe', 'Cardiology'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: '1234567890',
        npi: '1234567890',
        fullName: 'Dr. John Smith',
        providerType: '',
        practiceAddress: '',
      });
      expect(result.results[1]).toEqual({
        code: '9876543210',
        npi: '9876543210',
        fullName: 'Dr. Jane Doe',
        providerType: 'Cardiology',
        practiceAddress: '',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'test',
      };

      await searchNpiIndividuals(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=test&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI';
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

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        maxList: 10,
        offset: 20,
        count: 5,
        searchFields: 'NPI,name.full,provider_type',
        displayFields: 'NPI,name.full,provider_type,addr_practice.full',
        additionalQuery: 'addr_practice.state:CA',
        extraFields: 'gender,name.first,name.last,addr_practice.city',
      };

      await searchNpiIndividuals(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=Smith&maxList=10&count=5&offset=20&sf=NPI%2Cname.full%2Cprovider_type&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI&ef=gender%2Cname.first%2Cname.last%2Caddr_practice.city&q=addr_practice.state%3ACA';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        searchFields: undefined,
        displayFields: undefined,
        additionalQuery: undefined,
        extraFields: undefined,
      };

      await searchNpiIndividuals(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=Smith&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        additionalQuery: '   ',
        extraFields: '   ',
      };

      await searchNpiIndividuals(args);

      // Empty string parameters after trimming are still added to the URL
      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=Smith&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI&ef=&q=';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should trim whitespace from optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        additionalQuery: '  addr_practice.state:CA  ',
        extraFields: '  gender,name.first  ',
      };

      await searchNpiIndividuals(args);

      expect(mockFetch.calls[0][0]).toContain('q=addr_practice.state%3ACA');
      expect(mockFetch.calls[0][0]).toContain('ef=gender%2Cname.first');
    });
  });

  describe('Extra data handling', () => {
    test('should include basic extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['1234567890', '9876543210'], // codes
        {
          // extraData
          gender: ['M', 'F'],
          'name.first': ['John', 'Jane'],
          'name.last': ['Smith', 'Doe'],
          'name.credential': ['MD', 'MD'],
          'addr_practice.city': ['New York', 'Los Angeles'],
          'addr_practice.state': ['NY', 'CA'],
        },
        [
          ['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001'],
          ['9876543210', 'Dr. Jane Doe', 'Cardiology', '456 Oak Ave, Los Angeles, CA 90210'],
        ], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        extraFields:
          'gender,name.first,name.last,name.credential,addr_practice.city,addr_practice.state',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results).toEqual([
        {
          code: '1234567890',
          npi: '1234567890',
          fullName: 'Dr. John Smith',
          providerType: 'Internal Medicine',
          practiceAddress: '123 Main St, New York, NY 10001',
          gender: 'M',
          firstName: 'John',
          lastName: 'Smith',
          credential: 'MD',
          practiceCity: 'New York',
          practiceState: 'NY',
        },
        {
          code: '9876543210',
          npi: '9876543210',
          fullName: 'Dr. Jane Doe',
          providerType: 'Cardiology',
          practiceAddress: '456 Oak Ave, Los Angeles, CA 90210',
          gender: 'F',
          firstName: 'Jane',
          lastName: 'Doe',
          credential: 'MD',
          practiceCity: 'Los Angeles',
          practiceState: 'CA',
        },
      ]);
    });

    test('should handle comprehensive extra fields', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData with many fields
          gender: ['M'],
          'name.first': ['John'],
          'name.last': ['Smith'],
          'name.middle': ['Michael'],
          'name.credential': ['MD'],
          'name.prefix': ['Dr.'],
          'name.suffix': ['Jr.'],
          'addr_practice.line1': ['123 Main St'],
          'addr_practice.line2': ['Suite 100'],
          'addr_practice.city': ['New York'],
          'addr_practice.state': ['NY'],
          'addr_practice.zip': ['10001'],
          'addr_practice.phone': ['212-555-0123'],
          'addr_practice.fax': ['212-555-0124'],
          'addr_practice.country': ['US'],
          'addr_mailing.full': ['456 Oak Ave, Brooklyn, NY 11201'],
          'addr_mailing.line1': ['456 Oak Ave'],
          'addr_mailing.city': ['Brooklyn'],
          'addr_mailing.state': ['NY'],
          'addr_mailing.zip': ['11201'],
          'name_other.full': ['John M. Smith'],
          'name_other.first': ['John'],
          'name_other.last': ['Smith'],
          other_ids: [[{ type: 'DEA', number: 'AB1234567' }]],
          licenses: [[{ state: 'NY', number: 'LIC123456', expiration: '2025-12-31' }]],
          'misc.enumeration_date': ['2020-01-15'],
          'misc.last_update_date': ['2024-03-15'],
          'misc.is_sole_proprietor': [true],
          'misc.replacement_NPI': [null],
        },
        [['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        extraFields:
          'gender,name.first,name.last,name.middle,name.credential,name.prefix,name.suffix,addr_practice.line1,addr_practice.line2,addr_practice.city,addr_practice.state,addr_practice.zip,addr_practice.phone,addr_practice.fax,addr_practice.country,addr_mailing.full,addr_mailing.line1,addr_mailing.city,addr_mailing.state,addr_mailing.zip,name_other.full,name_other.first,name_other.last,other_ids,licenses,misc.enumeration_date,misc.last_update_date,misc.is_sole_proprietor,misc.replacement_NPI',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results[0]).toEqual({
        code: '1234567890',
        npi: '1234567890',
        fullName: 'Dr. John Smith',
        providerType: 'Internal Medicine',
        practiceAddress: '123 Main St, New York, NY 10001',
        gender: 'M',
        firstName: 'John',
        lastName: 'Smith',
        middleName: 'Michael',
        credential: 'MD',
        namePrefix: 'Dr.',
        nameSuffix: 'Jr.',
        practiceAddressLine1: '123 Main St',
        practiceAddressLine2: 'Suite 100',
        practiceCity: 'New York',
        practiceState: 'NY',
        practiceZip: '10001',
        practicePhone: '212-555-0123',
        practiceFax: '212-555-0124',
        practiceCountry: 'US',
        mailingAddress: '456 Oak Ave, Brooklyn, NY 11201',
        mailingAddressLine1: '456 Oak Ave',
        mailingCity: 'Brooklyn',
        mailingState: 'NY',
        mailingZip: '11201',
        otherNameFull: 'John M. Smith',
        otherNameFirst: 'John',
        otherNameLast: 'Smith',
        otherIds: [{ type: 'DEA', number: 'AB1234567' }],
        licenses: [{ state: 'NY', number: 'LIC123456', expiration: '2025-12-31' }],
        enumerationDate: '2020-01-15',
        lastUpdateDate: '2024-03-15',
        isSoleProprietor: true,
        // Note: replacementNPI is null in the data but not included in the result as it's falsy
      });
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        null, // extraData is null
        [['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        extraFields: 'gender,name.first,name.last',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results).toEqual([
        {
          code: '1234567890',
          npi: '1234567890',
          fullName: 'Dr. John Smith',
          providerType: 'Internal Medicine',
          practiceAddress: '123 Main St, New York, NY 10001',
        },
      ]);
    });
  });

  describe('Pagination', () => {
    test('should calculate hasMore correctly when there are more results', async () => {
      const mockApiResponse = [
        100, // total count
        ['1234567890', '9876543210'], // 2 codes
        {},
        [
          ['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001'],
          ['9876543210', 'Dr. Jane Doe', 'Cardiology', '456 Oak Ave, Los Angeles, CA 90210'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        offset: 0,
      };

      const result = await searchNpiIndividuals(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: true, // 100 > (0 + 2)
      });
    });

    test('should calculate hasMore correctly when no more results', async () => {
      const mockApiResponse = [
        2, // total count
        ['1234567890', '9876543210'], // 2 codes
        {},
        [
          ['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001'],
          ['9876543210', 'Dr. Jane Doe', 'Cardiology', '456 Oak Ave, Los Angeles, CA 90210'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        offset: 0,
      };

      const result = await searchNpiIndividuals(args);

      expect(result.pagination).toEqual({
        offset: 0,
        count: 2,
        hasMore: false, // 2 <= (0 + 2)
      });
    });

    test('should handle pagination with offset', async () => {
      const mockApiResponse = [
        50, // total count
        ['1234567890'], // 1 code
        {},
        [['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        offset: 10,
      };

      const result = await searchNpiIndividuals(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: NpiIndividualsMethodArgs = {
        terms: '',
      };

      await expect(searchNpiIndividuals(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        maxList: 600, // exceeds limit
      };

      await searchNpiIndividuals(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        offset: -5, // negative offset
      };

      await searchNpiIndividuals(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });

    test('should validate count parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        count: 600, // exceeds limit
      };

      await searchNpiIndividuals(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('count=500');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      await expect(searchNpiIndividuals(args)).rejects.toThrow(
        'Failed to search NPI Individual records: Network error'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      await expect(searchNpiIndividuals(args)).rejects.toThrow(
        'Failed to search NPI Individual records: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      await expect(searchNpiIndividuals(args)).rejects.toThrow(
        'Failed to search NPI Individual records: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['1234567890']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      await expect(searchNpiIndividuals(args)).rejects.toThrow(
        'Failed to search NPI Individual records: Invalid API response format'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      await expect(searchNpiIndividuals(args)).rejects.toThrow(
        'Failed to search NPI Individual records: Unknown error'
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

      const args: NpiIndividualsMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.method).toBe('npi-individuals');
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
        ['1234567890'],
        {},
        [['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      const result = await searchNpiIndividuals(args);

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

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results).toEqual([]);
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: "O'Connor & Associates",
      };

      await searchNpiIndividuals(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=O%27Connor+%26+Associates');
    });
  });

  describe('NPI Individuals specific features', () => {
    test('should handle gender field specific to individuals', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData
          gender: ['F'],
        },
        [['1234567890', 'Dr. Jane Smith', 'Pediatrics', '123 Main St, New York, NY 10001']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        extraFields: 'gender',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results[0].gender).toBe('F');
    });

    test('should handle complex license and ID structures', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData
          other_ids: [
            [
              { type: 'DEA', number: 'AB1234567', state: 'NY' },
              { type: 'MEDICAID', number: 'MED123456', state: 'NY' },
            ],
          ],
          licenses: [
            [
              { state: 'NY', number: 'LIC123456', expiration: '2025-12-31' },
              { state: 'NJ', number: 'LIC789012', expiration: '2024-06-30' },
            ],
          ],
        },
        [['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        extraFields: 'other_ids,licenses',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results[0].otherIds).toEqual([
        { type: 'DEA', number: 'AB1234567', state: 'NY' },
        { type: 'MEDICAID', number: 'MED123456', state: 'NY' },
      ]);
      expect(result.results[0].licenses).toEqual([
        { state: 'NY', number: 'LIC123456', expiration: '2025-12-31' },
        { state: 'NJ', number: 'LIC789012', expiration: '2024-06-30' },
      ]);
    });

    test('should handle boolean fields correctly', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData
          'misc.is_sole_proprietor': [true],
          'misc.is_org_subpart': [false],
        },
        [['1234567890', 'Dr. John Smith', 'Internal Medicine', '123 Main St, New York, NY 10001']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith',
        extraFields: 'misc.is_sole_proprietor,misc.is_org_subpart',
      };

      const result = await searchNpiIndividuals(args);

      expect(result.results[0].isSoleProprietor).toBe(true);
      expect(result.results[0].isOrgSubpart).toBe(false);
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiIndividualsMethodArgs = {
        terms: 'Smith & Associates',
        additionalQuery: 'addr_practice.state:CA AND provider_type:Internal*',
        searchFields: 'NPI,name.full,provider_type',
        displayFields: 'NPI,name.full,provider_type,addr_practice.full',
      };

      await searchNpiIndividuals(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=Smith+%26+Associates&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI&q=addr_practice.state%3ACA+AND+provider_type%3AInternal*'
      );
    });
  });
});
