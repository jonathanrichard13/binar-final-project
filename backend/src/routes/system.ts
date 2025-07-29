import { Router } from 'express';
import { pool } from '../database/init';
import { logger } from '../utils/logger';

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemHealth'
 *       500:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: 'unhealthy' }
 *                 timestamp: { type: string, format: date-time }
 *                 error: { type: string }
 */
// GET /api/system/health
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Get system uptime
    const uptime = process.uptime();

    // Check recent error rate
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

    // Get average response time in last hour
    const avgResponseResult = await pool.query(`
      SELECT AVG(processing_time) as avg_time 
      FROM faq_interactions 
      WHERE processing_time IS NOT NULL 
      AND timestamp >= NOW() - INTERVAL '1 hour'
    `);

    const avgResponseTime = parseFloat(avgResponseResult.rows[0].avg_time) || 0;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: {
        status: 'connected',
        latency: dbLatency,
      },
      metrics: {
        errorRate: Math.round(errorRate * 100) / 100,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        totalQueriesLastHour: total,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// POST /api/system/metrics - Log custom system metrics
router.post('/metrics', async (req, res) => {
  try {
    const { metricName, metricValue, metricUnit } = req.body;

    if (!metricName || metricValue === undefined) {
      return res
        .status(400)
        .json({ error: 'metricName and metricValue are required' });
    }

    await pool.query(
      'INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES ($1, $2, $3)',
      [metricName, metricValue, metricUnit || null]
    );

    res.status(201).json({ message: 'Metric logged successfully' });
  } catch (error) {
    logger.error('Error logging system metric:', error);
    res.status(500).json({ error: 'Failed to log metric' });
  }
});

// GET /api/system/stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    // Get database statistics
    const dbSizeResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    // Get connection pool stats
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };

    // Get recent activity
    const activityResult = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as queries
      FROM faq_interactions 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour DESC
    `);

    res.json({
      database: {
        tables: dbSizeResult.rows,
        connectionPool: poolStats,
      },
      activity: activityResult.rows,
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (error) {
    logger.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

export default router;
