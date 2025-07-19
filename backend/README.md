# FAQ Analytics Backend

Backend API for the FAQ Analytics Dashboard built with Express.js, TypeScript, and PostgreSQL.

## Features

- Real-time analytics data collection
- RESTful API endpoints for dashboard data
- WebSocket support for live updates
- Performance monitoring
- Data export capabilities
- System health monitoring

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with native `pg` driver
- **Real-time**: Socket.io
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate limiting

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure your database settings:

   ```bash
   cp .env.example .env
   ```

3. **Database Setup**:
   Make sure PostgreSQL is running and create a database named `faq_analytics` (or whatever you specified in `.env`).

4. **Start Development Server**:

   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## API Documentation

Interactive API documentation is available via Swagger UI at:
**http://localhost:3001/api-docs**

The documentation includes:

- All API endpoints with request/response schemas
- Interactive testing interface
- Examples and parameter descriptions
- Real-time testing capabilities

## API Endpoints

### Analytics Endpoints

- `GET /api/analytics/overview` - Get overview metrics
- `GET /api/analytics/queries` - Get query analytics
- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/faq-stats` - Get FAQ effectiveness stats
- `GET /api/analytics/unanswered` - Get unanswered queries to identify content gaps

### System Endpoints

- `GET /api/system/health` - Health check
- `POST /api/system/metrics` - Log custom metrics
- `GET /api/system/stats` - Get system statistics

### Export Endpoints

- `GET /api/export/data` - Export analytics data
- `GET /api/export/report` - Generate analytics report

## Database Schema

The backend automatically creates the following tables:

- `faq_interactions` - Stores all FAQ query interactions
- `system_metrics` - Stores system performance metrics
- `faq_file_stats` - Stores FAQ file usage statistics

## Socket.io Events

- `analyticsUpdate` - Real-time analytics data
- `performanceUpdate` - Performance metrics updates
- `newQuery` - New query notifications
- `systemAlert` - System alerts and warnings

## Usage with MCP Server

To integrate with your MCP FAQ server, use the `AnalyticsService` to log queries:

```typescript
import AnalyticsService from "./services/analyticsService";

// Log a query interaction
await AnalyticsService.logQuery({
  queryText: "How do I reset my password?",
  status: "success",
  sourceFile: "account_management.txt",
  reasoning: "Found relevant answer in FAQ",
  processingTime: 250,
  sessionId: "user-session-123",
});
```

## Project Structure

```
src/
├── routes/           # API route handlers
├── services/         # Business logic services
├── database/         # Database configuration and initialization
├── utils/           # Utility functions (logger, etc.)
└── server.ts        # Main server file
```
