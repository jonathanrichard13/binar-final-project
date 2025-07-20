import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FAQ Analytics Dashboard API",
      version: "1.0.0",
      description:
        "API for FAQ Analytics Dashboard - Monitor and analyze FAQ MCP system performance",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        AnalyticsOverview: {
          type: "object",
          properties: {
            totalQueries: {
              type: "integer",
              example: 1543,
              description: "Total number of queries processed",
            },
            successRate: {
              type: "number",
              format: "float",
              example: 87.5,
              description: "Success rate percentage",
            },
            averageResponseTime: {
              type: "number",
              format: "float",
              example: 245.8,
              description: "Average response time in milliseconds",
            },
            queryTrends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  hour: { type: "string", format: "date-time" },
                  count: { type: "integer" },
                },
              },
            },
            topFaqFiles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_file: { type: "string" },
                  usage_count: { type: "integer" },
                },
              },
            },
          },
        },
        QueryInteraction: {
          type: "object",
          properties: {
            id: { type: "integer" },
            timestamp: { type: "string", format: "date-time" },
            query_text: { type: "string" },
            status: {
              type: "string",
              enum: ["success", "no_answer", "error"],
              example: "success",
            },
            source_file: { type: "string", nullable: true },
            reasoning: { type: "string", nullable: true },
            processing_time: {
              type: "number",
              format: "float",
              nullable: true,
            },
            session_id: { type: "string", nullable: true },
            user_feedback: { type: "integer", nullable: true },
          },
        },
        SystemHealth: {
          type: "object",
          properties: {
            status: { type: "string", example: "healthy" },
            timestamp: { type: "string", format: "date-time" },
            uptime: {
              type: "integer",
              description: "Server uptime in seconds",
            },
            database: {
              type: "object",
              properties: {
                status: { type: "string", example: "connected" },
                latency: {
                  type: "integer",
                  description: "Database latency in ms",
                },
              },
            },
            metrics: {
              type: "object",
              properties: {
                errorRate: { type: "number", format: "float" },
                averageResponseTime: { type: "number", format: "float" },
                totalQueriesLastHour: { type: "integer" },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);
