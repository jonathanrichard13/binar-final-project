import { pool } from '../database/init';
import { logger } from '../utils/logger';

export interface QueryLogData {
  queryText: string;
  status: 'success' | 'no_answer' | 'error';
  sourceFile?: string;
  reasoning?: string;
  processingTime?: number;
  sessionId?: string;
  userFeedback?: number;
}

export class AnalyticsService {
  // Log a query interaction
  static async logQuery(data: QueryLogData): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO faq_interactions 
         (query_text, status, source_file, reasoning, processing_time, session_id, user_feedback) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          data.queryText,
          data.status,
          data.sourceFile || null,
          data.reasoning || null,
          data.processingTime || null,
          data.sessionId || null,
          data.userFeedback || null,
        ]
      );

      logger.info('Query logged successfully', {
        status: data.status,
        sourceFile: data.sourceFile,
        processingTime: data.processingTime,
      });
    } catch (error) {
      logger.error('Failed to log query:', error);
      throw error;
    }
  }

  // Log system metrics
  static async logSystemMetric(
    metricName: string,
    metricValue: number,
    metricUnit?: string
  ): Promise<void> {
    try {
      await pool.query(
        'INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES ($1, $2, $3)',
        [metricName, metricValue, metricUnit || null]
      );
    } catch (error) {
      logger.error('Failed to log system metric:', error);
      throw error;
    }
  }

  // Update FAQ file statistics
  static async updateFaqFileStats(
    fileName: string,
    wasSuccessful: boolean
  ): Promise<void> {
    try {
      // Use UPSERT to update existing record or insert new one
      await pool.query(
        `INSERT INTO faq_file_stats (file_name, total_queries, successful_queries, last_updated)
         VALUES ($1, 1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (file_name) DO UPDATE SET
           total_queries = faq_file_stats.total_queries + 1,
           successful_queries = faq_file_stats.successful_queries + $2,
           success_rate = CASE 
             WHEN (faq_file_stats.total_queries + 1) > 0 
             THEN ((faq_file_stats.successful_queries + $2)::FLOAT / (faq_file_stats.total_queries + 1)::FLOAT) * 100 
             ELSE 0 
           END,
           last_updated = CURRENT_TIMESTAMP`,
        [fileName, wasSuccessful ? 1 : 0]
      );
    } catch (error) {
      logger.error('Failed to update FAQ file stats:', error);
      throw error;
    }
  }

  // Get real-time metrics for dashboard
  static async getRealTimeMetrics(): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_queries_today,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_queries_today,
          AVG(processing_time) as avg_response_time_today
        FROM faq_interactions 
        WHERE timestamp >= CURRENT_DATE
      `);

      const recentErrors = await pool.query(`
        SELECT COUNT(*) as error_count
        FROM faq_interactions 
        WHERE status = 'error' 
        AND timestamp >= NOW() - INTERVAL '1 hour'
      `);

      return {
        todayStats: result.rows[0],
        recentErrors: parseInt(recentErrors.rows[0].error_count),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }

  // Get performance trends
  static async getPerformanceTrends(hours: number = 24): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as query_count,
          AVG(processing_time) as avg_response_time,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
        FROM faq_interactions 
        WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
        GROUP BY hour
        ORDER BY hour ASC
      `);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get performance trends:', error);
      throw error;
    }
  }

  // Check for anomalies
  static async checkForAnomalies(): Promise<{ alerts: any[] }> {
    const alerts: any[] = [];

    try {
      // Check for high error rate
      const errorRateResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
        FROM faq_interactions 
        WHERE timestamp >= NOW() - INTERVAL '1 hour'
      `);

      const total = parseInt(errorRateResult.rows[0].total);
      const errors = parseInt(errorRateResult.rows[0].errors);
      const errorRate = total > 0 ? (errors / total) * 100 : 0;

      if (errorRate > 10) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'high',
          message: `High error rate detected: ${errorRate.toFixed(
            2
          )}% in the last hour`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for slow response times
      const slowResponseResult = await pool.query(`
        SELECT AVG(processing_time) as avg_time
        FROM faq_interactions 
        WHERE processing_time IS NOT NULL 
        AND timestamp >= NOW() - INTERVAL '1 hour'
      `);

      const avgTime = parseFloat(slowResponseResult.rows[0].avg_time) || 0;
      if (avgTime > 3000) {
        // 3 seconds
        alerts.push({
          type: 'slow_response',
          severity: 'medium',
          message: `Slow average response time: ${avgTime.toFixed(
            0
          )}ms in the last hour`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for low query volume (might indicate system issues)
      if (
        total < 5 &&
        new Date().getHours() >= 9 &&
        new Date().getHours() <= 17
      ) {
        alerts.push({
          type: 'low_volume',
          severity: 'low',
          message: `Unusually low query volume: ${total} queries in the last hour`,
          timestamp: new Date().toISOString(),
        });
      }

      return { alerts };
    } catch (error) {
      logger.error('Failed to check for anomalies:', error);
      return { alerts: [] };
    }
  }
}

export default AnalyticsService;
