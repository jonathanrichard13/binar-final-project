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
import exportRoutes from "../routes/export";

describe("Export Routes (Simplified)", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/export", exportRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/export/data", () => {
    it("should export analytics data as JSON successfully", async () => {
      const testDate = new Date("2025-07-29T14:17:28.700Z");
      const mockInteractions = [
        {
          id: 1,
          query_text: "test query",
          timestamp: testDate,
          status: "success",
        },
      ];
      const mockMetrics = [
        {
          id: 1,
          metric_name: "cpu_usage",
          metric_value: 65.5,
          timestamp: testDate,
        },
      ];
      const mockFaqStats = [
        {
          source_file: "test.txt",
          total_queries: 100,
          successful_queries: 85,
          success_rate: 85.0,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockInteractions }); // interactions
      mockQuery.mockResolvedValueOnce({ rows: mockMetrics }); // metrics
      mockQuery.mockResolvedValueOnce({ rows: mockFaqStats }); // FAQ stats

      const response = await request(app).get("/api/export/data").expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("interactions");
      expect(response.body.data).toHaveProperty("systemMetrics");
      expect(response.body.data).toHaveProperty("faqStats");

      // Compare serialized timestamps since JSON converts dates to strings
      const expectedInteractions = mockInteractions.map((item) => ({
        ...item,
        timestamp: item.timestamp.toISOString(),
      }));
      expect(response.body.data.interactions).toEqual(expectedInteractions);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it("should handle different time ranges", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app).get("/api/export/data?timeRange=7d").expect(200);

      expect(mockQuery).toHaveBeenCalled();
      // Verify that the query contains the correct time range
      const queryCall = mockQuery.mock.calls[0][0];
      expect(queryCall).toContain("timestamp >=");
    });

    it("should export specific data types", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .get("/api/export/data?dataType=interactions")
        .expect(200);

      // Should only call query once for interactions
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should export CSV format", async () => {
      const mockData = [{ id: 1, query_text: "test", status: "success" }];

      mockQuery.mockResolvedValueOnce({ rows: mockData });
      mockQuery.mockResolvedValue({ rows: [] }); // other queries

      const response = await request(app)
        .get("/api/export/data?format=csv")
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.text).toContain("id,query_text,status");
    });

    it("should handle database errors", async () => {
      mockQuery.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/export/data").expect(500);

      expect(response.body).toHaveProperty("error", "Failed to export data");
    });

    it("should handle empty data gracefully", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get("/api/export/data").expect(200);

      expect(response.body.data).toHaveProperty("interactions", []);
      expect(response.body.data).toHaveProperty("systemMetrics", []);
      expect(response.body.data).toHaveProperty("faqStats", []);
    });
  });
});
