import { Router } from "express";
import { pool } from "../database/init";
import { logger } from "../utils/logger";

const router = Router();

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Returns overview analytics including total queries, success rate, and trends
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *           default: 24h
 *         description: Time range for analytics data
 *     responses:
 *       200:
 *         description: Analytics overview data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsOverview'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/analytics/overview
router.get("/overview", async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const whereClause = getTimeRangeClause(timeRange);

    // Get total queries
    const totalQueriesResult = await pool.query(
      `SELECT COUNT(*) as total FROM faq_interactions ${whereClause}`
    );

    // Get success rate
    const successRateResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful
       FROM faq_interactions ${whereClause}`
    );

    // Get average response time
    const avgResponseTimeResult = await pool.query(
      `SELECT AVG(processing_time) as avg_time FROM faq_interactions 
       WHERE processing_time IS NOT NULL ${whereClause.replace("WHERE", "AND")}`
    );

    // Get query volume trends (hourly)
    const trendsResult = await pool.query(
      `SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as count
       FROM faq_interactions ${whereClause}
       GROUP BY hour
       ORDER BY hour DESC
       LIMIT 24`
    );

    // Get most active FAQ files
    const topFilesResult = await pool.query(
      `SELECT 
        source_file,
        COUNT(*) as usage_count
       FROM faq_interactions 
       WHERE source_file IS NOT NULL ${whereClause.replace("WHERE", "AND")}
       GROUP BY source_file
       ORDER BY usage_count DESC
       LIMIT 10`
    );

    const totalQueries = parseInt(totalQueriesResult.rows[0].total);
    const successfulQueries = parseInt(successRateResult.rows[0].successful);
    const successRate =
      totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0;

    res.json({
      totalQueries,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime:
        parseFloat(avgResponseTimeResult.rows[0].avg_time) || 0,
      queryTrends: trendsResult.rows,
      topFaqFiles: topFilesResult.rows,
    });
  } catch (error) {
    logger.error("Error fetching overview analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

/**
 * @swagger
 * /api/analytics/queries:
 *   get:
 *     summary: Get query analytics
 *     description: Returns detailed query analytics with pagination
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *           default: 24h
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Query analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QueryInteraction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       500:
 *         description: Server error
 */

// GET /api/analytics/queries
router.get("/queries", async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const whereClause = getTimeRangeClause(timeRange);

    // Get query patterns
    const queriesResult = await pool.query(
      `SELECT 
        query_text,
        status,
        source_file,
        processing_time,
        timestamp,
        user_feedback
       FROM faq_interactions ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM faq_interactions ${whereClause}`
    );

    // Get status distribution
    const statusDistResult = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM faq_interactions ${whereClause}
       GROUP BY status`
    );

    res.json({
      queries: queriesResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
      statusDistribution: statusDistResult.rows,
    });
  } catch (error) {
    logger.error("Error fetching query analytics:", error);
    res.status(500).json({ error: "Failed to fetch query analytics" });
  }
});

// GET /api/analytics/performance
router.get("/performance", async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const whereClause = getTimeRangeClause(timeRange);

    // Get response time percentiles
    const percentilesResult = await pool.query(
      `SELECT 
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time) as p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time) as p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time) as p99
       FROM faq_interactions 
       WHERE processing_time IS NOT NULL ${whereClause.replace("WHERE", "AND")}`
    );

    // Get error rate over time
    const errorRateResult = await pool.query(
      `SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
       FROM faq_interactions ${whereClause}
       GROUP BY hour
       ORDER BY hour DESC
       LIMIT 24`
    );

    // Get system metrics
    const systemMetricsResult = await pool.query(
      `SELECT 
        metric_name,
        metric_value,
        metric_unit,
        timestamp
       FROM system_metrics ${whereClause}
       ORDER BY timestamp DESC
       LIMIT 100`
    );

    res.json({
      responseTimePercentiles: percentilesResult.rows[0],
      errorRateTrends: errorRateResult.rows,
      systemMetrics: systemMetricsResult.rows,
    });
  } catch (error) {
    logger.error("Error fetching performance analytics:", error);
    res.status(500).json({ error: "Failed to fetch performance analytics" });
  }
});

// GET /api/analytics/faq-stats
router.get("/faq-stats", async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const whereClause = getTimeRangeClause(timeRange);

    // Get FAQ file effectiveness
    const faqStatsResult = await pool.query(
      `SELECT 
        source_file,
        COUNT(*) as total_queries,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_queries,
        ROUND(
          (COUNT(CASE WHEN status = 'success' THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100, 
          2
        ) as success_rate,
        AVG(processing_time) as avg_response_time
       FROM faq_interactions 
       WHERE source_file IS NOT NULL ${whereClause.replace("WHERE", "AND")}
       GROUP BY source_file
       ORDER BY total_queries DESC`
    );

    // Get underutilized FAQs (assuming we have a list of all FAQ files)
    const utilizationResult = await pool.query(
      `SELECT 
        source_file,
        COUNT(*) as usage_count
       FROM faq_interactions 
       WHERE source_file IS NOT NULL ${whereClause.replace("WHERE", "AND")}
       GROUP BY source_file
       HAVING COUNT(*) < 10
       ORDER BY usage_count ASC`
    );

    res.json({
      faqEffectiveness: faqStatsResult.rows,
      underutilizedFaqs: utilizationResult.rows,
    });
  } catch (error) {
    logger.error("Error fetching FAQ stats:", error);
    res.status(500).json({ error: "Failed to fetch FAQ statistics" });
  }
});

// Helper function to generate time range WHERE clause
function getTimeRangeClause(timeRange: string): string {
  const now = new Date();
  let startTime: Date;

  switch (timeRange) {
    case "1h":
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return `WHERE timestamp >= '${startTime.toISOString()}'`;
}

export default router;
