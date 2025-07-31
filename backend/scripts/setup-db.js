#!/usr/bin/env node

const { Pool } = require("pg");
require("dotenv").config();

async function setupDatabase() {
  console.log("Setting up FAQ Analytics Database...");

  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "faq_analytics",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
  });

  try {
    // Test connection
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful");

    // Create tables
    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metric_name VARCHAR(50) NOT NULL,
        metric_value FLOAT NOT NULL,
        metric_unit VARCHAR(20)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS faq_file_stats (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_name VARCHAR(100) NOT NULL UNIQUE,
        total_queries INTEGER DEFAULT 0,
        successful_queries INTEGER DEFAULT 0,
        success_rate FLOAT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_faq_interactions_timestamp ON faq_interactions(timestamp)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_faq_interactions_status ON faq_interactions(status)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp)
    `);

    console.log("✅ Database tables created successfully");
    console.log("✅ Indexes created successfully");

    // Insert sample data for testing
    await pool.query(`
      INSERT INTO faq_interactions (query_text, status, source_file, reasoning, processing_time, session_id)
      VALUES 
        ('How do I reset my password?', 'success', 'account_management.txt', 'Found password reset instructions', 245, 'session_001'),
        ('What are your pricing plans?', 'success', 'billing_payments.txt', 'Located pricing information', 189, 'session_002'),
        ('How to delete my account?', 'no_answer', null, 'No relevant FAQ found', 156, 'session_003')
      ON CONFLICT DO NOTHING
    `);

    await pool.query(`
      INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
      VALUES 
        ('cpu_usage', 45.2, 'percent'),
        ('memory_usage', 1024, 'MB'),
        ('response_time', 234, 'ms')
      ON CONFLICT DO NOTHING
    `);

    console.log("✅ Sample data inserted");
    console.log("🚀 Database setup complete!");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
