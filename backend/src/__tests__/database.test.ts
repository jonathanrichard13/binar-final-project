import { Pool } from "pg";
import { initializeDatabase } from "../database/init";
import { logger } from "../utils/logger";

// Mock pg Pool
jest.mock("pg");
jest.mock("../utils/logger");

const MockedPool = Pool as jest.MockedClass<typeof Pool>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("Database Initialization", () => {
  let mockConnect: jest.Mock;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnect = jest.fn();

    MockedPool.mockImplementation(
      () =>
        ({
          connect: mockConnect,
          end: jest.fn(),
          query: jest.fn(),
        } as any)
    );
  });

  describe("initializeDatabase", () => {
    it("should initialize database successfully", async () => {
      mockConnect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await initializeDatabase();

      expect(mockConnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Database connection established"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Database tables verified/created"
      );
    });

    it("should create all required tables", async () => {
      mockConnect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await initializeDatabase();

      // Check that table creation queries were called
      const queryCalls = mockClient.query.mock.calls;

      // Should create faq_interactions table
      expect(
        queryCalls.some((call: any) =>
          call[0].includes("CREATE TABLE IF NOT EXISTS faq_interactions")
        )
      ).toBe(true);

      // Should create system_metrics table
      expect(
        queryCalls.some((call: any) =>
          call[0].includes("CREATE TABLE IF NOT EXISTS system_metrics")
        )
      ).toBe(true);

      // Should create faq_file_stats table
      expect(
        queryCalls.some((call: any) =>
          call[0].includes("CREATE TABLE IF NOT EXISTS faq_file_stats")
        )
      ).toBe(true);
    });

    it("should handle database connection errors", async () => {
      const connectionError = new Error("Connection refused");
      mockConnect.mockRejectedValue(connectionError);

      await expect(initializeDatabase()).rejects.toThrow("Connection refused");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Database initialization failed:",
        connectionError
      );
    });

    it("should handle table creation errors", async () => {
      mockConnect.mockResolvedValue(mockClient);
      const tableError = new Error("Table creation failed");
      mockClient.query.mockRejectedValue(tableError);

      await expect(initializeDatabase()).rejects.toThrow(
        "Table creation failed"
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Database initialization failed:",
        tableError
      );
    });

    it("should release client even if table creation fails", async () => {
      mockConnect.mockResolvedValue(mockClient);
      const tableError = new Error("Table creation failed");
      mockClient.query.mockRejectedValue(tableError);

      await expect(initializeDatabase()).rejects.toThrow(
        "Table creation failed"
      );

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("Pool Configuration", () => {
    it("should create pool with default configuration", () => {
      // Clear environment variables
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;

      jest.resetModules();
      require("../database/init");

      expect(MockedPool).toHaveBeenCalledWith({
        host: "localhost",
        port: 5432,
        database: "faq_analytics",
        user: "postgres",
        password: "password",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it("should create pool with environment variables", () => {
      process.env.DB_HOST = "test-host";
      process.env.DB_PORT = "5433";
      process.env.DB_NAME = "test_db";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";

      jest.resetModules();
      require("../database/init");

      expect(MockedPool).toHaveBeenCalledWith({
        host: "test-host",
        port: 5433,
        database: "test_db",
        user: "test_user",
        password: "test_password",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Clean up
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
    });
  });

  describe("Table Schemas", () => {
    it("should create faq_interactions table with correct schema", async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await initializeDatabase();

      const faqInteractionsQuery = mockClient.query.mock.calls.find(
        (call: any) =>
          call[0].includes("CREATE TABLE IF NOT EXISTS faq_interactions")
      );

      expect(faqInteractionsQuery).toBeDefined();
      expect(faqInteractionsQuery![0]).toContain("id SERIAL PRIMARY KEY");
      expect(faqInteractionsQuery![0]).toContain(
        "timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      );
      expect(faqInteractionsQuery![0]).toContain("query_text TEXT NOT NULL");
      expect(faqInteractionsQuery![0]).toContain("status VARCHAR(20) NOT NULL");
      expect(faqInteractionsQuery![0]).toContain("source_file VARCHAR(100)");
      expect(faqInteractionsQuery![0]).toContain("reasoning TEXT");
      expect(faqInteractionsQuery![0]).toContain("processing_time FLOAT");
      expect(faqInteractionsQuery![0]).toContain("session_id VARCHAR(50)");
      expect(faqInteractionsQuery![0]).toContain("user_feedback INTEGER");
    });

    it("should create system_metrics table with correct schema", async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await initializeDatabase();

      const systemMetricsQuery = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes("CREATE TABLE IF NOT EXISTS system_metrics")
      );

      expect(systemMetricsQuery).toBeDefined();
      expect(systemMetricsQuery![0]).toContain("id SERIAL PRIMARY KEY");
      expect(systemMetricsQuery![0]).toContain(
        "timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      );
      expect(systemMetricsQuery![0]).toContain(
        "metric_name VARCHAR(100) NOT NULL"
      );
      expect(systemMetricsQuery![0]).toContain("metric_value FLOAT NOT NULL");
      expect(systemMetricsQuery![0]).toContain("metric_unit VARCHAR(20)");
    });

    it("should create faq_file_stats table with correct schema", async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await initializeDatabase();

      const faqFileStatsQuery = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes("CREATE TABLE IF NOT EXISTS faq_file_stats")
      );

      expect(faqFileStatsQuery).toBeDefined();
      expect(faqFileStatsQuery![0]).toContain(
        "file_name VARCHAR(100) PRIMARY KEY"
      );
      expect(faqFileStatsQuery![0]).toContain(
        "total_queries INTEGER DEFAULT 0"
      );
      expect(faqFileStatsQuery![0]).toContain(
        "successful_queries INTEGER DEFAULT 0"
      );
      expect(faqFileStatsQuery![0]).toContain("success_rate FLOAT DEFAULT 0");
      expect(faqFileStatsQuery![0]).toContain(
        "last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      );
    });
  });
});
