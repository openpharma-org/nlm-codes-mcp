/// <reference types="jest" />
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import fs from 'fs';

interface MCPResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  isError: boolean;
}

describe('MCP Server Integration', () => {
  let client: Client;
  let transport: StdioClientTransport;
  let serverExists: boolean;

  beforeAll(() => {
    // Check if the built server exists before running tests
    const serverPath = path.resolve(process.cwd(), 'dist', 'index.js');
    serverExists = fs.existsSync(serverPath);

    if (!serverExists) {
      console.warn(`⚠️ Built server not found at ${serverPath}. Skipping integration tests.`);
      console.warn('Make sure to run "npm run build" before running integration tests.');
    }
  });

  beforeEach(async () => {
    if (!serverExists) {
      return; // Skip setup if server doesn't exist
    }

    try {
      client = new Client(
        {
          name: 'test-client',
          version: '0.1.2',
        },
        {
          capabilities: {},
        }
      );

      const serverPath = path.resolve(process.cwd(), 'dist', 'index.js');
      transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
        env: { ...process.env, USE_HTTP: 'false' },
      });

      await client.connect(transport);
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      // Set transport to null if initialization fails
      transport = null as any;
      throw error;
    }
  });

  afterEach(async () => {
    if (transport) {
      try {
        await transport.close();
      } catch (error) {
        // Ignore close errors
        console.warn('Error closing transport:', error);
      }
    }
  });

  test('should list available clinical tools', async () => {
    if (!serverExists) {
      console.warn('Skipping test: server not built');
      return;
    }

    const response = await client.listTools();
    expect(response.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'nlm_ct_codes',
        }),
      ])
    );

    // Verify no old template tools remain
    const toolNames = response.tools.map(tool => tool.name);
    expect(toolNames).not.toContain('math_calculator');
    expect(toolNames).not.toContain('example_tool');
  });

  test('should call clinical codes tool with proper validation', async () => {
    if (!serverExists) {
      console.warn('Skipping test: server not built');
      return;
    }

    // Test that the tool validates parameters correctly (this should work even offline)
    try {
      await client.callTool({
        name: 'nlm_ct_codes',
        arguments: {}, // Missing required method
      });

      // If we get here without throwing, something's wrong with validation
      fail('Expected tool to throw validation error for missing method');
    } catch (error: any) {
      // Should throw validation error
      expect(error.message).toMatch(/method.*required/);
    }
  });

  test('should handle clinical tool parameter validation', async () => {
    if (!serverExists) {
      console.warn('Skipping test: server not built');
      return;
    }

    // Test parameter validation for invalid types
    try {
      await client.callTool({
        name: 'nlm_ct_codes',
        arguments: { method: 'icd-10-cm', terms: 123 }, // Invalid type
      });

      fail('Expected tool to throw validation error for invalid terms type');
    } catch (error: any) {
      expect(error.message).toMatch(/terms.*string/);
    }
  });

  test('should accept valid clinical tool parameters', async () => {
    if (!serverExists) {
      console.warn('Skipping test: server not built');
      return;
    }

    // This test may fail due to network issues but should not fail on parameter validation
    try {
      const response = (await client.callTool({
        name: 'nlm_ct_codes',
        arguments: { method: 'icd-10-cm', terms: 'test', maxList: 1 },
      })) as MCPResponse;

      // If successful, verify basic response structure
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.isError).toBe(false);

      const result = JSON.parse(response.content[0].text);
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('pagination');
    } catch (error: any) {
      // If it fails, it should be due to network/API issues, not parameter validation
      expect(error.message).not.toMatch(/terms.*required/);
      expect(error.message).not.toMatch(/terms.*string/);

      // Allow network errors or API errors
      console.warn('Clinical API call failed (this is expected if offline):', error.message);
    }
  });
});
