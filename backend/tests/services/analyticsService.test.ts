import {
  AnalyticsService,
  QueryLogData,
} from '../../src/services/analyticsService';

// Mock the database pool module
jest.mock('../../src/database/init', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../../src/database/init';

const mockPool = pool as jest.Mocked<typeof pool>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logQuery', () => {
    it('should log a query successfully', async () => {
      const queryData: QueryLogData = {
        queryText: 'How to reset password?',
        status: 'success',
        sourceFile: 'account_management.txt',
        reasoning: 'Found relevant information',
        processingTime: 150,
        sessionId: 'session-123',
        userFeedback: 5,
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await AnalyticsService.logQuery(queryData);

      expect(mockPool.query).toHaveBeenCalledWith(
        `INSERT INTO faq_interactions 
         (query_text, status, source_file, reasoning, processing_time, session_id, user_feedback) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'How to reset password?',
          'success',
          'account_management.txt',
          'Found relevant information',
          150,
          'session-123',
          5,
        ]
      );
    });

    it('should handle missing optional fields', async () => {
      const queryData: QueryLogData = {
        queryText: 'Test query',
        status: 'no_answer',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await AnalyticsService.logQuery(queryData);

      expect(mockPool.query).toHaveBeenCalledWith(
        `INSERT INTO faq_interactions 
         (query_text, status, source_file, reasoning, processing_time, session_id, user_feedback) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['Test query', 'no_answer', null, null, null, null, null]
      );
    });

    it('should throw error when database query fails', async () => {
      const queryData: QueryLogData = {
        queryText: 'Test query',
        status: 'error',
      };

      (mockPool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(AnalyticsService.logQuery(queryData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('logSystemMetric', () => {
    it('should log system metric successfully', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await AnalyticsService.logSystemMetric('response_time', 200, 'ms');

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES ($1, $2, $3)',
        ['response_time', 200, 'ms']
      );
    });

    it('should handle metric without unit', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await AnalyticsService.logSystemMetric('query_count', 100);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES ($1, $2, $3)',
        ['query_count', 100, null]
      );
    });

    it('should throw error when database query fails', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(
        AnalyticsService.logSystemMetric('test_metric', 100)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateFaqFileStats', () => {
    it('should update FAQ file stats for successful query', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await AnalyticsService.updateFaqFileStats('account_management.txt', true);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO faq_file_stats'),
        ['account_management.txt', 1]
      );
    });

    it('should update FAQ file stats for unsuccessful query', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await AnalyticsService.updateFaqFileStats('billing_payments.txt', false);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO faq_file_stats'),
        ['billing_payments.txt', 0]
      );
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics successfully', async () => {
      const mockTodayStats = {
        total_queries_today: '50',
        successful_queries_today: '45',
        avg_response_time_today: '250.5',
      };
      const mockErrorCount = { error_count: '2' };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTodayStats] })
        .mockResolvedValueOnce({ rows: [mockErrorCount] });

      const result = await AnalyticsService.getRealTimeMetrics();

      expect(result).toEqual({
        todayStats: mockTodayStats,
        recentErrors: 2,
        timestamp: expect.any(String),
      });
    });

    it('should throw error when database query fails', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(AnalyticsService.getRealTimeMetrics()).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends for default 24 hours', async () => {
      const mockTrends = [
        {
          hour: '2024-01-01T10:00:00.000Z',
          query_count: '10',
          avg_response_time: '200',
          error_count: '1',
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockTrends });

      const result = await AnalyticsService.getPerformanceTrends();

      expect(result).toEqual(mockTrends);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '24 hours'")
      );
    });

    it('should return performance trends for custom hours', async () => {
      const mockTrends: any[] = [];
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockTrends });

      await AnalyticsService.getPerformanceTrends(48);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '48 hours'")
      );
    });
  });

  describe('checkForAnomalies', () => {
    beforeEach(() => {
      // Mock current time to be during business hours (10 AM)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should detect high error rate anomaly', async () => {
      const errorRateData = { total: '20', errors: '5' }; // 25% error rate
      const avgTimeData = { avg_time: '1000' }; // Normal response time

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [errorRateData] })
        .mockResolvedValueOnce({ rows: [avgTimeData] });

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('high_error_rate');
      expect(result.alerts[0].severity).toBe('high');
    });

    it('should detect slow response time anomaly', async () => {
      const errorRateData = { total: '20', errors: '1' }; // 5% error rate (normal)
      const avgTimeData = { avg_time: '4000' }; // Slow response time

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [errorRateData] })
        .mockResolvedValueOnce({ rows: [avgTimeData] });

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('slow_response');
      expect(result.alerts[0].severity).toBe('medium');
    });

    it('should detect low volume anomaly during business hours', async () => {
      const errorRateData = { total: '3', errors: '0' }; // Low volume
      const avgTimeData = { avg_time: '200' }; // Normal response time

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [errorRateData] })
        .mockResolvedValueOnce({ rows: [avgTimeData] });

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('low_volume');
      expect(result.alerts[0].severity).toBe('low');
    });

    it('should return no alerts when everything is normal', async () => {
      const errorRateData = { total: '20', errors: '1' }; // 5% error rate
      const avgTimeData = { avg_time: '200' }; // Normal response time

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [errorRateData] })
        .mockResolvedValueOnce({ rows: [avgTimeData] });

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toHaveLength(0);
    });

    it('should return empty alerts when database query fails', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await AnalyticsService.checkForAnomalies();

      expect(result.alerts).toEqual([]);
    });
  });
});
