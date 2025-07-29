import { Router } from 'express';
import { pool } from '../database/init';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/export/data - Export analytics data
router.get('/data', async (req, res) => {
  try {
    const format = (req.query.format as string) || 'json';
    const timeRange = (req.query.timeRange as string) || '24h';
    const dataType = (req.query.dataType as string) || 'all';

    const whereClause = getTimeRangeClause(timeRange);
    const data: any = {};

    // Export FAQ interactions
    if (dataType === 'all' || dataType === 'interactions') {
      const interactionsResult = await pool.query(
        `SELECT 
          id,
          timestamp,
          query_text,
          status,
          source_file,
          reasoning,
          processing_time,
          session_id,
          user_feedback
         FROM faq_interactions ${whereClause}
         ORDER BY timestamp DESC`
      );
      data.interactions = interactionsResult.rows;
    }

    // Export system metrics
    if (dataType === 'all' || dataType === 'metrics') {
      const metricsResult = await pool.query(
        `SELECT 
          id,
          timestamp,
          metric_name,
          metric_value,
          metric_unit
         FROM system_metrics ${whereClause}
         ORDER BY timestamp DESC`
      );
      data.systemMetrics = metricsResult.rows;
    }

    // Export FAQ file stats
    if (dataType === 'all' || dataType === 'faq-stats') {
      const faqStatsResult = await pool.query(
        `SELECT 
          source_file,
          COUNT(*) as total_queries,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_queries,
          ROUND((COUNT(CASE WHEN status = 'success' THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100, 2) as success_rate,
          AVG(processing_time) as avg_response_time
         FROM faq_interactions 
         WHERE source_file IS NOT NULL ${whereClause.replace('WHERE', 'AND')}
         GROUP BY source_file
         ORDER BY total_queries DESC`
      );
      data.faqStats = faqStatsResult.rows;
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="analytics-export-${Date.now()}.csv"`
      );

      // Convert to CSV format
      const csv = convertToCSV(data);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="analytics-export-${Date.now()}.json"`
      );
      res.json({
        exportInfo: {
          timestamp: new Date().toISOString(),
          timeRange,
          dataType,
          format,
        },
        data,
      });
    }
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// GET /api/export/report - Generate analytics report
router.get('/report', async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || '24h';
    const whereClause = getTimeRangeClause(timeRange);

    // Generate comprehensive report
    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) as total_queries,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_queries,
        COUNT(CASE WHEN status = 'no_answer' THEN 1 END) as no_answer_queries,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_queries,
        AVG(processing_time) as avg_response_time,
        MIN(timestamp) as period_start,
        MAX(timestamp) as period_end
       FROM faq_interactions ${whereClause}`
    );

    const topFaqsResult = await pool.query(
      `SELECT 
        source_file,
        COUNT(*) as usage_count,
        ROUND((COUNT(CASE WHEN status = 'success' THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100, 2) as success_rate
       FROM faq_interactions 
       WHERE source_file IS NOT NULL ${whereClause.replace('WHERE', 'AND')}
       GROUP BY source_file
       ORDER BY usage_count DESC
       LIMIT 10`
    );

    const hourlyTrendsResult = await pool.query(
      `SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as query_count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_count
       FROM faq_interactions ${whereClause}
       GROUP BY hour
       ORDER BY hour DESC
       LIMIT 24`
    );

    const report = {
      reportInfo: {
        generatedAt: new Date().toISOString(),
        timeRange,
        periodCovered: {
          start: summaryResult.rows[0].period_start,
          end: summaryResult.rows[0].period_end,
        },
      },
      summary: summaryResult.rows[0],
      topFaqFiles: topFaqsResult.rows,
      hourlyTrends: hourlyTrendsResult.rows,
      insights: generateInsights(summaryResult.rows[0], topFaqsResult.rows),
    };

    res.json(report);
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function to generate time range WHERE clause
function getTimeRangeClause(timeRange: string): string {
  const now = new Date();
  let startTime: Date;

  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return `WHERE timestamp >= '${startTime.toISOString()}'`;
}

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  let csv = '';

  // Convert interactions to CSV
  if (data.interactions && data.interactions.length > 0) {
    csv += 'FAQ Interactions\n';
    csv += Object.keys(data.interactions[0]).join(',') + '\n';
    data.interactions.forEach((row: any) => {
      csv +=
        Object.values(row)
          .map((value: any) =>
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          )
          .join(',') + '\n';
    });
    csv += '\n';
  }

  // Convert system metrics to CSV
  if (data.systemMetrics && data.systemMetrics.length > 0) {
    csv += 'System Metrics\n';
    csv += Object.keys(data.systemMetrics[0]).join(',') + '\n';
    data.systemMetrics.forEach((row: any) => {
      csv +=
        Object.values(row)
          .map((value: any) =>
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          )
          .join(',') + '\n';
    });
    csv += '\n';
  }

  // Convert FAQ stats to CSV
  if (data.faqStats && data.faqStats.length > 0) {
    csv += 'FAQ Statistics\n';
    csv += Object.keys(data.faqStats[0]).join(',') + '\n';
    data.faqStats.forEach((row: any) => {
      csv +=
        Object.values(row)
          .map((value: any) =>
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          )
          .join(',') + '\n';
    });
  }

  return csv;
}

// Helper function to generate insights
function generateInsights(summary: any, topFaqs: any[]): string[] {
  const insights: string[] = [];
  const totalQueries = parseInt(summary.total_queries);
  const successfulQueries = parseInt(summary.successful_queries);
  const successRate =
    totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0;

  if (successRate > 80) {
    insights.push('Excellent success rate indicates well-optimized FAQ system');
  } else if (successRate > 60) {
    insights.push('Good success rate, but there is room for improvement');
  } else {
    insights.push('Low success rate suggests FAQ content needs optimization');
  }

  if (summary.avg_response_time > 2000) {
    insights.push(
      'High average response time detected - consider performance optimization'
    );
  }

  if (topFaqs.length > 0) {
    const topFaq = topFaqs[0];
    insights.push(
      `Most active FAQ file: ${topFaq.source_file} with ${topFaq.usage_count} queries`
    );
  }

  return insights;
}

export default router;
