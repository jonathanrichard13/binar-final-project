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

import { AnalyticsService, QueryLogData } from "../services/analyticsService";

describe("AnalyticsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logQuery", () => {
    it("should successfully log a query with all data", async () => {
      const queryData: QueryLogData = {
        queryText: "How to reset password?",
        status: "success",
        sourceFile: "account_management.txt",
        reasoning: "Found relevant information",
        processingTime: 150,
        sessionId: "session123",
        userFeedback: 5,
      };

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await AnalyticsService.logQuery(queryData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO faq_interactions"),
        [
          queryData.queryText,
          queryData.status,
          queryData.sourceFile,
          queryData.reasoning,
          queryData.processingTime,
          queryData.sessionId,
          queryData.userFeedback,
        ]
      );
    });

    it("should handle database errors", async () => {
      const queryData: QueryLogData = {
        queryText: "Test query",
        status: "error",
      };

      mockQuery.mockRejectedValueOnce(new Error("Database connection failed"));

      await expect(AnalyticsService.logQuery(queryData)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getRealTimeMetrics", () => {
    it("should return real-time metrics successfully", async () => {
      const mockTodayStats = {
        total_queries_today: "150",
        successful_queries_today: "120",
        avg_response_time_today: "250.5",
      };

      const mockErrorCount = { error_count: "5" };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTodayStats] })
        .mockResolvedValueOnce({ rows: [mockErrorCount] });

      const result = await AnalyticsService.getRealTimeMetrics();

      expect(result).toEqual({
        todayStats: mockTodayStats,
        recentErrors: 5,
        timestamp: expect.any(String),
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe("checkForAnomalies", () => {
    it("should detect high error rate anomaly", async () => {
      const mockErrorData = { total: "100", errors: "15" }; // 15% error rate
      const mockSlowResponse = { avg_time: "2000" }; // 2 seconds

      mockQuery
        .mockResolvedValueOnce({ rows: [mockErrorData] })
        .mockResolvedValueOnce({ rows: [mockSlowResponse] });

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0]).toMatchObject({
        type: "high_error_rate",
        severity: "high",
        message: expect.stringContaining("15.00%"),
      });
    });

    it("should return no alerts when everything is normal", async () => {
      const mockErrorData = { total: "100", errors: "5" }; // 5% error rate
      const mockSlowResponse = { avg_time: "1500" }; // 1.5 seconds

      mockQuery
        .mockResolvedValueOnce({ rows: [mockErrorData] })
        .mockResolvedValueOnce({ rows: [mockSlowResponse] });

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toHaveLength(0);
    });
  });
});
