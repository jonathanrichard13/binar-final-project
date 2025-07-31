import AnalyticsService from "../services/analyticsService";
import { logger } from "../utils/logger";

/**
 * Example integration middleware for logging MCP FAQ queries
 * This shows how to integrate the analytics logging with your MCP server
 */

export interface MCPQueryRequest {
  query: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface MCPQueryResponse {
  success: boolean;
  answer?: string;
  sourceFile?: string;
  reasoning?: string;
  processingTime: number;
  error?: string;
}

export class MCPAnalyticsIntegration {
  /**
   * Log MCP query interaction to analytics database
   */
  static async logMCPQuery(
    request: MCPQueryRequest,
    response: MCPQueryResponse
  ): Promise<void> {
    try {
      const status = response.success
        ? "success"
        : response.error
          ? "error"
          : "no_answer";

      await AnalyticsService.logQuery({
        queryText: request.query,
        status,
        sourceFile: response.sourceFile,
        reasoning: response.reasoning,
        processingTime: response.processingTime,
        sessionId: request.sessionId,
      });

      // Update FAQ file stats if applicable
      if (response.sourceFile) {
        await AnalyticsService.updateFaqFileStats(
          response.sourceFile,
          response.success
        );
      }

      // Log system metrics
      await AnalyticsService.logSystemMetric(
        "query_processing_time",
        response.processingTime,
        "milliseconds"
      );

      logger.info("MCP query logged to analytics", {
        query: request.query.substring(0, 100), // First 100 chars
        status,
        processingTime: response.processingTime,
      });
    } catch (error) {
      logger.error("Failed to log MCP query to analytics:", error);
      // Don't throw - analytics logging shouldn't break the main functionality
    }
  }

  /**
   * Example middleware function for Express.js-based MCP server
   */
  static logAnalyticsMiddleware() {
    return async (req: any, res: any, next: any) => {
      const startTime = Date.now();

      // Store original json method
      const originalJson = res.json;

      // Override json method to capture response
      res.json = function (body: any) {
        const processingTime = Date.now() - startTime;

        // Log to analytics (async, non-blocking)
        MCPAnalyticsIntegration.logMCPQuery(
          {
            query: req.body?.query || req.query?.q || "Unknown query",
            sessionId: req.headers["x-session-id"] || req.sessionID,
            timestamp: new Date(),
          },
          {
            success: res.statusCode === 200 && body.success !== false,
            answer: body.answer,
            sourceFile: body.sourceFile,
            reasoning: body.reasoning,
            processingTime,
            error: body.error,
          }
        ).catch((err) => {
          logger.error("Analytics logging failed:", err);
        });

        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Batch log multiple queries (useful for bulk operations)
   */
  static async logBatchQueries(
    queries: Array<{
      request: MCPQueryRequest;
      response: MCPQueryResponse;
    }>
  ): Promise<void> {
    try {
      for (const { request, response } of queries) {
        await this.logMCPQuery(request, response);
      }

      logger.info(`Batch logged ${queries.length} queries to analytics`);
    } catch (error) {
      logger.error("Failed to batch log queries:", error);
    }
  }
}

export default MCPAnalyticsIntegration;
