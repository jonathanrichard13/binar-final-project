import { Router } from "express";
import { pool } from "../database/init";
import { logger } from "../utils/logger";

const router = Router();

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: System health check
 *     description: Returns system health status including database connection and performance metrics
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *       500:
 *         description: System is unhealthy
 */
// GET /api/system/health
router.get("/health", async (req, res) => {
  try {
    // Check database connection
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    const dbLatency = Date.now() - dbStart;

    // Get system uptime
    const uptime = process.uptime();

    // Check recent error rate (simplified)
    const errorRateResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
      FROM faq_interactions 
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
    `);

    const { total, errors } = errorRateResult.rows[0] || {
      total: 0,
      errors: 0,
    };
    const errorRate =
      total > 0 ? (parseInt(errors) / parseInt(total)) * 100 : 0;

    // Get average response time
    const avgResponseResult = await pool.query(`
      SELECT AVG(processing_time) as avg_time
      FROM faq_interactions 
      WHERE timestamp >= NOW() - INTERVAL '1 hour' 
        AND processing_time IS NOT NULL
    `);

    const avgResponseTime = parseFloat(
      avgResponseResult.rows[0]?.avg_time || "0"
    );

    const response = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime,
      database: {
        status: "connected",
        latency: dbLatency,
      },
      metrics: {
        errorRate,
        averageResponseTime: avgResponseTime,
        totalQueriesLastHour: parseInt(total),
      },
    };

    res.status(200).json(response);
    logger.info("Health check completed successfully");
  } catch (error) {
    logger.error("Health check failed:", error);

    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      database: {
        status: "disconnected",
        latency: -1,
      },
    });
  }
});

export default router;
