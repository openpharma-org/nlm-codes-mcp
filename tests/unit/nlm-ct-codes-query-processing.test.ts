/// <reference types="jest" />
import { validateAndProcessAdditionalQuery } from '../../src/tools/nlm-ct-codes/utils.js';

// Mock console.warn to capture warnings
interface MockConsole {
  warn: (message: string) => void;
  mockClear: () => void;
  calls: string[];
}

const createMockConsole = (): MockConsole => {
  let calls: string[] = [];

  const mockWarn = (message: string) => {
    calls.push(message);
  };

  console.warn = mockWarn;

  return {
    warn: mockWarn,
    mockClear: () => {
      calls = [];
    },
    get calls() {
      return calls;
    },
  };
};

const consoleSpy = createMockConsole();

describe('validateAndProcessAdditionalQuery', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  describe('Basic validation', () => {
    test('should return undefined for undefined input', () => {
      expect(validateAndProcessAdditionalQuery(undefined)).toBeUndefined();
    });

    test('should return undefined for null input', () => {
      expect(validateAndProcessAdditionalQuery(null as any)).toBeNull();
    });

    test('should return undefined for empty string after trimming', () => {
      expect(validateAndProcessAdditionalQuery('   ')).toBeUndefined();
    });

    test('should return trimmed string for non-empty input without parentheses', () => {
      expect(validateAndProcessAdditionalQuery('  addr_practice.state:CA  ')).toBe(
        'addr_practice.state:CA'
      );
    });

    test('should return non-string input unchanged', () => {
      expect(validateAndProcessAdditionalQuery(123 as any)).toBe(123);
    });
  });

  describe('Queries without parentheses', () => {
    test('should pass through simple queries without warnings', () => {
      const result = validateAndProcessAdditionalQuery('addr_practice.state:CA');
      expect(result).toBe('addr_practice.state:CA');
      expect(consoleSpy.calls).toHaveLength(0);
    });

    test('should pass through AND queries without warnings', () => {
      const result = validateAndProcessAdditionalQuery(
        'addr_practice.state:CA AND provider_type:Physician*'
      );
      expect(result).toBe('addr_practice.state:CA AND provider_type:Physician*');
      expect(consoleSpy.calls).toHaveLength(0);
    });

    test('should pass through OR queries without warnings', () => {
      const result = validateAndProcessAdditionalQuery(
        'addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO"'
      );
      expect(result).toBe('addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO"');
      expect(consoleSpy.calls).toHaveLength(0);
    });
  });

  describe('Parentheses detection', () => {
    test('should detect parentheses and warn about complex queries', () => {
      const input =
        'addr_practice.state:CA AND (addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO")';
      const result = validateAndProcessAdditionalQuery(input);

      // Should transform the query using distributive property
      expect(result).toBe(
        '(addr_practice.state:CA AND addr_practice.city:"LOS ANGELES") OR (addr_practice.state:CA AND addr_practice.city:"SAN FRANCISCO")'
      );
      expect(consoleSpy.calls).toHaveLength(1);
      expect(consoleSpy.calls[0]).toContain('Parentheses grouping detected and transformed');
    });

    test('should not detect parentheses inside quoted strings', () => {
      const input = 'addr_practice.city:"Los Angeles (CA)"';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(input);
      expect(consoleSpy.calls).toHaveLength(0);
    });
  });

  describe('Query transformations', () => {
    test('should transform A AND (B OR C) to (A AND B) OR (A AND C)', () => {
      const input =
        'addr_practice.state:CA AND (addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO")';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        '(addr_practice.state:CA AND addr_practice.city:"LOS ANGELES") OR (addr_practice.state:CA AND addr_practice.city:"SAN FRANCISCO")'
      );
    });

    test('should transform (A OR B) AND C to (A AND C) OR (B AND C)', () => {
      const input =
        '(addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO") AND addr_practice.state:CA';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        '(addr_practice.city:"LOS ANGELES" AND addr_practice.state:CA) OR (addr_practice.city:"SAN FRANCISCO" AND addr_practice.state:CA)'
      );
    });

    test('should remove simple parentheses from (A OR B)', () => {
      const input = '(addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO")';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe('addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO"');
    });

    test('should remove simple parentheses from (A AND B)', () => {
      const input = '(addr_practice.state:CA AND provider_type:Physician*)';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe('addr_practice.state:CA AND provider_type:Physician*');
    });

    test('should handle A OR (B AND C) with warning', () => {
      const input =
        'provider_type:Physician* OR (addr_practice.state:CA AND addr_practice.city:"LOS ANGELES")';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        'provider_type:Physician* OR addr_practice.state:CA AND addr_practice.city:"LOS ANGELES"'
      );
      expect(consoleSpy.calls).toHaveLength(1);
      expect(consoleSpy.calls[0]).toContain('Complex OR with AND grouping detected');
    });
  });

  describe('Complex cases', () => {
    test('should warn about unsupported complex parentheses', () => {
      const input =
        '((addr_practice.state:CA OR addr_practice.state:NY) AND provider_type:Physician*) OR addr_practice.city:"CHICAGO"';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(input); // Should return unchanged
      expect(consoleSpy.calls).toHaveLength(1);
      expect(consoleSpy.calls[0]).toContain('Complex parentheses grouping detected');
    });

    test('should handle case-insensitive boolean operators', () => {
      const input =
        'addr_practice.state:CA and (addr_practice.city:"LOS ANGELES" or addr_practice.city:"SAN FRANCISCO")';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        '(addr_practice.state:CA and addr_practice.city:"LOS ANGELES") OR (addr_practice.state:CA and addr_practice.city:"SAN FRANCISCO")'
      );
    });

    test('should handle extra whitespace', () => {
      const input =
        'addr_practice.state:CA   AND   (   addr_practice.city:"LOS ANGELES"   OR   addr_practice.city:"SAN FRANCISCO"   )';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        '(addr_practice.state:CA AND addr_practice.city:"LOS ANGELES") OR (addr_practice.state:CA AND addr_practice.city:"SAN FRANCISCO")'
      );
    });
  });

  describe('Real-world examples', () => {
    test('should handle the original problematic query from the issue', () => {
      const input =
        'addr_practice.state:CA AND (addr_practice.city:"LOS ANGELES" OR addr_practice.city:"SAN FRANCISCO")';
      const result = validateAndProcessAdditionalQuery(input);

      // This should be transformed to work without parentheses
      expect(result).toBe(
        '(addr_practice.state:CA AND addr_practice.city:"LOS ANGELES") OR (addr_practice.state:CA AND addr_practice.city:"SAN FRANCISCO")'
      );
      expect(consoleSpy.calls).toHaveLength(1);
      expect(consoleSpy.calls[0]).toContain('Parentheses grouping detected and transformed');
    });

    test('should handle provider type filtering with location', () => {
      const input =
        'provider_type:Physician* AND (addr_practice.state:CA OR addr_practice.state:NY)';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        '(provider_type:Physician* AND addr_practice.state:CA) OR (provider_type:Physician* AND addr_practice.state:NY)'
      );
    });

    test('should handle gender filtering with location', () => {
      const input = 'gender:M AND (addr_practice.city:"NEW YORK" OR addr_practice.city:"CHICAGO")';
      const result = validateAndProcessAdditionalQuery(input);
      expect(result).toBe(
        '(gender:M AND addr_practice.city:"NEW YORK") OR (gender:M AND addr_practice.city:"CHICAGO")'
      );
    });
  });
});
