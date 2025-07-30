// Mock the dependencies first
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockEnd = jest.fn();

// Mock the entire database/init module
jest.mock("../database/init", () => ({
  pool: {
    query: mockQuery,
    connect: mockConnect,
    end: mockEnd,
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
import analyticsRoutes from "../routes/analytics";

describe("Analytics Routes (Simplified - Frontend Used Only)", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/analytics", analyticsRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/overview", () => {
    it("should return analytics overview successfully", async () => {
      // Mock the queries that overview endpoint makes
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "1000" }] }); // total queries
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: "1000", success: "855" }],
      }); // success rate
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_time: "250.5" }] }); // avg response time
      mockQuery.mockResolvedValueOnce({
        rows: [{ hour: "10:00", count: "50" }],
      }); // trends
      mockQuery.mockResolvedValueOnce({
        rows: [{ source_file: "test.txt", usage_count: "25" }],
      }); // top FAQ files

      const response = await request(app)
        .get("/api/analytics/overview")
        .expect(200);

      expect(response.body).toHaveProperty("totalQueries");
      expect(response.body).toHaveProperty("successRate");
      expect(response.body).toHaveProperty("averageResponseTime");
      expect(response.body).toHaveProperty("queryTrends");
      expect(response.body).toHaveProperty("topFaqFiles");
      expect(mockQuery).toHaveBeenCalled();
    });

    it("should handle different time ranges", async () => {
      // Mock responses for all queries
      mockQuery.mockResolvedValue({ rows: [{ total: "500" }] });

      await request(app)
        .get("/api/analytics/overview?timeRange=7d")
        .expect(200);

      expect(mockQuery).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockQuery.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/analytics/overview")
        .expect(500);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/analytics/queries", () => {
    it("should return query data successfully", async () => {
      const mockQueryData = [
        {
          id: 1,
          query_text: "test query",
          timestamp: new Date(),
          status: "success",
          source_file: "test.txt",
          processing_time: 200,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: [{ total: "100" }] }); // count query
      mockQuery.mockResolvedValueOnce({ rows: mockQueryData }); // actual data
      mockQuery.mockResolvedValueOnce({
        rows: [{ status: "success", count: "85" }],
      }); // status distribution

      const response = await request(app)
        .get("/api/analytics/queries")
        .expect(200);

      expect(response.body).toHaveProperty("queries");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body).toHaveProperty("statusDistribution");
      expect(mockQuery).toHaveBeenCalled();
    });

    it("should handle pagination parameters", async () => {
      // Mock paginated results with proper structure
      const mockQueries = [
        {
          query_text: "Test query 26",
          status: "success",
          source_file: "test.txt",
          processing_time: 250,
          timestamp: "2023-12-01T10:00:00.000Z",
          user_feedback: null,
        },
      ];

      // The /queries endpoint makes 3 queries: main query, count, status distribution
      mockQuery.mockResolvedValueOnce({ rows: mockQueries }); // main query
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "100" }] }); // count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ status: "success", count: "85" }],
      }); // status distribution

      const response = await request(app)
        .get("/api/analytics/queries?page=2&limit=25")
        .expect(200);

      expect(response.body).toHaveProperty("queries");
      expect(response.body).toHaveProperty("pagination");
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe("GET /api/analytics/performance", () => {
    it("should return performance metrics", async () => {
      // Mock performance data
      mockQuery.mockResolvedValueOnce({
        rows: [{ p50: 200, p95: 500, p99: 1000 }],
      }); // percentiles
      mockQuery.mockResolvedValueOnce({
        rows: [{ hour: "10:00", total: "100", errors: "5" }],
      }); // error trends
      mockQuery.mockResolvedValueOnce({
        rows: [{ metric_name: "cpu_usage", metric_value: 65.5 }],
      }); // system metrics

      const response = await request(app)
        .get("/api/analytics/performance")
        .expect(200);

      expect(response.body).toHaveProperty("responseTimePercentiles");
      expect(response.body).toHaveProperty("errorRateTrends");
      expect(response.body).toHaveProperty("systemMetrics");
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("GET /api/analytics/faq-stats", () => {
    it("should return FAQ statistics", async () => {
      const mockFaqStats = [
        {
          source_file: "test.txt",
          total_queries: 100,
          successful_queries: 85,
          success_rate: 85.0,
          avg_response_time: 250,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockFaqStats }); // FAQ effectiveness
      mockQuery.mockResolvedValueOnce({
        rows: [{ source_file: "unused.txt", usage_count: 2 }],
      }); // underutilized

      const response = await request(app)
        .get("/api/analytics/faq-stats")
        .expect(200);

      expect(response.body).toHaveProperty("faqEffectiveness");
      expect(response.body).toHaveProperty("underutilizedFaqs");
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("GET /api/analytics/unanswered", () => {
    it("should return unanswered queries", async () => {
      const mockUnansweredData = [
        {
          id: 1,
          query_text: "unanswered query",
          timestamp: "2023-12-01T10:00:00.000Z",
          session_id: "sess1",
          processing_time: 250,
          reasoning: "No matching FAQ found",
        },
      ];

      // The unanswered route makes 4 queries: main data, count, summary, keyword analysis, time distribution
      mockQuery.mockResolvedValueOnce({ rows: mockUnansweredData }); // main data
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "50" }] }); // count
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_unanswered: "50", unique_queries: "30" }],
      }); // summary
      mockQuery.mockResolvedValueOnce({
        rows: [{ word: "test", frequency: "10" }],
      }); // keywords
      mockQuery.mockResolvedValueOnce({
        rows: [{ date: "2023-12-01", unanswered_count: "5" }],
      }); // time distribution

      const response = await request(app)
        .get("/api/analytics/unanswered")
        .expect(200);

      expect(response.body).toHaveProperty("unansweredQueries");
      expect(response.body).toHaveProperty("summary");
      expect(response.body).toHaveProperty("pagination");
      expect(mockQuery).toHaveBeenCalledTimes(5);
    });
  });

  describe("GET /api/analytics/hourly-queries", () => {
    it("should return hourly query data", async () => {
      const mockHourlyData = [{ hour: 10, count: 25, percentage: 12.5 }];

      mockQuery.mockResolvedValueOnce({ rows: [{ total: "200" }] }); // total for date
      mockQuery.mockResolvedValueOnce({ rows: mockHourlyData }); // hourly breakdown

      const response = await request(app)
        .get("/api/analytics/hourly-queries?date=2023-12-01")
        .expect(200);

      expect(response.body).toHaveProperty("totalQueries");
      expect(response.body).toHaveProperty("hourlyData");
      expect(response.body).toHaveProperty("date");
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("GET /api/analytics/daily-queries", () => {
    it("should return daily query data", async () => {
      const mockDailyData = [
        { date: "2023-12-01", count: "100" },
        { date: "2023-12-02", count: "150" },
      ];

      // The daily-queries route makes: 1 daily data query, 1 total query, then date queries for each day (7 days = 7 more queries)
      mockQuery.mockResolvedValueOnce({ rows: mockDailyData }); // daily data
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "500" }] }); // total count

      // Mock the date generation queries (7 days)
      for (let i = 0; i < 7; i++) {
        const dateStr = `2023-12-${String(i + 1).padStart(2, "0")}`;
        mockQuery.mockResolvedValueOnce({ rows: [{ target_date: dateStr }] });
      }

      const response = await request(app)
        .get("/api/analytics/daily-queries?days=7")
        .expect(200);

      expect(response.body).toHaveProperty("totalQueries");
      expect(response.body).toHaveProperty("dailyData");
      expect(response.body.totalQueries).toBe(500);
      expect(response.body.dailyData).toHaveLength(7); // Should include all 7 days
      expect(mockQuery).toHaveBeenCalledTimes(9); // 2 + 7 date queries
    });
  });

  describe("GET /api/analytics/system-health", () => {
    it("should return system health metrics", async () => {
      const response = await request(app)
        .get("/api/analytics/system-health")
        .expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("cpu");
      // No database queries expected for system health endpoint
    });
  });
});
