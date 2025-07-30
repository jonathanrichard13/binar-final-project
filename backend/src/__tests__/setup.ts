// Test setup file
import { jest } from "@jest/globals";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "faq_analytics_test";
process.env.DB_USER = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.LOG_LEVEL = "error";

// Mock winston logger to prevent actual logging during tests
jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock pg pool
jest.mock("../database/init", () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  },
  initializeDatabase: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
