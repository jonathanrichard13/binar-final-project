import api from "./api";

export interface AnalyticsOverview {
  totalQueries: number;
  successRate: number;
  averageResponseTime: number;
  queryTrends: Array<{
    hour: string;
    count: number;
  }>;
  topFaqFiles: Array<{
    source_file: string;
    usage_count: number;
  }>;
}

export interface QueryInteraction {
  id: number;
  timestamp: string;
  query_text: string;
  status: "success" | "no_answer" | "error";
  source_file?: string;
  reasoning?: string;
  processing_time?: number;
  session_id?: string;
  user_feedback?: number;
}

export interface QueryAnalytics {
  queries: QueryInteraction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
}

export interface PerformanceMetrics {
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRateTrends: Array<{
    hour: string;
    total: number;
    errors: number;
  }>;
  systemMetrics: Array<{
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    timestamp: string;
  }>;
}

export interface FaqStats {
  faqEffectiveness: Array<{
    source_file: string;
    total_queries: number;
    successful_queries: number;
    success_rate: number;
    avg_response_time: number;
  }>;
  underutilizedFaqs: Array<{
    source_file: string;
    usage_count: number;
  }>;
}

export interface UnansweredQueries {
  unansweredQueries: Array<{
    id: number;
    query_text: string;
    frequency?: number;
    timestamp?: string;
    latest_timestamp?: string;
    session_id?: string;
    processing_time?: number;
  }>;
  summary: {
    totalUnanswered: number;
    uniqueQueries: number;
    topKeywords: Array<{
      word: string;
      frequency: number;
    }>;
    timeDistribution: Array<{
      date: string;
      unanswered_count: number;
    }>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  groupSimilar: boolean;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    latency: number;
  };
  metrics: {
    errorRate: number;
    averageResponseTime: number;
    totalQueriesLastHour: number;
  };
}

export const analyticsService = {
  // Get analytics overview
  async getOverview(timeRange: string = "24h"): Promise<AnalyticsOverview> {
    const response = await api.get(
      `/api/analytics/overview?timeRange=${timeRange}`
    );
    return response.data;
  },

  // Get query analytics
  async getQueries(
    timeRange: string = "24h",
    page: number = 1,
    limit: number = 50
  ): Promise<QueryAnalytics> {
    const response = await api.get(
      `/api/analytics/queries?timeRange=${timeRange}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get performance metrics
  async getPerformance(timeRange: string = "24h"): Promise<PerformanceMetrics> {
    const response = await api.get(
      `/api/analytics/performance?timeRange=${timeRange}`
    );
    return response.data;
  },

  // Get FAQ effectiveness stats
  async getFaqStats(timeRange: string = "24h"): Promise<FaqStats> {
    const response = await api.get(
      `/api/analytics/faq-stats?timeRange=${timeRange}`
    );
    return response.data;
  },

  // Get unanswered queries
  async getUnansweredQueries(
    timeRange: string = "7d",
    page: number = 1,
    limit: number = 50,
    groupSimilar: boolean = false
  ): Promise<UnansweredQueries> {
    const response = await api.get(
      `/api/analytics/unanswered?timeRange=${timeRange}&page=${page}&limit=${limit}&groupSimilar=${groupSimilar}`
    );
    return response.data;
  },

  // Get system health
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get("/api/system/health");
    return response.data;
  },

  // Export data
  async exportData(
    format: string = "json",
    timeRange: string = "24h",
    dataType: string = "all"
  ): Promise<Blob> {
    const response = await api.get(
      `/api/export/data?format=${format}&timeRange=${timeRange}&dataType=${dataType}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};
