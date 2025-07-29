import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock winston logger to avoid console noise during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock database pool to avoid real database connections during tests
jest.mock('../src/database/init', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'faq_analytics_test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
