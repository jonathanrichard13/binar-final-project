import { Router } from "express";
import { pool } from "../database/init";
import { logger } from "../utils/logger";

const router = Router();

// Helper function to get time range clause
function getTimeRangeClause(timeRange: string): string {
  const now = new Date();
  let whereClause = "";

  switch (timeRange) {
    case "1h":
      whereClause = `WHERE timestamp >= '${new Date(
        now.getTime() - 60 * 60 * 1000
      ).toISOString()}'`;
      break;
    case "24h":
      whereClause = `WHERE timestamp >= '${new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).toISOString()}'`;
      break;
    case "7d":
      whereClause = `WHERE timestamp >= '${new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      ).toISOString()}'`;
      break;
    case "30d":
      whereClause = `WHERE timestamp >= '${new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString()}'`;
      break;
    default:
      whereClause = `WHERE timestamp >= '${new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).toISOString()}'`;
  }

  return whereClause;
}

/**
 * @swagger
 * /api/export/data:
 *   get:
 *     summary: Export analytics data
 *     description: Export analytics data in JSON or CSV format
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *       - in: query
 *         name: dataType
 *         schema:
 *           type: string
 *           enum: [all, interactions, metrics]
 *           default: all
 *     responses:
 *       200:
 *         description: Export data successfully
 *       500:
 *         description: Server error
 */
// GET /api/export/data - Export analytics data
router.get("/data", async (req, res) => {
  try {
    const format = (req.query.format as string) || "json";
    const timeRange = (req.query.timeRange as string) || "24h";
    const dataType = (req.query.dataType as string) || "all";

    const whereClause = getTimeRangeClause(timeRange);
    // eslint-disable-next-line prefer-const
    let data: any = {};

    // Export FAQ interactions
    if (dataType === "all" || dataType === "interactions") {
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
    if (dataType === "all" || dataType === "metrics") {
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
    if (dataType === "all" || dataType === "faqStats") {
      const faqStatsResult = await pool.query(
        `SELECT 
          source_file,
          COUNT(*) as total_queries,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_queries,
          ROUND((COUNT(CASE WHEN status = 'success' THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100, 2) as success_rate,
          AVG(processing_time) as avg_response_time
         FROM faq_interactions 
         WHERE source_file IS NOT NULL AND ${whereClause.replace("WHERE ", "")}
         GROUP BY source_file
         ORDER BY total_queries DESC`
      );
      data.faqStats = faqStatsResult.rows;
    }

    // Return data based on format
    if (format === "csv") {
      // Simple CSV conversion for interactions
      const csvData = convertToCSV(data.interactions || []);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${timeRange}.csv"`
      );
      res.send(csvData);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${timeRange}.json"`
      );
      res.json({ data });
    }

    logger.info(
      `Data exported successfully - Format: ${format}, TimeRange: ${timeRange}, DataType: ${dataType}`
    );
  } catch (error) {
    logger.error("Data export failed:", error);
    res.status(500).json({
      error: "Failed to export data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || "")).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export default router;
