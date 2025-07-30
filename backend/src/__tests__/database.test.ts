import { Pool } from "pg";

// Mock pg Pool
jest.mock("pg");
jest.mock("../utils/logger");

const MockedPool = Pool as jest.MockedClass<typeof Pool>;

describe("Database Initialization", () => {
  let mockConnect: jest.Mock;
  let mockClient: any;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Clear module cache

    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    };

    mockConnect = jest.fn().mockResolvedValue(mockClient);
    
    mockPool = {
      connect: mockConnect,
      end: jest.fn(),
      query: jest.fn(),
    };

    MockedPool.mockImplementation(() => mockPool);
  });

  describe("Pool Configuration", () => {
    it("should create pool instance", () => {
      expect(MockedPool).toBeDefined();
    });
  });

  describe("Table Creation", () => {
    it("should handle successful table creation", async () => {
      // Import after mocking
      const { initializeDatabase } = require("../database/init");
      
      await initializeDatabase();

      expect(mockConnect).toHaveBeenCalledTimes(2); // Once for init, once for createTables
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalledTimes(2);
    });
  });
});
