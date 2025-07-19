import { Pool } from "pg";
import { logger } from "../utils/logger";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "faq_analytics",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function initializeDatabase(): Promise<void> {
  try {
    await pool.connect();
    logger.info("Database connection established");

    // Create tables if they don't exist
    await createTables();
    logger.info("Database tables verified/created");
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  const client = await pool.connect();

  try {
    // FAQ interactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS faq_interactions (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        query_text TEXT NOT NULL,
        status VARCHAR(20) NOT NULL,
        source_file VARCHAR(100),
        reasoning TEXT,
        processing_time FLOAT,
        session_id VARCHAR(50),
        user_feedback INTEGER
      )
    `);

    // System metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metric_name VARCHAR(50) NOT NULL,
        metric_value FLOAT NOT NULL,
        metric_unit VARCHAR(20)
      )
    `);

    // FAQ file statistics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS faq_file_stats (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_name VARCHAR(100) NOT NULL,
        total_queries INTEGER DEFAULT 0,
        successful_queries INTEGER DEFAULT 0,
        success_rate FLOAT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_faq_interactions_timestamp ON faq_interactions(timestamp);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_faq_interactions_status ON faq_interactions(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
    `);
  } finally {
    client.release();
  }
}

export { pool };
