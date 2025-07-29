// Mock the dependencies first
const mockQuery = jest.fn();
jest.mock("../database/init", () => ({
  pool: {
    query: mockQuery,
  },
}));

jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import express from "express";
import request from "supertest";
import systemRoutes from "../routes/system";

describe("System Routes (Simplified)", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/system", systemRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/system/health", () => {
    it("should return healthy status when all checks pass", async () => {
      // Mock successful database connection
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // SELECT 1 check
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: "100", errors: "5" }],
      }); // error rate
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_time: "250.5" }] }); // avg response time

      const response = await request(app).get("/api/system/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("database");
      expect(response.body).toHaveProperty("metrics");
      expect(response.body.database.status).toBe("connected");
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it("should handle database connection issues", async () => {
      mockQuery.mockRejectedValue(new Error("Connection refused"));

      const response = await request(app).get("/api/system/health").expect(500);

      expect(response.body).toHaveProperty("status", "unhealthy");
      expect(response.body).toHaveProperty("error");
      expect(response.body.database.status).toBe("disconnected");
    });

    it("should calculate error rate correctly", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // SELECT 1 check
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: "100", errors: "10" }],
      }); // 10% error rate
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_time: "300" }] });

      const response = await request(app).get("/api/system/health").expect(200);

      expect(response.body.metrics.errorRate).toBe(10);
      expect(response.body.metrics.totalQueriesLastHour).toBe(100);
      expect(response.body.metrics.averageResponseTime).toBe(300);
    });

    it("should handle zero queries gracefully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // SELECT 1 check
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "0", errors: "0" }] }); // no queries
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_time: null }] }); // no avg time

      const response = await request(app).get("/api/system/health").expect(200);

      expect(response.body.metrics.errorRate).toBe(0);
      expect(response.body.metrics.totalQueriesLastHour).toBe(0);
      expect(response.body.metrics.averageResponseTime).toBe(0);
    });
  });
});
