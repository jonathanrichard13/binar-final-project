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
          (COUNT(CASE WHEN status = 'success' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
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

/**
 * @swagger
 * /api/analytics/unanswered:
 *   get:
 *     summary: Get unanswered queries
 *     description: Returns queries that received 'no_answer' status to identify FAQ content gaps
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *           default: 7d
 *         description: Time range for unanswered queries
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results per page
 *       - in: query
 *         name: groupSimilar
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Group similar queries together
 *     responses:
 *       200:
 *         description: List of unanswered queries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unansweredQueries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       query_text: { type: string }
 *                       timestamp: { type: string, format: date-time }
 *                       session_id: { type: string }
 *                       processing_time: { type: number }
 *                       frequency: { type: integer, description: "How many times this query appeared" }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalUnanswered: { type: integer }
 *                     uniqueQueries: { type: integer }
 *                     topUnansweredCategories: { type: array }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/analytics/unanswered
router.get("/unanswered", async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "7d";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const groupSimilar = req.query.groupSimilar === "true";
    const offset = (page - 1) * limit;

    const whereClause = getTimeRangeClause(timeRange);

    let unansweredQueries;
    let totalCount;

    if (groupSimilar) {
      // Group similar queries and count frequency
      unansweredQueries = await pool.query(
        `SELECT 
          MIN(id) as id,
          query_text,
          COUNT(*) as frequency,
          MAX(timestamp) as latest_timestamp,
          MIN(timestamp) as first_timestamp,
          AVG(processing_time) as avg_processing_time,
          ARRAY_AGG(DISTINCT session_id) as session_ids
         FROM faq_interactions 
         WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}
         GROUP BY LOWER(TRIM(query_text))
         ORDER BY frequency DESC, latest_timestamp DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Get total count of unique unanswered queries
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT LOWER(TRIM(query_text))) as total 
         FROM faq_interactions 
         WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}`
      );
      totalCount = parseInt(countResult.rows[0].total);
    } else {
      // Get individual unanswered queries
      unansweredQueries = await pool.query(
        `SELECT 
          id,
          query_text,
          timestamp,
          session_id,
          processing_time,
          reasoning
         FROM faq_interactions 
         WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}
         ORDER BY timestamp DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total 
         FROM faq_interactions 
         WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}`
      );
      totalCount = parseInt(countResult.rows[0].total);
    }

    // Get summary statistics
    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) as total_unanswered,
        COUNT(DISTINCT LOWER(TRIM(query_text))) as unique_queries
       FROM faq_interactions 
       WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}`
    );

    // Analyze common keywords in unanswered queries for categories
    const keywordAnalysis = await pool.query(
      `WITH words AS (
        SELECT 
          UNNEST(string_to_array(LOWER(query_text), ' ')) as word
        FROM faq_interactions 
        WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}
       )
       SELECT 
        word,
        COUNT(*) as frequency
       FROM words
       WHERE LENGTH(word) > 3
       GROUP BY word
       ORDER BY frequency DESC
       LIMIT 10`
    );

    // Get time distribution of unanswered queries
    const timeDistribution = await pool.query(
      `SELECT 
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as unanswered_count
       FROM faq_interactions 
       WHERE status = 'no_answer' ${whereClause.replace("WHERE", "AND")}
       GROUP BY date
       ORDER BY date DESC
       LIMIT 30`
    );

    res.json({
      unansweredQueries: unansweredQueries.rows,
      summary: {
        totalUnanswered: parseInt(summaryResult.rows[0].total_unanswered),
        uniqueQueries: parseInt(summaryResult.rows[0].unique_queries),
        topKeywords: keywordAnalysis.rows,
        timeDistribution: timeDistribution.rows,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      groupSimilar,
    });
  } catch (error) {
    logger.error("Error fetching unanswered queries:", error);
    res.status(500).json({ error: "Failed to fetch unanswered queries" });
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

/**
 * @swagger
 * /api/analytics/hourly-queries:
 *   get:
 *     summary: Get hourly query counts for a specific date
 *     description: Returns the number of queries aggregated by each hour (0-23) for a given date
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-07-20"
 *         description: The date to get hourly query counts for (YYYY-MM-DD format)
 *     responses:
 *       200:
 *         description: Hourly query counts for the specified date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                   description: The requested date
 *                 totalQueries:
 *                   type: integer
 *                   description: Total queries for the day
 *                 hourlyData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 23
 *                         description: Hour of the day (0-23)
 *                       count:
 *                         type: integer
 *                         description: Number of queries in that hour
 *                       percentage:
 *                         type: number
 *                         format: float
 *                         description: Percentage of total daily queries
 *       400:
 *         description: Invalid date parameter
 *       500:
 *         description: Server error
 */

// GET /api/analytics/hourly-queries
router.get("/hourly-queries", async (req, res) => {
  try {
    const dateParam = req.query.date as string;

    // Validate date parameter
    if (!dateParam) {
      return res.status(400).json({
        error: "Date parameter is required (format: YYYY-MM-DD)",
      });
    }

    // Parse and validate the date
    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD format",
      });
    }

    // Set the date range for the specific day (00:00:00 to 23:59:59)
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Querying for date: ${dateParam}`);

    // Get hourly query counts - keep it simple and use timestamp as stored
    const hourlyResult = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count,
        MIN(timestamp) as first_timestamp,
        MAX(timestamp) as last_timestamp
       FROM faq_interactions 
       WHERE timestamp::date = $1::date
       GROUP BY EXTRACT(HOUR FROM timestamp)
       ORDER BY hour`,
      [dateParam] // Use the date parameter directly
    );

    // Get total queries for the day
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM faq_interactions 
       WHERE timestamp::date = $1::date`,
      [dateParam]
    );

    console.log(`Hourly result:`, hourlyResult.rows);
    console.log(`Total result:`, totalResult.rows);

    const totalQueries = parseInt(totalResult.rows[0].total);

    // Create a complete 24-hour array (0-23) with counts
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyResult.rows.find(
        (row) => parseInt(row.hour) === hour
      );
      const count = hourData ? parseInt(hourData.count) : 0;
      const percentage = totalQueries > 0 ? (count / totalQueries) * 100 : 0;

      hourlyData.push({
        hour,
        count,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      });
    }

    res.json({
      date: dateParam,
      totalQueries,
      hourlyData,
    });
  } catch (error) {
    logger.error("Error fetching hourly query data:", error);
    res.status(500).json({ error: "Failed to fetch hourly query data" });
  }
});

export default router;
