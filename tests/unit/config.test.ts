/// <reference types="jest" />
import { loadConfig, validateConfig } from '../../src/utils/config.js';

describe('Config Utility', () => {
  // Store original console.warn
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Clean up environment variables before each test
    Object.keys(process.env).forEach(key => {
      if (
        key.startsWith('SERVER_') ||
        key.startsWith('USE_') ||
        key.startsWith('LOG_') ||
        key.startsWith('NODE_') ||
        key.startsWith('DEV_') ||
        key.startsWith('DEBUG') ||
        key.startsWith('CORS_') ||
        key.startsWith('REQUEST_') ||
        key.startsWith('MAX_') ||
        key.startsWith('ENABLE_') ||
        key.startsWith('HEALTH_') ||
        key.startsWith('METRICS_') ||
        key.startsWith('SHUTDOWN_') ||
        key.startsWith('PROCESS_') ||
        key === 'PORT' ||
        key === 'SSE_PATH'
      ) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // Restore console.warn after each test
    console.warn = originalConsoleWarn;
  });

  describe('loadConfig', () => {
    test('should return default config when no environment variables are set', () => {
      // Clear all relevant env vars
      Object.keys(process.env).forEach(key => {
        if (
          key.startsWith('SERVER_') ||
          key.startsWith('USE_') ||
          key.startsWith('LOG_') ||
          key.startsWith('NODE_') ||
          key.startsWith('DEV_') ||
          key.startsWith('DEBUG') ||
          key.startsWith('CORS_') ||
          key.startsWith('REQUEST_') ||
          key.startsWith('MAX_') ||
          key.startsWith('ENABLE_') ||
          key.startsWith('METRICS_') ||
          key.startsWith('HEALTH_') ||
          key.startsWith('SHUTDOWN_') ||
          key.startsWith('PROCESS_') ||
          key === 'PORT' ||
          key === 'SSE_PATH'
        ) {
          delete process.env[key];
        }
      });

      const config = loadConfig();

      expect(config).toMatchObject({
        name: 'codes-mcp-server',
        version: '0.1.2',
        useHttp: false,
        useSse: false,
        port: 3000,
        ssePath: '/mcp',
        logLevel: 'info',
        nodeEnv: 'production',
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
        processTitle: 'codes-mcp-server',
      });
    });

    test('should use environment variables when provided', () => {
      process.env.SERVER_NAME = 'test-server';
      process.env.SERVER_VERSION = '2.0.0';
      process.env.USE_HTTP = 'true';
      process.env.USE_SSE = 'true';
      process.env.PORT = '8080';
      process.env.SSE_PATH = '/custom-events';
      process.env.LOG_LEVEL = 'debug';
      process.env.NODE_ENV = 'development';
      process.env.DEV_MODE = 'true';
      process.env.CORS_ORIGINS = 'https://example.com,https://api.example.com';

      const config = loadConfig();

      expect(config).toMatchObject({
        name: 'test-server',
        version: '2.0.0',
        useHttp: true,
        useSse: true,
        port: 8080,
        ssePath: '/custom-events',
        logLevel: 'debug',
        nodeEnv: 'development',
        devMode: true,
        corsOrigins: ['https://example.com', 'https://api.example.com'],
      });
    });

    test('should handle boolean environment variables correctly', () => {
      process.env.USE_HTTP = 'false';
      process.env.USE_SSE = 'false';
      process.env.DEV_MODE = 'true';
      process.env.DEBUG = 'false';

      const config = loadConfig();

      expect(config.useHttp).toBe(false);
      expect(config.useSse).toBe(false);
      expect(config.devMode).toBe(true);
      expect(config.debug).toBe(false);
    });

    test('should handle invalid boolean values gracefully', () => {
      process.env.USE_HTTP = 'invalid';
      process.env.DEV_MODE = 'yes';
      process.env.DEBUG = '1';

      const config = loadConfig();

      expect(config.useHttp).toBe(false);
      expect(config.devMode).toBe(false);
      expect(config.debug).toBe(false);
    });

    test('should handle invalid port environment variable', () => {
      // Mock console.warn to suppress expected warning
      const warnings: string[] = [];
      console.warn = (message: string) => {
        warnings.push(message);
      };

      process.env.PORT = 'invalid';

      const config = loadConfig();

      expect(config.port).toBe(3000); // Should fall back to default
      expect(warnings).toContain('Invalid PORT value: invalid, using default: 3000');
    });

    test('should handle out-of-range port values', () => {
      // Mock console.warn to suppress expected warning
      const warnings: string[] = [];
      console.warn = (message: string) => {
        warnings.push(message);
      };

      process.env.PORT = '70000';

      const config = loadConfig();

      expect(config.port).toBe(3000); // Should fall back to default
      expect(warnings).toContain('Invalid PORT value: 70000, using default: 3000');
    });

    test('should handle numeric port correctly', () => {
      process.env.PORT = '9000';

      const config = loadConfig();

      expect(config.port).toBe(9000);
    });

    test('should handle different log levels', () => {
      const logLevels = ['error', 'warn', 'info', 'debug'];

      logLevels.forEach(level => {
        process.env.LOG_LEVEL = level;
        const config = loadConfig();
        expect(config.logLevel).toBe(level);
      });
    });

    test('should handle invalid log level', () => {
      process.env.LOG_LEVEL = 'invalid';

      const config = loadConfig();

      expect(config.logLevel).toBe('info'); // Should fall back to default
    });

    test('should parse CORS origins correctly', () => {
      process.env.CORS_ORIGINS = 'https://app.com, https://api.com , https://admin.com';

      const config = loadConfig();

      expect(config.corsOrigins).toEqual([
        'https://app.com',
        'https://api.com',
        'https://admin.com',
      ]);
    });

    test('should handle numeric configuration values', () => {
      process.env.REQUEST_TIMEOUT = '15000';
      process.env.MAX_CONNECTIONS = '200';
      process.env.METRICS_INTERVAL = '30000';

      const config = loadConfig();

      expect(config.requestTimeout).toBe(15000);
      expect(config.maxConnections).toBe(200);
      expect(config.metricsInterval).toBe(30000);
    });
  });

  describe('validateConfig', () => {
    test('should pass validation for valid configuration', () => {
      const config = loadConfig();

      expect(() => validateConfig(config)).not.toThrow();
    });

    test('should warn about no transport protocols enabled', () => {
      // Mock console.warn to capture expected warning
      const warnings: string[] = [];
      console.warn = (message: string) => {
        warnings.push(message);
      };

      const config = {
        ...loadConfig(),
        useHttp: false,
        useSse: false,
      };

      // Call validateConfig directly
      validateConfig(config);

      expect(warnings).toContain(
        'No transport protocols enabled. Server will only work with stdio transport.'
      );
    });

    test('should throw error when port is required but missing', () => {
      const config = {
        ...loadConfig(),
        useHttp: true,
        port: 0,
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration validation failed:\nPORT must be specified when HTTP or SSE transport is enabled'
      );
    });

    test('should warn about dev mode in production', () => {
      // Mock console.warn to capture expected warning
      const warnings: string[] = [];
      console.warn = (message: string) => {
        warnings.push(message);
      };

      const config = {
        ...loadConfig(),
        devMode: true,
        nodeEnv: 'production',
      };

      // Call validateConfig directly
      validateConfig(config);

      expect(warnings).toContain(
        'DEV_MODE is enabled but NODE_ENV is production. This may cause issues.'
      );
    });

    test('should warn about wildcard CORS in production', () => {
      // Mock console.warn to capture expected warning
      const warnings: string[] = [];
      console.warn = (message: string) => {
        warnings.push(message);
      };

      const config = {
        ...loadConfig(),
        nodeEnv: 'production',
        corsOrigins: ['*'],
      };

      // Call validateConfig directly
      validateConfig(config);

      expect(warnings).toContain(
        'CORS is set to allow all origins (*) in production. Consider restricting to specific domains.'
      );
    });
  });
});
