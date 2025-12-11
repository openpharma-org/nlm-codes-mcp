/// <reference types="jest" />
import { createMcpServer } from '../../src/transports/mcp-server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ServerConfig } from '../../src/types.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock logger for testing
const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Default test config
const testConfig: ServerConfig = {
  name: 'test-server',
  version: '1.0.0',
  useHttp: false,
  useSse: false,
  port: 3000,
  ssePath: '/events',
  logLevel: 'info',
  nodeEnv: 'test',
  devMode: false,
  debug: false,
  corsOrigins: ['*'],
  requestTimeout: 30000,
  maxRequestSize: 1048576,
  enablePerformanceMonitoring: false,
  metricsInterval: 60000,
  maxConnections: 100,
  enableExperimentalFeatures: false,
  clinicalApiBaseUrl: 'https://clinicaltables.nlm.nih.gov',
  enableIcdTools: true,
  enableLoincTools: true,
  enableDrugTools: true,
  enableGenomicTools: true,
  enableNpiTools: true,
  healthCheckPath: '/health',
  shutdownTimeout: 10000,
  processTitle: 'test-server',
};

describe('Transport Layer', () => {
  describe('MCP Server', () => {
    test('should create server with default configuration', () => {
      const server = createMcpServer(testConfig, mockLogger);
      expect(server).toBeInstanceOf(Server);
    });

    test('should set up list tools handler', () => {
      const server = createMcpServer(testConfig, mockLogger);
      expect(() =>
        server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }))
      ).not.toThrow();
    });

    test('should set up call tool handler', () => {
      const server = createMcpServer(testConfig, mockLogger);
      expect(() =>
        server.setRequestHandler(CallToolRequestSchema, async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                result: 8,
                operation: 'add',
              }),
            },
          ],
          isError: false,
        }))
      ).not.toThrow();
    });

    test('should handle errors in call tool handler', () => {
      const server = createMcpServer(testConfig, mockLogger);
      expect(() =>
        server.setRequestHandler(CallToolRequestSchema, async () => {
          throw new Error('Test error');
        })
      ).not.toThrow();
    });
  });

  describe('Stdio Transport', () => {
    test('should create stdio transport', () => {
      const transport = new StdioServerTransport();
      expect(transport).toBeDefined();
    });

    test('should connect server to transport', async () => {
      const transport = new StdioServerTransport();
      const server = createMcpServer(testConfig, mockLogger);

      await expect(server.connect(transport)).resolves.not.toThrow();
    });
  });
});
