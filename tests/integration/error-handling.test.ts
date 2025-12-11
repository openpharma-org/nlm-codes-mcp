/// <reference types="jest" />
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import path from 'path';
import fs from 'fs';

// interface MCPResponse {
//   content: Array<{
//     text: string;
//     type: string;
//   }>;
//   isError: boolean;
// }

interface ToolRequest {
  [key: string]: unknown;
  name: string;
  arguments?: Record<string, unknown>;
  _meta?: {
    [key: string]: unknown;
    progressToken?: string | number;
  };
}

describe('MCP Server Error Handling', () => {
  let client: Client;
  let transport: StdioClientTransport;
  let serverExists: boolean;

  beforeAll(() => {
    // Check if the built server exists before running tests
    const serverPath = path.resolve(process.cwd(), 'dist', 'index.js');
    serverExists = fs.existsSync(serverPath);

    if (!serverExists) {
      console.warn(`⚠️ Built server not found at ${serverPath}. Skipping error handling tests.`);
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
      } catch {
        // Ignore close errors
      }
    }
  });

  describe('NLM Clinical Tables Tool', () => {
    test('should handle missing method parameter', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      await expect(
        client.callTool({
          name: 'nlm_ct_codes',
          arguments: { maxList: 5 },
        } as ToolRequest)
      ).rejects.toThrow(/method.*required/);
    });

    test('should handle missing terms parameter', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      await expect(
        client.callTool({
          name: 'nlm_ct_codes',
          arguments: { method: 'icd-10-cm' },
        } as ToolRequest)
      ).rejects.toThrow(/terms.*required/);
    });

    test('should handle invalid method type', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      await expect(
        client.callTool({
          name: 'nlm_ct_codes',
          arguments: {
            method: 'invalid-method',
            terms: 'test',
          },
        } as ToolRequest)
      ).rejects.toThrow(/method.*must be one of/);
    });

    test('should handle invalid terms type', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      await expect(
        client.callTool({
          name: 'nlm_ct_codes',
          arguments: {
            method: 'icd-10-cm',
            terms: 123,
          },
        } as ToolRequest)
      ).rejects.toThrow(/terms.*string/);
    });

    test('should handle empty terms parameter', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      await expect(
        client.callTool({
          name: 'nlm_ct_codes',
          arguments: {
            method: 'icd-10-cm',
            terms: '',
          },
        } as ToolRequest)
      ).rejects.toThrow(/terms.*required/);
    });
  });

  describe('General Error Handling', () => {
    test('should handle non-existent tool', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      await expect(
        client.callTool({
          name: 'non_existent_tool',
          arguments: {},
        } as ToolRequest)
      ).rejects.toThrow(/Unknown tool: non_existent_tool/);
    });

    test('should handle malformed tool arguments', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      // This test might need adjustment based on how the MCP SDK handles malformed arguments
      await expect(
        client.callTool({
          name: 'nlm_ct_codes',
          arguments: null,
        } as unknown as ToolRequest)
      ).rejects.toThrow();
    });

    test('should properly handle successful clinical tool calls', async () => {
      if (!serverExists) {
        console.warn('Skipping test: server not built');
        return;
      }

      // This might fail due to network issues, but should not throw parameter validation errors
      try {
        const result = await client.callTool({
          name: 'nlm_ct_codes',
          arguments: { method: 'icd-10-cm', terms: 'test', maxList: 1 },
        } as ToolRequest);

        // If successful, verify result structure
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
      } catch (error: any) {
        // Should be a network/API error, not a parameter validation error
        expect(error.message).not.toMatch(/terms.*required/);
        expect(error.message).not.toMatch(/terms.*string/);
      }
    });
  });
});
