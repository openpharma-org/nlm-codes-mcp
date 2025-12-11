/// <reference types="jest" />
import { searchNpiOrganizations } from '../../src/tools/nlm-ct-codes/npi-organizations.js';
import { NpiMethodArgs } from '../../src/tools/nlm-ct-codes/types.js';

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

describe('searchNpiOrganizations', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Basic functionality', () => {
    test('should search NPI Organizations successfully with minimal parameters', async () => {
      const mockApiResponse = [
        50, // total count
        ['1234567890', '9876543210', '5555555555'], // codes (NPIs)
        {}, // extra data
        [
          // display data
          ['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905'],
          ['9876543210', 'CLEVELAND CLINIC', 'Hospital', '9500 Euclid Ave, Cleveland, OH 44195'],
          [
            '5555555555',
            'JOHNS HOPKINS HOSPITAL',
            'Hospital',
            '1800 Orleans St, Baltimore, MD 21287',
          ],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.method).toBe('npi-organizations');
      expect(result.totalCount).toBe(50);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        code: '1234567890',
        npi: '1234567890',
        fullName: 'MAYO CLINIC',
        providerType: 'Hospital',
        practiceAddress: '200 First St SW, Rochester, MN 55905',
      });
      expect(result.results[1]).toEqual({
        code: '9876543210',
        npi: '9876543210',
        fullName: 'CLEVELAND CLINIC',
        providerType: 'Hospital',
        practiceAddress: '9500 Euclid Ave, Cleveland, OH 44195',
      });
      expect(result.results[2]).toEqual({
        code: '5555555555',
        npi: '5555555555',
        fullName: 'JOHNS HOPKINS HOSPITAL',
        providerType: 'Hospital',
        practiceAddress: '1800 Orleans St, Baltimore, MD 21287',
      });

      expect(result.pagination).toEqual({
        offset: 0,
        count: 3,
        hasMore: true,
      });

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=CLINIC&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI'
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
          ['1234567890', 'MAYO CLINIC'],
          ['9876543210', 'CLEVELAND CLINIC', 'Hospital'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        code: '1234567890',
        npi: '1234567890',
        fullName: 'MAYO CLINIC',
        providerType: '',
        practiceAddress: '',
      });
      expect(result.results[1]).toEqual({
        code: '9876543210',
        npi: '9876543210',
        fullName: 'CLEVELAND CLINIC',
        providerType: 'Hospital',
        practiceAddress: '',
      });
    });

    test('should use default values correctly', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'test',
      };

      await searchNpiOrganizations(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=test&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI';
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

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        maxList: 10,
        offset: 20,
        count: 5,
        searchFields: 'NPI,name.full,provider_type',
        displayFields: 'NPI,name.full,provider_type,addr_practice.full',
        additionalQuery: 'addr_practice.state:CA',
        extraFields: 'name.first,name.last,addr_practice.city',
      };

      await searchNpiOrganizations(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=CLINIC&maxList=10&count=5&offset=20&sf=NPI%2Cname.full%2Cprovider_type&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI&ef=name.first%2Cname.last%2Caddr_practice.city&q=addr_practice.state%3ACA';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle undefined optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        maxList: undefined,
        offset: undefined,
        count: undefined,
        searchFields: undefined,
        displayFields: undefined,
        additionalQuery: undefined,
        extraFields: undefined,
      };

      await searchNpiOrganizations(args);

      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=CLINIC&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should handle empty string optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        additionalQuery: '   ',
        extraFields: '   ',
      };

      await searchNpiOrganizations(args);

      // Empty string parameters after trimming are still added to the URL
      const expectedUrl =
        'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=CLINIC&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI&ef=&q=';
      expect(mockFetch.calls[0][0]).toBe(expectedUrl);
    });

    test('should trim whitespace from optional parameters', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        additionalQuery: '  addr_practice.state:CA  ',
        extraFields: '  name.first,name.last  ',
      };

      await searchNpiOrganizations(args);

      expect(mockFetch.calls[0][0]).toContain('q=addr_practice.state%3ACA');
      expect(mockFetch.calls[0][0]).toContain('ef=name.first%2Cname.last');
    });
  });

  describe('Extra data handling', () => {
    test('should include basic extra fields when available', async () => {
      const mockApiResponse = [
        2, // total
        ['1234567890', '9876543210'], // codes
        {
          // extraData
          'name.first': ['MAYO', 'CLEVELAND'],
          'name.last': ['CLINIC', 'CLINIC'],
          'addr_practice.city': ['Rochester', 'Cleveland'],
          'addr_practice.state': ['MN', 'OH'],
        },
        [
          ['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905'],
          ['9876543210', 'CLEVELAND CLINIC', 'Hospital', '9500 Euclid Ave, Cleveland, OH 44195'],
        ], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        extraFields: 'name.first,name.last,addr_practice.city,addr_practice.state',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results).toEqual([
        {
          code: '1234567890',
          npi: '1234567890',
          fullName: 'MAYO CLINIC',
          providerType: 'Hospital',
          practiceAddress: '200 First St SW, Rochester, MN 55905',
          firstName: 'MAYO',
          lastName: 'CLINIC',
          practiceCity: 'Rochester',
          practiceState: 'MN',
        },
        {
          code: '9876543210',
          npi: '9876543210',
          fullName: 'CLEVELAND CLINIC',
          providerType: 'Hospital',
          practiceAddress: '9500 Euclid Ave, Cleveland, OH 44195',
          firstName: 'CLEVELAND',
          lastName: 'CLINIC',
          practiceCity: 'Cleveland',
          practiceState: 'OH',
        },
      ]);
    });

    test('should handle comprehensive extra fields', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData with many fields
          'name.first': ['MAYO'],
          'name.last': ['CLINIC'],
          'name.middle': ['MEDICAL'],
          'name.credential': ['LLC'],
          'name.prefix': ['THE'],
          'name.suffix': ['FOUNDATION'],
          'addr_practice.line1': ['200 First St SW'],
          'addr_practice.line2': ['Suite 100'],
          'addr_practice.city': ['Rochester'],
          'addr_practice.state': ['MN'],
          'addr_practice.zip': ['55905'],
          'addr_practice.phone': ['507-284-2511'],
          'addr_practice.fax': ['507-284-2512'],
          'addr_practice.country': ['US'],
          'addr_mailing.full': ['200 First St SW, Rochester, MN 55905'],
          'addr_mailing.line1': ['200 First St SW'],
          'addr_mailing.city': ['Rochester'],
          'addr_mailing.state': ['MN'],
          'addr_mailing.zip': ['55905'],
          'name_other.full': ['MAYO MEDICAL CENTER'],
          'name_other.first': ['MAYO'],
          'name_other.last': ['MEDICAL'],
          other_ids: [[{ type: 'MEDICAID', number: 'MED123456' }]],
          licenses: [[{ state: 'MN', number: 'LIC123456', expiration: '2025-12-31' }]],
          'misc.enumeration_date': ['2020-01-15'],
          'misc.last_update_date': ['2024-03-15'],
          'misc.is_sole_proprietor': [false],
          'misc.is_org_subpart': [true],
          'misc.parent_LBN': ['MAYO FOUNDATION'],
          'misc.parent_TIN': ['987654321'],
        },
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        extraFields:
          'name.first,name.last,name.middle,name.credential,name.prefix,name.suffix,addr_practice.line1,addr_practice.line2,addr_practice.city,addr_practice.state,addr_practice.zip,addr_practice.phone,addr_practice.fax,addr_practice.country,addr_mailing.full,addr_mailing.line1,addr_mailing.city,addr_mailing.state,addr_mailing.zip,name_other.full,name_other.first,name_other.last,other_ids,licenses,misc.enumeration_date,misc.last_update_date,misc.is_sole_proprietor,misc.is_org_subpart,misc.parent_LBN,misc.parent_TIN',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results[0]).toEqual({
        code: '1234567890',
        npi: '1234567890',
        fullName: 'MAYO CLINIC',
        providerType: 'Hospital',
        practiceAddress: '200 First St SW, Rochester, MN 55905',
        firstName: 'MAYO',
        lastName: 'CLINIC',
        middleName: 'MEDICAL',
        credential: 'LLC',
        namePrefix: 'THE',
        nameSuffix: 'FOUNDATION',
        practiceAddressLine1: '200 First St SW',
        practiceAddressLine2: 'Suite 100',
        practiceCity: 'Rochester',
        practiceState: 'MN',
        practiceZip: '55905',
        practicePhone: '507-284-2511',
        practiceFax: '507-284-2512',
        practiceCountry: 'US',
        mailingAddress: '200 First St SW, Rochester, MN 55905',
        mailingAddressLine1: '200 First St SW',
        mailingCity: 'Rochester',
        mailingState: 'MN',
        mailingZip: '55905',
        otherNameFull: 'MAYO MEDICAL CENTER',
        otherNameFirst: 'MAYO',
        otherNameLast: 'MEDICAL',
        otherIds: [{ type: 'MEDICAID', number: 'MED123456' }],
        licenses: [{ state: 'MN', number: 'LIC123456', expiration: '2025-12-31' }],
        enumerationDate: '2020-01-15',
        lastUpdateDate: '2024-03-15',
        isSoleProprietor: false,
        isOrgSubpart: true,
        parentLBN: 'MAYO FOUNDATION',
        parentTIN: '987654321',
      });
    });

    test('should handle missing extra data gracefully', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        null, // extraData is null
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        extraFields: 'name.first,name.last',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results).toEqual([
        {
          code: '1234567890',
          npi: '1234567890',
          fullName: 'MAYO CLINIC',
          providerType: 'Hospital',
          practiceAddress: '200 First St SW, Rochester, MN 55905',
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
          ['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905'],
          ['9876543210', 'CLEVELAND CLINIC', 'Hospital', '9500 Euclid Ave, Cleveland, OH 44195'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        offset: 0,
      };

      const result = await searchNpiOrganizations(args);

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
          ['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905'],
          ['9876543210', 'CLEVELAND CLINIC', 'Hospital', '9500 Euclid Ave, Cleveland, OH 44195'],
        ],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        offset: 0,
      };

      const result = await searchNpiOrganizations(args);

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
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        offset: 10,
      };

      const result = await searchNpiOrganizations(args);

      expect(result.pagination).toEqual({
        offset: 10,
        count: 1,
        hasMore: true, // 50 > (10 + 1)
      });
    });
  });

  describe('Validation', () => {
    test('should validate terms parameter', async () => {
      const args: NpiMethodArgs = {
        terms: '',
      };

      await expect(searchNpiOrganizations(args)).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    test('should validate maxList parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        maxList: 600, // exceeds limit
      };

      await searchNpiOrganizations(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('maxList=500');
    });

    test('should validate offset parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        offset: -5, // negative offset
      };

      await searchNpiOrganizations(args);

      // Should be normalized to 0
      expect(mockFetch.calls[0][0]).toContain('offset=0');
    });

    test('should validate count parameter', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        count: 600, // exceeds limit
      };

      await searchNpiOrganizations(args);

      // Should be capped at 500
      expect(mockFetch.calls[0][0]).toContain('count=500');
    });
  });

  describe('Error handling', () => {
    test('should handle API request failures', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      await expect(searchNpiOrganizations(args)).rejects.toThrow(
        'Failed to search NPI Organization records: Network error'
      );
    });

    test('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      await expect(searchNpiOrganizations(args)).rejects.toThrow(
        'Failed to search NPI Organization records: API request failed: 500 Internal Server Error'
      );
    });

    test('should handle invalid response format', async () => {
      const mockResponse = 'invalid response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      await expect(searchNpiOrganizations(args)).rejects.toThrow(
        'Failed to search NPI Organization records: Invalid API response format'
      );
    });

    test('should handle response with insufficient array elements', async () => {
      const mockResponse = [50, ['1234567890']]; // Missing displayData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      await expect(searchNpiOrganizations(args)).rejects.toThrow(
        'Failed to search NPI Organization records: Invalid API response format'
      );
    });

    test('should handle unknown error types', async () => {
      // Simulate a non-Error object being thrown
      mockFetch.mockRejectedValueOnce('string error' as any);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      await expect(searchNpiOrganizations(args)).rejects.toThrow(
        'Failed to search NPI Organization records: Unknown error'
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

      const args: NpiMethodArgs = {
        terms: 'nonexistent',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.method).toBe('npi-organizations');
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
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      const result = await searchNpiOrganizations(args);

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

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results).toEqual([]);
    });

    test('should handle special characters in terms', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: "ST. MARY'S HOSPITAL & CLINICS",
      };

      await searchNpiOrganizations(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toContain('terms=ST.+MARY%27S+HOSPITAL+%26+CLINICS');
    });
  });

  describe('NPI Organizations specific features', () => {
    test('should handle complex license and ID structures', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData
          other_ids: [
            [
              { type: 'MEDICAID', number: 'MED123456', state: 'MN' },
              { type: 'MEDICARE', number: 'MCARE789012', state: 'MN' },
            ],
          ],
          licenses: [
            [
              { state: 'MN', number: 'LIC123456', expiration: '2025-12-31' },
              { state: 'WI', number: 'LIC789012', expiration: '2024-06-30' },
            ],
          ],
        },
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        extraFields: 'other_ids,licenses',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results[0].otherIds).toEqual([
        { type: 'MEDICAID', number: 'MED123456', state: 'MN' },
        { type: 'MEDICARE', number: 'MCARE789012', state: 'MN' },
      ]);
      expect(result.results[0].licenses).toEqual([
        { state: 'MN', number: 'LIC123456', expiration: '2025-12-31' },
        { state: 'WI', number: 'LIC789012', expiration: '2024-06-30' },
      ]);
    });

    test('should handle boolean fields correctly', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData
          'misc.is_sole_proprietor': [false],
          'misc.is_org_subpart': [true],
        },
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        extraFields: 'misc.is_sole_proprietor,misc.is_org_subpart',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results[0].isSoleProprietor).toBe(false);
      expect(result.results[0].isOrgSubpart).toBe(true);
    });

    test('should handle authorized official fields', async () => {
      const mockApiResponse = [
        1, // total
        ['1234567890'], // codes
        {
          // extraData
          'misc.auth_official.first': ['JOHN'],
          'misc.auth_official.last': ['SMITH'],
          'misc.auth_official.title': ['CEO'],
          'misc.auth_official.phone': ['507-284-2511'],
        },
        [['1234567890', 'MAYO CLINIC', 'Hospital', '200 First St SW, Rochester, MN 55905']], // displayData
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'CLINIC',
        extraFields:
          'misc.auth_official.first,misc.auth_official.last,misc.auth_official.title,misc.auth_official.phone',
      };

      const result = await searchNpiOrganizations(args);

      expect(result.results[0].authorizedOfficialFirst).toBe('JOHN');
      expect(result.results[0].authorizedOfficialLast).toBe('SMITH');
      expect(result.results[0].authorizedOfficialTitle).toBe('CEO');
      expect(result.results[0].authorizedOfficialPhone).toBe('507-284-2511');
    });
  });

  describe('URL construction', () => {
    test('should properly encode parameters in URL', async () => {
      const mockApiResponse = [0, [], {}, []];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const args: NpiMethodArgs = {
        terms: 'MAYO & ASSOCIATES',
        additionalQuery: 'addr_practice.state:MN AND provider_type:Hospital*',
        searchFields: 'NPI,name.full,provider_type',
        displayFields: 'NPI,name.full,provider_type,addr_practice.full',
      };

      await searchNpiOrganizations(args);

      expect(mockFetch.calls).toHaveLength(1);
      expect(mockFetch.calls[0][0]).toBe(
        'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=MAYO+%26+ASSOCIATES&maxList=7&count=7&offset=0&sf=NPI%2Cname.full%2Cprovider_type&df=NPI%2Cname.full%2Cprovider_type%2Caddr_practice.full&cf=NPI&q=addr_practice.state%3AMN+AND+provider_type%3AHospital*'
      );
    });
  });
});
