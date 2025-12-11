/// <reference types="jest" />
import { getToolDefinitions, getToolHandler } from '../../src/tools/index.js';

describe('Tools Index', () => {
  test('should return array of tool definitions', () => {
    const definitions = getToolDefinitions();

    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions.length).toBeGreaterThan(0);

    // Check that each definition has the required properties
    definitions.forEach(def => {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('inputSchema');
      expect(typeof def.name).toBe('string');
      expect(typeof def.description).toBe('string');
      expect(typeof def.inputSchema).toBe('object');
    });
  });

  test('should include nlm_ct_codes clinical tool', () => {
    const definitions = getToolDefinitions();
    const clinicalTool = definitions.find(def => def.name === 'nlm_ct_codes');

    expect(clinicalTool).toBeDefined();
    expect(clinicalTool?.description).toContain('ICD-10-CM');
    expect(clinicalTool?.description).toContain('HCPCS');
    expect(clinicalTool?.inputSchema.properties).toHaveProperty('method');
    expect(clinicalTool?.inputSchema.properties).toHaveProperty('terms');
    expect(clinicalTool?.inputSchema.properties).toHaveProperty('maxList');
    expect(clinicalTool?.inputSchema.properties).toHaveProperty('searchFields');
  });

  test('should return handler for nlm_ct_codes', () => {
    const handler = getToolHandler('nlm_ct_codes');

    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  test('should return undefined for non-existent tool', () => {
    const handler = getToolHandler('non_existent_tool');

    expect(handler).toBeUndefined();
  });

  test('should validate nlm_ct_codes handler rejects invalid input', async () => {
    const handler = getToolHandler('nlm_ct_codes');

    if (handler) {
      // Should require method parameter first
      await expect(handler({})).rejects.toThrow('method');
      await expect(handler({ terms: 'test' })).rejects.toThrow('method');

      // Should require terms parameter
      await expect(handler({ method: 'icd-10-cm' })).rejects.toThrow('terms');
      await expect(handler({ method: 'icd-10-cm', terms: '' })).rejects.toThrow('terms');
      await expect(handler({ method: 'icd-10-cm', terms: 123 })).rejects.toThrow('terms');

      // Should validate method parameter
      await expect(handler({ method: 'invalid', terms: 'test' })).rejects.toThrow('method');
    }
  });

  test('should handle case sensitivity for tool names', () => {
    const handler1 = getToolHandler('NLM_CT_CODES');
    const handler2 = getToolHandler('Nlm_Ct_Codes');

    expect(handler1).toBeUndefined();
    expect(handler2).toBeUndefined();
  });

  test('should handle empty string tool name', () => {
    const handler = getToolHandler('');

    expect(handler).toBeUndefined();
  });

  test('should handle undefined tool name', () => {
    const handler = getToolHandler(undefined as any);

    expect(handler).toBeUndefined();
  });

  test('should only contain clinical tools', () => {
    const definitions = getToolDefinitions();

    // Verify no old template tools remain
    const toolNames = definitions.map(def => def.name);
    expect(toolNames).not.toContain('math_calculator');
    expect(toolNames).not.toContain('example_tool');

    // Verify we have clinical tools
    expect(toolNames).toContain('nlm_ct_codes');
  });

  test('should have proper clinical tool metadata', () => {
    const definitions = getToolDefinitions();
    const clinicalTool = definitions.find(def => def.name === 'nlm_ct_codes');

    expect(clinicalTool?.description).toContain('ICD-10-CM');
    expect(clinicalTool?.description).toContain('HCPCS');
    expect(clinicalTool?.examples).toBeDefined();
    expect(clinicalTool?.examples?.length).toBeGreaterThan(0);
    expect(clinicalTool?.responseSchema).toBeDefined();
  });
});
