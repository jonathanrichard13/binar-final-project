import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../src/routes/analytics';

// Mock the database pool module
jest.mock('../../src/database/init', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { pool } from '../../src/database/init';

const mockPool = pool as jest.Mocked<typeof pool>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview successfully', async () => {
      const mockTotalQueries = { total: '100' };
      const mockSuccessRate = { total: '100', successful: '85' };
      const mockTrends = [
        { date: '2024-01-01', queries: '20' },
        { date: '2024-01-02', queries: '25' },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTotalQueries] })
        .mockResolvedValueOnce({ rows: [mockSuccessRate] })
        .mockResolvedValueOnce({ rows: mockTrends });

      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      expect(response.body).toHaveProperty('totalQueries');
      expect(response.body).toHaveProperty('successRate');
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should handle timeRange parameter', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/analytics/overview?timeRange=7d')
        .expect(200);

      // Verify that database queries were called with appropriate time filtering
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/analytics/queries', () => {
    it('should return query analytics successfully', async () => {
      const mockQueries = [
        {
          id: 1,
          query_text: 'How to reset password?',
          status: 'success',
          timestamp: '2024-01-01T10:00:00Z',
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockQueries,
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/analytics/queries')
        .expect(200);

      expect(response.body).toHaveProperty('queries');
      expect(response.body.queries).toHaveLength(1);
      expect(response.body.queries[0]).toHaveProperty('query_text');
    });

    it('should handle pagination parameters', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await request(app)
        .get('/api/analytics/queries?page=2&limit=50')
        .expect(200);

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle status filter', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await request(app)
        .get('/api/analytics/queries?status=success')
        .expect(200);

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/performance', () => {
    it('should return performance metrics successfully', async () => {
      const mockPerformanceData = [
        {
          hour: '2024-01-01T10:00:00Z',
          avg_response_time: '250.5',
          query_count: '10',
          error_rate: '5.0',
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockPerformanceData,
      });

      const response = await request(app)
        .get('/api/analytics/performance')
        .expect(200);

      expect(response.body).toHaveProperty('performanceData');
      expect(response.body.performanceData).toHaveLength(1);
    });

    it('should handle custom time range', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await request(app).get('/api/analytics/performance?hours=48').expect(200);

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/faq-stats', () => {
    it('should return FAQ file statistics successfully', async () => {
      const mockFaqStats = [
        {
          file_name: 'account_management.txt',
          total_queries: '50',
          successful_queries: '45',
          success_rate: '90.0',
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockFaqStats,
      });

      const response = await request(app)
        .get('/api/analytics/faq-stats')
        .expect(200);

      expect(response.body).toHaveProperty('faqStats');
      expect(response.body.faqStats).toHaveLength(1);
      expect(response.body.faqStats[0]).toHaveProperty('file_name');
    });
  });

  describe('GET /api/analytics/unanswered', () => {
    it('should return unanswered queries successfully', async () => {
      const mockUnansweredQueries = [
        {
          id: 1,
          query_text: 'Unknown question',
          timestamp: '2024-01-01T10:00:00Z',
          frequency: '3',
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockUnansweredQueries,
        rowCount: 1,
      });

      const response = await request(app)
        .get('/api/analytics/unanswered')
        .expect(200);

      expect(response.body).toHaveProperty('unansweredQueries');
      expect(response.body.unansweredQueries).toHaveLength(1);
    });

    it('should handle pagination for unanswered queries', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await request(app)
        .get('/api/analytics/unanswered?page=1&limit=25')
        .expect(200);

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/real-time', () => {
    it('should return real-time metrics successfully', async () => {
      const mockRealTimeData = {
        total_queries_today: '50',
        successful_queries_today: '45',
        avg_response_time_today: '250.5',
      };
      const mockErrorCount = { error_count: '2' };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockRealTimeData] })
        .mockResolvedValueOnce({ rows: [mockErrorCount] });

      const response = await request(app)
        .get('/api/analytics/real-time')
        .expect(200);

      expect(response.body).toHaveProperty('todayStats');
      expect(response.body).toHaveProperty('recentErrors');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/analytics/alerts', () => {
    it('should return alerts when anomalies detected', async () => {
      const errorRateData = { total: '20', errors: '5' }; // 25% error rate
      const avgTimeData = { avg_time: '1000' }; // Normal response time

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [errorRateData] })
        .mockResolvedValueOnce({ rows: [avgTimeData] });

      const response = await request(app)
        .get('/api/analytics/alerts')
        .expect(200);

      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should return empty alerts when no anomalies', async () => {
      const errorRateData = { total: '20', errors: '1' }; // 5% error rate
      const avgTimeData = { avg_time: '200' }; // Normal response time

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [errorRateData] })
        .mockResolvedValueOnce({ rows: [avgTimeData] });

      const response = await request(app)
        .get('/api/analytics/alerts')
        .expect(200);

      expect(response.body.alerts).toHaveLength(0);
    });
  });

  describe('POST /api/analytics/feedback', () => {
    it('should submit user feedback successfully', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const feedbackData = {
        queryId: 123,
        rating: 5,
        comment: 'Very helpful',
      };

      const response = await request(app)
        .post('/api/analytics/feedback')
        .send(feedbackData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should validate required feedback fields', async () => {
      const response = await request(app)
        .post('/api/analytics/feedback')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate rating range', async () => {
      const feedbackData = {
        queryId: 123,
        rating: 10, // Invalid rating (should be 1-5)
        comment: 'Test',
      };

      const response = await request(app)
        .post('/api/analytics/feedback')
        .send(feedbackData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
