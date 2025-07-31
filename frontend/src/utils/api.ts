import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Type definitions
export interface AnalyticsParams {
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d' | '1y';
  page?: number;
  limit?: number;
  offset?: number;
}

export interface UnansweredParams {
  limit?: number;
  sortBy?: 'count' | 'recent';
  keyword?: string;
  groupSimilar?: boolean;
}

export interface AnalyticsResponse {
  data: {
    // For /analytics/overview
    totalQueries?: number;
    successRate?: number;
    averageResponseTime?: number;
    queryTrends?: Array<{
      hour: string;
      count: string;
    }>;
    topFaqFiles?: Array<{
      source_file: string;
      usage_count: string;
    }>;

    // For /analytics/queries
    queries?: Array<{
      query_text: string;
      status: string;
      source_file: string;
      processing_time: number;
      timestamp: string;
      user_feedback: number;
    }>;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    statusDistribution?: Array<{
      status: string;
      count: string;
    }>;
  };
}

export interface UnansweredResponse {
  unansweredQueries: Array<{
    id?: number;
    query_text: string;
    frequency?: number;
    latest_timestamp?: string;
    timestamp?: string;
    first_timestamp?: string;
    avg_processing_time?: number;
    session_ids?: string[];
  }>;
  summary: {
    totalUnanswered: number;
    uniqueQueries: number;
    topKeywords: Array<{
      word: string;
      frequency: string;
    }>;
    timeDistribution: Array<{
      date: string;
      unanswered_count: string;
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

export interface PerformanceResponse {
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRateTrends: Array<{
    hour: string;
    total: string;
    errors: string;
  }>;
  systemMetrics: Array<{
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    timestamp: string;
  }>;
}

// Analytics API endpoints
export const analyticsApi = {
  // Get overview analytics data
  getOverview: (params?: AnalyticsParams) =>
    api.get<AnalyticsResponse>('/analytics/overview', { params }),

  // Get detailed analytics data with optional filters
  getAnalytics: (params?: AnalyticsParams) =>
    api.get<AnalyticsResponse>('/analytics/queries', { params }),

  // Get performance metrics
  getPerformance: (params?: AnalyticsParams) =>
    api.get<PerformanceResponse>('/analytics/performance', { params }),

  // Get FAQ statistics
  getFaqStats: (params?: AnalyticsParams) =>
    api.get<AnalyticsResponse>('/analytics/faq-stats', { params }),

  // Get unanswered queries analysis
  getUnansweredQueries: (params?: UnansweredParams) =>
    api.get<UnansweredResponse>('/analytics/unanswered', { params }),

  // Get hourly query counts for a specific date
  getHourlyQueries: (date: string) =>
    api.get<{
      data: {
        date: string;
        totalQueries: number;
        hourlyData: Array<{
          hour: number;
          count: number;
          percentage: number;
        }>;
      };
    }>('/analytics/hourly-queries', { params: { date } }),

  // Get daily query counts for a time range
  getDailyQueries: (days: number = 7) =>
    api.get<{
      totalQueries: number;
      dailyData: Array<{
        date: string;
        count: number;
        percentage: number;
      }>;
    }>('/analytics/daily-queries', { params: { days } }),

  // Export analytics data
  exportData: (format: 'csv' | 'json' = 'csv', params?: AnalyticsParams) =>
    api.post<Blob>(
      '/export/data',
      { format, ...params },
      {
        responseType: 'blob',
      }
    ),

  // Get system health metrics
  getSystemHealth: () =>
    api.get<{
      cpu: number;
      memory: number;
      disk: number;
      processMemory: number;
      uptime: {
        system: number;
        process: number;
      };
      status: string;
      healthScore: number;
      timestamp: string;
      details: {
        totalMemory: number;
        freeMemory: number;
        usedMemory: number;
        cpuCount: number;
        loadAverage: number[];
        platform: string;
        arch: string;
        nodeVersion: string;
      };
    }>('/analytics/system-health'),
};

// System API endpoints
export const systemApi = {
  // Get system health metrics
  getHealth: () => api.get('/system/health'),

  // Get system metrics
  getMetrics: (params?: { timeframe?: string }) =>
    api.get('/system/metrics', { params }),
};

export default api;
