# Product Requirements Document (PRD)

## FAQ Analytics Dashboard

### Version: 2.0

### Date: July 19, 2025

### Target Platform: Next.js Frontend with Express.js Backend and PostgreSQL Database

---

## 1. Executive Summary

This document outlines the requirements for developing a comprehensive analytics dashboard to monitor and analyze the performance of the FAQ Model Context Protocol (MCP) system. The dashboard will provide real-time insights into user queries, response patterns, system performance, FAQ effectiveness, and unanswered questions management using a modern full-stack architecture with Next.js, Express.js, and PostgreSQL.

## 2. Product Overview

### 2.1 Purpose

Create a comprehensive analytics dashboard that provides actionable insights into FAQ system usage, performance metrics, and user behavior patterns to enable data-driven optimization of the FAQ MCP system.

### 2.2 Scope

- Real-time and historical analytics of FAQ system performance
- Interactive visualizations with time-range filtering
- Query pattern analysis and trending
- Response accuracy and relevance tracking
- System performance monitoring
- FAQ content effectiveness assessment
- **Unanswered questions tracking and management**
- **Analytics dashboard for content gap identification**
- **Team workflow management for FAQ improvements**

### 2.3 Target Users

- System Administrators
- Product Managers
- Customer Support Teams
- Data Analysts
- Business Stakeholders
- **Content Managers**
- **FAQ Team Members**

## 3. Technical Requirements

### 3.1 Technology Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Backend**: Express.js 4.18+ with TypeScript
- **Database**: PostgreSQL 15+
- **Authentication**: JWT-based authentication
- **Real-time Features**: Socket.io for live updates
- **Styling**: Tailwind CSS
- **Charts**: Chart.js / Recharts
- **ORM**: Prisma for database management

### 3.2 Core Dependencies

#### Frontend Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "chart.js": "^4.0.0",
  "react-chartjs-2": "^5.0.0",
  "socket.io-client": "^4.7.0",
  "date-fns": "^2.30.0",
  "react-hook-form": "^7.45.0",
  "axios": "^1.5.0"
}
```

#### Backend Dependencies

```json
{
  "express": "^4.18.0",
  "typescript": "^5.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "socket.io": "^4.7.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.8.0",
  "winston": "^3.10.0"
}
```

### 3.3 System Architecture

#### 3.3.1 Full-Stack Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Dashboard   │ │ Analytics   │ │ Unanswered Questions│   │
│  │ Overview    │ │ Charts      │ │ Management          │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   API Gateway     │
                    │   (Express.js)    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼─────────────────────────────┐
│                    Backend Services                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Analytics   │ │ Auth        │ │ Unanswered Questions│   │
│  │ Service     │ │ Service     │ │ Service             │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   PostgreSQL      │
                    │   Database        │
                    └───────────────────┘
```

#### 3.3.2 Data Collection Layer

1. **Enhanced Query Logging System**

   - Capture all user queries with timestamps
   - Log response status (success/no_answer/error)
   - Record processing times and source files
   - Store reasoning explanations and context
   - **Track unanswered questions for content gap analysis**

2. **Performance Metrics Collection**
   - System response times and latency metrics
   - Error rates and types
   - Concurrent user statistics
   - FAQ file usage frequency and effectiveness

#### 3.3.3 Enhanced Database Schema

```sql
-- Users table for authentication and access control
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced FAQ interactions table
CREATE TABLE faq_interactions (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    query_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'no_answer', 'error'
    source_file VARCHAR(100),
    reasoning TEXT,
    processing_time FLOAT,
    session_id VARCHAR(50),
    user_feedback INTEGER, -- 1-5 rating or null
    user_agent TEXT,
    ip_address INET
);

-- NEW: Unanswered questions management table
CREATE TABLE unanswered_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    first_asked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_asked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'answered', 'rejected'
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to INTEGER REFERENCES users(id),
    category VARCHAR(100),
    tags TEXT[], -- PostgreSQL array type
    suggested_faq_file VARCHAR(100),
    draft_answer TEXT,
    resolution_notes TEXT,
    business_impact VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
    estimated_resolution_time INTEGER, -- in hours
    actual_resolution_time INTEGER, -- in hours
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System performance metrics table
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_name VARCHAR(50) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_unit VARCHAR(20),
    additional_info JSONB
);

-- FAQ file statistics table
CREATE TABLE faq_file_stats (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_name VARCHAR(100) NOT NULL,
    total_queries INTEGER DEFAULT 0,
    successful_queries INTEGER DEFAULT 0,
    success_rate FLOAT GENERATED ALWAYS AS (
        CASE
            WHEN total_queries > 0 THEN (successful_queries::FLOAT / total_queries::FLOAT) * 100
            ELSE 0
        END
    ) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_faq_interactions_timestamp ON faq_interactions(timestamp);
CREATE INDEX idx_faq_interactions_status ON faq_interactions(status);
CREATE INDEX idx_unanswered_questions_status ON unanswered_questions(status);
CREATE INDEX idx_unanswered_questions_priority ON unanswered_questions(priority);
CREATE INDEX idx_unanswered_questions_assigned ON unanswered_questions(assigned_to);
```

#### 3.3.4 Frontend Architecture (Next.js)

1. **Page Structure**

   - Dashboard Overview (`/dashboard`)
   - Query Analytics (`/analytics`)
   - Performance Monitoring (`/performance`)
   - FAQ Effectiveness (`/faq-stats`)
   - **Unanswered Questions Management (`/unanswered`)**
   - User Management (`/users`) - Admin only
   - Settings (`/settings`)

2. **Component Architecture**
   - Reusable chart components
   - Data filtering components
   - Real-time update handlers
   - **Unanswered questions workflow components**

#### 3.3.5 Backend API Architecture (Express.js)

1. **API Endpoints**
   ```
   GET  /api/analytics/overview
   GET  /api/analytics/queries
   GET  /api/analytics/performance
   GET  /api/analytics/faq-stats
   GET  /api/unanswered-questions
   POST /api/unanswered-questions
   PUT  /api/unanswered-questions/:id
   DELETE /api/unanswered-questions/:id
   POST /api/auth/login
   POST /api/auth/logout
   GET  /api/users/profile
   ```

## 4. Functional Requirements

### 4.1 Core Dashboard Features

#### 4.1.1 Enhanced Authentication & Authorization

- **JWT-based Authentication**: Secure user login/logout
- **Role-based Access Control**: Admin, Editor, Viewer roles
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt password hashing

#### 4.1.2 Time Range Filtering

- **Global Time Filter**: Apply to all dashboard pages
- **Predefined Ranges**: Last 24 hours, 7 days, 30 days, 90 days, 1 year
- **Custom Date Range**: User-selectable start and end dates
- **Real-time Toggle**: Switch between real-time and historical data
- **Time Zone Support**: Display data in user's local timezone

#### 4.1.3 Overview Dashboard

**Key Performance Indicators (KPIs)**

- Total queries processed
- Success rate percentage
- Average response time
- Most active FAQ categories
- Peak usage hours
- **Unanswered questions count**
- **Content gap indicators**

**Primary Visualizations**

- Query volume trend line chart (with time filtering)
- Success vs. No Answer ratio pie chart
- Response time distribution histogram
- FAQ file usage heatmap
- Hourly/daily activity patterns
- **Unanswered questions trend chart**

#### 4.1.4 Query Analytics Page

**Query Pattern Analysis**

- Most common query types
- Query length distribution
- Seasonal trends and patterns
- User session analysis
- **Unanswered query categorization**

**Interactive Visualizations**

- Word cloud of frequent query terms
- Query category breakdown (bar chart)
- Success rate by query complexity (scatter plot)
- Time-series analysis of query volume
- Geographic distribution (if location data available)
- **Unanswered questions word cloud**

#### 4.1.5 Performance Monitoring Page

**System Metrics**

- Response time trends
- Error rate monitoring
- System uptime statistics
- Concurrent user capacity analysis
- **Database performance metrics**

**Performance Visualizations**

- Response time percentiles (P50, P95, P99) over time
- Error rate trend line
- System load distribution
- Peak performance impact analysis
- **API endpoint performance charts**

#### 4.1.6 FAQ Effectiveness Page

**Content Performance Analysis**

- FAQ file usage frequency
- Success rate by FAQ category
- Underutilized FAQ identification
- Content gap analysis
- **FAQ improvement recommendations**

**Content Visualizations**

- FAQ file performance matrix
- Success rate heatmap by category
- Content utilization treemap
- Gap analysis charts
- **Content effectiveness timeline**

#### 4.1.7 Unanswered Questions Management Page

**Core Features**

- **Automated Question Capture**: Real-time detection of unanswered queries
- **Intelligent Categorization**: Auto-categorize by topic and priority
- **Workflow Management**: Status tracking (Pending → In Progress → Resolved)
- **Team Assignment**: Assign questions to team members
- **Bulk Operations**: Handle multiple questions simultaneously

**Management Interface**

- **Questions Table**: Sortable, filterable list of unanswered questions
- **Question Detail Modal**: Complete question information with editing capabilities
- **Priority Management**: Set and update question priorities
- **Draft Answers**: Create and edit draft responses
- **Resolution Tracking**: Monitor resolution times and team performance

**Analytics & Insights**

- **Frequency Analysis**: Track how often similar questions are asked
- **Content Gap Identification**: Identify missing FAQ content areas
- **Team Performance Metrics**: Resolution times by team member
- **Business Impact Assessment**: Evaluate customer impact of unanswered questions

### 4.2 Interactive Features

#### 4.2.1 Filtering and Drill-down

- **Multi-level Filtering**: Time, status, FAQ category, session
- **Click-through Analysis**: Drill down from high-level metrics to detailed data
- **Dynamic Updates**: Real-time chart updates based on filter selections
- **Filter Persistence**: Maintain filter state across page navigation

#### 4.2.2 Data Export Capabilities

- **CSV Export**: Raw data export for further analysis
- **PDF Reports**: Automated report generation
- **Excel Dashboards**: Formatted spreadsheet exports
- **Image Export**: Download charts as PNG/SVG

### 4.3 Real-time Features

- **Live Data Updates**: Auto-refresh every 30 seconds for real-time metrics
- **Alert System**: Configurable alerts for anomalies
- **Status Indicators**: System health monitoring
- **Live Query Feed**: Real-time display of incoming queries
- **Real-time Unanswered Questions**: Live feed of new unanswered questions

## 5. Implementation Strategy

### 5.1 Development Phases

#### Phase 1: Backend Infrastructure Setup (Week 1-2)

- **Database Setup**: PostgreSQL schema creation and optimization
- **Express.js API Development**: Core API endpoints and middleware
- **Authentication System**: JWT authentication and authorization
- **MCP Integration**: Enhanced logging with unanswered questions tracking

#### Phase 2: Core Analytics Backend (Week 3)

- **Analytics Service**: Data processing and aggregation APIs
- **Unanswered Questions Service**: Complete CRUD operations and workflow
- **Real-time Features**: Socket.io integration for live updates
- **Data Validation**: Input validation and error handling

#### Phase 3: Frontend Development (Week 4-5)

- **Next.js Setup**: Project structure and routing
- **Dashboard Components**: Charts, KPIs, and visualization components
- **Unanswered Questions UI**: Complete management interface
- **Authentication Flow**: Login, logout, and protected routes

#### Phase 4: Integration and Testing (Week 6)

- **Full-stack Integration**: Connect frontend with backend APIs
- **Real-time Features**: WebSocket implementation and testing
- **Performance Optimization**: Database queries and API response times
- **User Acceptance Testing**: End-to-end functionality testing

### 5.2 Key Implementation Components

#### 5.2.1 Backend Data Manager (Express.js + Prisma)

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  assignedQuestions UnansweredQuestion[]
}

model FaqInteraction {
  id             Int      @id @default(autoincrement())
  timestamp      DateTime @default(now())
  queryText      String
  status         String
  sourceFile     String?
  reasoning      String?
  processingTime Float?
  sessionId      String?
  userFeedback   Int?
  userAgent      String?
  ipAddress      String?
}

model UnansweredQuestion {
  id                      Int      @id @default(autoincrement())
  question                String
  frequency               Int      @default(1)
  firstAsked              DateTime @default(now())
  lastAsked               DateTime @default(now())
  status                  QuestionStatus @default(PENDING)
  priority                Priority @default(MEDIUM)
  assignedTo              Int?
  category                String?
  tags                    String[]
  suggestedFaqFile        String?
  draftAnswer             String?
  resolutionNotes         String?
  businessImpact          BusinessImpact @default(MEDIUM)
  estimatedResolutionTime Int?
  actualResolutionTime    Int?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  assignee User? @relation(fields: [assignedTo], references: [id])
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
}

enum QuestionStatus {
  PENDING
  IN_PROGRESS
  ANSWERED
  REJECTED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum BusinessImpact {
  LOW
  MEDIUM
  HIGH
}
```

#### 5.2.2 Analytics Service (Express.js)

```typescript
import { PrismaClient } from "@prisma/client";
import express from "express";

class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getOverviewMetrics(startDate: Date, endDate: Date) {
    const totalQueries = await this.prisma.faqInteraction.count({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const successfulQueries = await this.prisma.faqInteraction.count({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        status: "success",
      },
    });

    const unansweredCount = await this.prisma.unansweredQuestion.count({
      where: {
        status: "PENDING",
      },
    });

    return {
      totalQueries,
      successRate: (successfulQueries / totalQueries) * 100,
      unansweredCount,
      // ... more metrics
    };
  }

  async getUnansweredQuestions(filters: QuestionFilters) {
    return this.prisma.unansweredQuestion.findMany({
      where: {
        status: filters.status,
        priority: filters.priority,
        assignedTo: filters.assignedTo,
        // ... other filters
      },
      include: {
        assignee: {
          select: { username: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
```

#### 5.2.3 Frontend Dashboard Components (Next.js + React)

```tsx
// components/dashboard/OverviewDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface OverviewMetrics {
  totalQueries: number;
  successRate: number;
  avgResponseTime: number;
  unansweredCount: number;
  queryVolumeData: ChartData;
}

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewMetrics();
  }, [timeRange]);

  const fetchOverviewMetrics = async () => {
    try {
      const response = await fetch(
        `/api/analytics/overview?range=${timeRange}`
      );
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Queries"
          value={metrics?.totalQueries || 0}
          icon="📊"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics?.successRate.toFixed(1)}%`}
          icon="✅"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics?.avgResponseTime.toFixed(2)}s`}
          icon="⚡"
        />
        <MetricCard
          title="Unanswered Questions"
          value={metrics?.unansweredCount || 0}
          icon="❓"
          alert={metrics?.unansweredCount > 10}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Query Volume Trend</h3>
          <Line data={metrics?.queryVolumeData} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Success vs Unanswered</h3>
          <Pie data={metrics?.successRateData} />
        </div>
      </div>
    </div>
  );
}
```

#### 5.2.4 Unanswered Questions Management Component

```tsx
// pages/unanswered.tsx
import React, { useState, useEffect } from "react";
import { UnansweredQuestion, QuestionFilters } from "../types/analytics";
import QuestionTable from "../components/unanswered/QuestionTable";
import QuestionModal from "../components/unanswered/QuestionModal";
import FilterPanel from "../components/unanswered/FilterPanel";

export default function UnansweredQuestionsPage() {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] =
    useState<UnansweredQuestion | null>(null);
  const [filters, setFilters] = useState<QuestionFilters>({
    status: "all",
    priority: "all",
    assignedTo: "all",
    search: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/unanswered-questions?${queryParams}`);
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionUpdate = async (
    id: number,
    updates: Partial<UnansweredQuestion>
  ) => {
    try {
      await fetch(`/api/unanswered-questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchQuestions(); // Refresh the list
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Unanswered Questions Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Export Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={questions.length} />
        <StatCard
          title="Pending"
          value={questions.filter((q) => q.status === "PENDING").length}
        />
        <StatCard
          title="High Priority"
          value={questions.filter((q) => q.priority === "HIGH").length}
        />
        <StatCard
          title="Overdue"
          value={questions.filter((q) => isOverdue(q)).length}
        />
        <StatCard
          title="Resolved Today"
          value={questions.filter((q) => isResolvedToday(q)).length}
        />
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

      {/* Questions Table */}
      <QuestionTable
        questions={questions}
        loading={loading}
        onQuestionSelect={setSelectedQuestion}
        onQuestionUpdate={handleQuestionUpdate}
      />

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpdate={(updates) =>
            handleQuestionUpdate(selectedQuestion.id, updates)
          }
        />
      )}
    </div>
  );
}
```

#### 5.2.5 Enhanced MCP Server Integration

```python
# Enhanced FAQ MCP Server with analytics logging
from mcp.server.fastmcp import FastMCP
import asyncio
import json
from datetime import datetime
from analytics_logger import AnalyticsLogger

class EnhancedFAQMCPServer:
    def __init__(self):
        self.mcp = FastMCP("FAQ-Analytics-Server")
        self.analytics_logger = AnalyticsLogger()
        self.setup_tools()

    def setup_tools(self):
        @self.mcp.tool()
        async def answer_faq(query: str, session_id: str = None) -> dict:
            """Answer questions with comprehensive analytics logging"""
            start_time = datetime.now()

            try:
                # Process the query through existing FAQ logic
                result = await self.process_query(query)

                # Calculate processing time
                processing_time = (datetime.now() - start_time).total_seconds()

                # Log the interaction
                await self.analytics_logger.log_interaction({
                    'query_text': query,
                    'status': result['status'],
                    'source_file': result.get('source_file'),
                    'reasoning': result.get('reasoning'),
                    'processing_time': processing_time,
                    'session_id': session_id,
                    'timestamp': start_time
                })

                # If unanswered, add to unanswered questions tracking
                if result['status'] == 'no_answer':
                    await self.analytics_logger.log_unanswered_question({
                        'question': query,
                        'session_id': session_id,
                        'reasoning_trace': result.get('reasoning_trace', {}),
                        'timestamp': start_time
                    })

                return result

            except Exception as e:
                # Log error
                await self.analytics_logger.log_interaction({
                    'query_text': query,
                    'status': 'error',
                    'reasoning': str(e),
                    'processing_time': (datetime.now() - start_time).total_seconds(),
                    'session_id': session_id,
                    'timestamp': start_time
                })
                raise e

    async def process_query(self, query: str) -> dict:
        # Existing FAQ processing logic with enhanced reasoning trace
        pass
```

## 6. Dashboard Layout Specifications

### 6.1 Next.js Application Structure

```
src/
├── pages/
│   ├── dashboard/
│   │   ├── index.tsx          # Overview Dashboard
│   │   ├── analytics.tsx      # Query Analytics
│   │   ├── performance.tsx    # Performance Monitoring
│   │   ├── faq-stats.tsx      # FAQ Effectiveness
│   │   └── unanswered.tsx     # Unanswered Questions Management
│   ├── api/
│   │   ├── analytics/
│   │   ├── unanswered-questions/
│   │   └── auth/
│   └── _app.tsx
├── components/
│   ├── dashboard/
│   ├── charts/
│   ├── unanswered/
│   └── common/
├── hooks/
├── types/
├── utils/
└── styles/
```

### 6.2 Enhanced Overview Dashboard Layout

```
📊 Vitalynk FAQ Analytics Dashboard
├── 🔧 Navigation Sidebar
│   ├── Dashboard Overview
│   ├── Query Analytics
│   ├── Performance Monitoring
│   ├── FAQ Effectiveness
│   ├── 🆕 Unanswered Questions
│   └── User Management (Admin)
│
├── 📈 Enhanced KPI Cards Row
│   ├── Total Queries
│   ├── Success Rate
│   ├── Avg Response Time
│   ├── 🆕 Unanswered Count
│   └── 🆕 Content Gap Alert
│
├── 📊 Main Charts Section
│   ├── Query Volume Trend (full width)
│   ├── Success Rate Pie | Response Time Histogram
│   ├── 🆕 Unanswered Questions Trend
│   └── FAQ Usage Heatmap (full width)
│
└── 📋 Real-time Activity Feed
    ├── Recent Queries
    ├── 🆕 New Unanswered Questions
    └── System Alerts
```

### 6.3 Unanswered Questions Management Layout

```
❓ Unanswered Questions Management
├── 📊 Quick Stats Cards
│   ├── Total | Pending | High Priority | Overdue | Resolved
│
├── 🔧 Advanced Filter Panel
│   ├── Status Filter | Priority Filter | Assignee Filter
│   ├── Date Range | Category Filter | Search
│
├── 📋 Questions Management Table
│   ├── Bulk Selection & Actions
│   ├── Sortable Columns (Question, Priority, Frequency, Status, Assigned To, Age)
│   ├── Quick Actions (Assign, Priority, Status)
│   └── Row Click → Detail Modal
│
└── 📝 Question Detail Modal
    ├── Question Information & Metadata
    ├── Similar Questions & Frequency
    ├── Draft Answer Editor
    ├── Assignment & Status Management
    └── Resolution Notes & Timeline
```

## 7. Data Integration Requirements

### 7.1 Enhanced FAQ MCP Integration

- **Real-time Logging**: Seamless integration with enhanced FAQ MCP server
- **Comprehensive Analytics**: Capture all query interactions with detailed metadata
- **Unanswered Question Detection**: Automatic identification and logging of unanswered queries
- **Performance Monitoring**: Track response times, error rates, and system health

### 7.2 Database Integration Pipeline

```typescript
// Enhanced analytics logger for MCP integration
class AnalyticsLogger {
  private prisma: PrismaClient;

  async logInteraction(data: FaqInteractionData) {
    await this.prisma.faqInteraction.create({
      data: {
        queryText: data.query_text,
        status: data.status,
        sourceFile: data.source_file,
        reasoning: data.reasoning,
        processingTime: data.processing_time,
        sessionId: data.session_id,
        userAgent: data.user_agent,
        ipAddress: data.ip_address,
      },
    });

    // Update FAQ file statistics
    if (data.source_file) {
      await this.updateFaqFileStats(
        data.source_file,
        data.status === "success"
      );
    }
  }

  async logUnansweredQuestion(data: UnansweredQuestionData) {
    // Check for existing similar questions
    const similarQuestion = await this.findSimilarQuestion(data.question);

    if (similarQuestion) {
      // Increment frequency
      await this.prisma.unansweredQuestion.update({
        where: { id: similarQuestion.id },
        data: {
          frequency: { increment: 1 },
          lastAsked: new Date(),
        },
      });
    } else {
      // Create new unanswered question
      await this.prisma.unansweredQuestion.create({
        data: {
          question: data.question,
          frequency: 1,
          priority: await this.calculatePriority(data.question),
          category: await this.categorizeQuestion(data.question),
        },
      });
    }
  }
}
```

## 8. Performance Requirements

### 8.1 Frontend Performance

- **Initial Load Time**: < 2 seconds for dashboard pages
- **Chart Rendering**: < 1 second for visualization updates
- **Real-time Updates**: WebSocket connections with < 100ms latency
- **Data Processing**: Handle up to 10,000 records efficiently in browser

### 8.2 Backend Performance

- **API Response Time**: < 500ms for analytics endpoints
- **Database Queries**: Optimized with proper indexing, < 200ms average
- **Concurrent Users**: Support 50+ simultaneous dashboard users
- **Data Volume**: Handle 1 million+ FAQ interactions with pagination

### 8.3 Database Performance

- **Connection Pooling**: Efficient PostgreSQL connection management
- **Query Optimization**: Indexed queries for analytics aggregations
- **Real-time Updates**: Efficient triggers for live data updates
- **Backup & Recovery**: Automated daily backups with point-in-time recovery

## 9. Security and Access Control

### 9.1 Authentication & Authorization

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, Editor, Viewer roles with granular permissions
- **Session Management**: Secure session handling with automatic expiration
- **Password Security**: Bcrypt hashing with salt rounds

### 9.2 Data Security

- **API Security**: Rate limiting, CORS configuration, helmet.js security headers
- **Data Validation**: Input sanitization and validation on all endpoints
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Environment Security**: Secure environment variable management

### 9.3 Privacy Compliance

- **Query Anonymization**: Optional anonymization of sensitive query data
- **Data Retention**: Configurable data retention policies
- **Export Controls**: Role-based data export restrictions
- **Audit Logging**: Comprehensive audit trail for all user actions

## 10. Testing Strategy

### 10.1 Frontend Testing

- **Unit Testing**: React components with Jest and React Testing Library
- **Integration Testing**: API integration and data flow testing
- **E2E Testing**: Playwright for complete user workflow testing
- **Performance Testing**: Lighthouse and Web Vitals monitoring

### 10.2 Backend Testing

- **Unit Testing**: Service and utility function testing with Jest
- **API Testing**: Endpoint testing with Supertest
- **Database Testing**: Prisma integration testing with test database
- **Load Testing**: Artillery.js for concurrent user simulation

### 10.3 Full-Stack Integration Testing

- **End-to-End Workflows**: Complete user scenarios from login to task completion
- **Real-time Features**: WebSocket connection and live update testing
- **Authentication Flow**: Login, logout, and protected route testing
- **Data Consistency**: Cross-service data integrity validation

## 11. Deployment Requirements

### 11.1 Development Environment

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: faq_analytics_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/faq_analytics_dev
      JWT_SECRET: dev_jwt_secret
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 11.2 Production Deployment

- **Container Orchestration**: Docker Compose or Kubernetes
- **Database**: Managed PostgreSQL with SSL/TLS encryption
- **Load Balancing**: Nginx reverse proxy with SSL termination
- **Monitoring**: Application performance monitoring and logging
- **Backup Strategy**: Automated database backups and disaster recovery

## 12. Success Metrics

### 12.1 Technical Performance Metrics

- **System Availability**: >99.9% uptime
- **Response Time**: <500ms average API response time
- **Data Accuracy**: 100% data integrity across all components
- **User Concurrent Capacity**: Support 50+ simultaneous users

### 12.2 User Experience Metrics

- **User Adoption**: >90% of stakeholders using dashboard weekly
- **Task Completion Rate**: >95% successful completion of key workflows
- **User Satisfaction**: >4.5/5 rating from user feedback
- **Feature Utilization**: >70% usage of unanswered questions management features

### 12.3 Business Value Metrics

- **FAQ Answer Rate**: >85% of queries successfully answered
- **Content Gap Resolution**: <48 hours average resolution time for high-priority unanswered questions
- **Team Productivity**: 50% reduction in manual FAQ content management overhead
- **Customer Satisfaction**: Improved response quality through data-driven FAQ improvements

### 12.4 Unanswered Questions Management Metrics

- **Question Capture Rate**: 100% capture of unanswered queries
- **Resolution Efficiency**: <24 hours average resolution time for urgent questions
- **Content Improvement**: >20% increase in FAQ answer rate through gap analysis
- **Team Collaboration**: >80% of questions assigned and tracked through workflow

## 13. Risk Assessment and Mitigation

### 13.1 Technical Risks

- **Database Performance**: Risk of slow queries with large datasets
  - _Mitigation_: Proper indexing, query optimization, and pagination
- **Real-time Feature Reliability**: WebSocket connection stability
  - _Mitigation_: Connection retry logic and graceful degradation
- **Third-party Dependencies**: External library vulnerabilities
  - _Mitigation_: Regular dependency updates and security audits

### 13.2 Business Risks

- **User Adoption**: Low adoption of new analytics features
  - _Mitigation_: Comprehensive training and intuitive UX design
- **Data Privacy**: Exposure of sensitive user query data
  - _Mitigation_: Data anonymization options and privacy controls
- **System Complexity**: Overwhelming interface for non-technical users
  - _Mitigation_: Role-based UI customization and guided tours

## 14. Future Enhancements

### 14.1 Advanced Analytics (V3.0)

- **Machine Learning Insights**: Predictive analytics for query patterns and FAQ optimization
- **Natural Language Processing**: Advanced query categorization and similarity detection
- **Sentiment Analysis**: User satisfaction analysis from query context
- **Automated FAQ Generation**: AI-powered FAQ content generation from unanswered questions

### 14.2 Platform Enhancements

- **Multi-language Support**: Internationalization for global FAQ systems
- **Mobile Application**: Native mobile app for dashboard access
- **Advanced Reporting**: Custom report builder with scheduled exports
- **Integration APIs**: REST/GraphQL APIs for third-party integrations

### 14.3 Scalability Features

- **Microservices Architecture**: Service decomposition for better scalability
- **Multi-tenant Support**: Support multiple FAQ systems in single deployment
- **Cloud-native Features**: Auto-scaling, serverless functions, and cloud storage integration
- **Real-time Collaboration**: Multi-user real-time editing and commenting on unanswered questions

---

**Document Status**: Final v2.0  
**Next Review**: August 2, 2025  
**Approval Required**: Technical Lead, Product Manager, Security Team, UX/UI Team

    def render_performance_monitoring(self, filters: dict):
        """Render system performance page"""
        pass

    def render_faq_effectiveness(self, filters: dict):
        """Render FAQ content effectiveness page"""
        pass

````

#### 5.2.4 Time Filter Implementation

```python
from datetime import datetime, timedelta
import streamlit as st

class TimeFilterManager:
    def __init__(self):
        self.predefined_ranges = {
            "Last 24 Hours": timedelta(days=1),
            "Last 7 Days": timedelta(days=7),
            "Last 30 Days": timedelta(days=30),
            "Last 90 Days": timedelta(days=90),
            "Last Year": timedelta(days=365)
        }

    def render_time_filter(self) -> tuple:
        """Render time filter UI and return selected range"""
        filter_type = st.selectbox(
            "Select Time Range",
            ["Predefined Range", "Custom Range"]
        )

        if filter_type == "Predefined Range":
            selected_range = st.selectbox(
                "Choose Range",
                list(self.predefined_ranges.keys())
            )
            end_date = datetime.now()
            start_date = end_date - self.predefined_ranges[selected_range]
        else:
            col1, col2 = st.columns(2)
            with col1:
                start_date = st.date_input("Start Date")
            with col2:
                end_date = st.date_input("End Date")

        return start_date, end_date
````

## 6. Dashboard Layout Specifications

### 6.1 Overview Dashboard Layout

```
📊 FAQ Analytics Dashboard
├── 🔧 Sidebar Filters
│   ├── Time Range Selector
│   ├── FAQ Category Filter
│   └── Status Filter
│
├── 📈 KPI Cards Row
│   ├── Total Queries
│   ├── Success Rate
│   ├── Avg Response Time
│   └── Active FAQ Files
│
├── 📊 Main Charts Section
│   ├── Query Volume Trend (full width)
│   ├── Success Rate Pie | Response Time Histogram
│   └── FAQ Usage Heatmap (full width)
│
└── 📋 Recent Activity Table
```

### 6.2 Query Analytics Layout

```
🔍 Query Analytics
├── 📊 Query Patterns Section
│   ├── Query Categories Bar Chart
│   ├── Query Length Distribution
│   └── Word Cloud Visualization
│
├── 📈 Trend Analysis Section
│   ├── Query Volume by Hour/Day
│   ├── Success Rate Trends
│   └── Seasonal Pattern Analysis
│
└── 📋 Detailed Query Table
    └── Searchable, sortable query log
```

## 7. Data Integration Requirements

### 7.1 FAQ MCP Integration

- **Logging Hook**: Integrate with FAQ MCP to capture query data
- **Real-time Streaming**: Live data feed for real-time analytics
- **Data Validation**: Ensure data quality and consistency
- **Error Handling**: Graceful handling of missing or corrupted data

### 7.2 Data Pipeline

```python
# Integration with FAQ MCP Server
class AnalyticsLogger:
    def __init__(self, db_manager: AnalyticsDataManager):
        self.db_manager = db_manager

    async def log_query(self, query_data: dict):
        """Log query data to analytics database"""
        query_record = {
            'timestamp': datetime.now(),
            'query_text': query_data['query'],
            'status': query_data['status'],
            'source_file': query_data.get('source_file'),
            'reasoning': query_data.get('reasoning'),
            'processing_time': query_data['processing_time'],
            'session_id': query_data.get('session_id')
        }
        await self.db_manager.insert_query_record(query_record)
```

## 8. Performance Requirements

### 8.1 Dashboard Performance

- **Load Time**: < 3 seconds for initial page load
- **Chart Rendering**: < 2 seconds for visualization updates
- **Real-time Updates**: 30-second refresh intervals
- **Data Processing**: Handle up to 100,000 query records efficiently

### 8.2 Scalability

- **Concurrent Users**: Support 10+ simultaneous dashboard users
- **Data Volume**: Handle 1 million+ query records
- **Memory Usage**: < 1GB RAM for dashboard application
- **Database Performance**: Optimized queries with proper indexing

## 9. Security and Access Control

### 9.1 Authentication

- **Basic Authentication**: Username/password access
- **Session Management**: Secure session handling
- **Role-based Access**: Different access levels for different user types

### 9.2 Data Privacy

- **Query Anonymization**: Option to anonymize sensitive query data
- **Data Retention**: Configurable data retention policies
- **Export Controls**: Restrict data export based on user roles

## 10. Testing Strategy

### 10.1 Unit Testing

- Data processing functions
- Visualization component rendering
- Filter functionality
- Export mechanisms

### 10.2 Integration Testing

- Database connectivity
- Real-time data streaming
- FAQ MCP integration
- Multi-user concurrent access

### 10.3 User Experience Testing

- Dashboard responsiveness
- Filter performance
- Visual clarity and usability
- Export functionality

## 11. Deployment Requirements

### 11.1 Environment Setup

- **Python Environment**: 3.9+ with virtual environment
- **Database**: SQLite for development, PostgreSQL for production
- **Web Server**: Streamlit native server or containerized deployment
- **Monitoring**: Application performance monitoring

### 11.2 Configuration Management

```python
# config.py
import os
from dataclasses import dataclass

@dataclass
class DashboardConfig:
    database_url: str = os.getenv('DATABASE_URL', 'sqlite:///faq_analytics.db')
    refresh_interval: int = int(os.getenv('REFRESH_INTERVAL', '30'))
    max_records_display: int = int(os.getenv('MAX_RECORDS', '10000'))
    timezone: str = os.getenv('TIMEZONE', 'UTC')
    export_enabled: bool = os.getenv('EXPORT_ENABLED', 'true').lower() == 'true'
```

## 12. Success Metrics

### 12.1 Technical Metrics

- **Dashboard Availability**: >99% uptime
- **Response Time**: <3 seconds average
- **Data Accuracy**: 100% data integrity
- **User Adoption**: >80% of stakeholders using dashboard weekly

### 12.2 Business Value Metrics

- **Insights Generated**: Trackable improvements to FAQ system
- **Decision Speed**: Faster data-driven decisions
- **Issue Detection**: Early identification of system problems
- **Cost Efficiency**: Reduced manual reporting overhead

## 13. Future Enhancements

### 13.1 Advanced Analytics (V2.0)

- **Machine Learning Insights**: Predictive analytics for query patterns
- **Anomaly Detection**: Automated detection of unusual patterns
- **Natural Language Processing**: Advanced query categorization
- **A/B Testing Framework**: Compare FAQ content effectiveness

### 13.2 Enhanced Visualizations

- **3D Visualizations**: Advanced data exploration
- **Interactive Maps**: Geographic query distribution
- **Custom Dashboard Builder**: User-configurable dashboards
- **Mobile Responsive Design**: Optimized mobile experience

---

**Document Status**: Draft v1.0  
**Next Review**: July 26, 2025  
**Approval Required**: Technical Lead, Product Manager, Data Team Lead
