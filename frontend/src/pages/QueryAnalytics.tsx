import React, { useEffect, useState } from "react";
import { analyticsApi } from "../utils/api";
import { formatNumber, formatDate, formatDateTime } from "../utils/helpers";
import { LineChart, BarChart } from "../components/Charts";

interface QueryAnalytics {
  totalQueries: number;
  queryTrends: Array<{
    date: string;
    queries: number;
  }>;
  topQueries: Array<{
    query: string;
    count: number;
    avg_response_time: number;
  }>;
  categoryBreakdown: Array<{
    filename: string;
    query_count: number;
    percentage: number;
  }>;
  recentQueries: Array<{
    id: number;
    query: string;
    filename: string;
    response_time: number;
    created_at: string;
    success: boolean;
  }>;
}

const QueryAnalytics: React.FC = () => {
  const [data, setData] = useState<QueryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">(
    "week"
  );

  useEffect(() => {
    const fetchQueryAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch query data
        const response = await analyticsApi.getAnalytics({
          timeframe:
            timeframe === "today" ? "24h" : timeframe === "week" ? "7d" : "30d",
          page: 1,
          limit: 100,
        });

        const queryData = response.data;

        // Transform the backend data to match component expectations
        const transformedData: QueryAnalytics = {
          totalQueries: queryData.pagination?.total || 0,
          queryTrends: [], // We'll need to get this from overview endpoint
          topQueries: [], // Transform from queries array
          categoryBreakdown: [], // We'll need to analyze source_file field
          recentQueries:
            queryData.queries?.map((q: any) => ({
              id: Math.random(), // Backend doesn't provide id, use random
              query: q.query_text,
              filename: q.source_file || "unknown",
              response_time: q.processing_time || 0,
              created_at: q.timestamp,
              success: q.status === "success",
            })) || [],
        };

        setData(transformedData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch query analytics:", err);
        setError("Failed to load query analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchQueryAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-gray-700">No query analytics data available</div>
      </div>
    );
  }

  // Chart data for query trends
  const trendsChartData = {
    labels: data.queryTrends.map((item) =>
      new Date(item.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Daily Queries",
        data: data.queryTrends.map((item) => item.queries),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Chart data for category breakdown
  const categoryChartData = {
    labels: data.categoryBreakdown.map((cat) =>
      cat.filename.replace(".txt", "")
    ),
    datasets: [
      {
        label: "Queries by Category",
        data: data.categoryBreakdown.map((cat) => cat.query_count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Query Analytics</h1>

        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {(["today", "week", "month"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Queries</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.totalQueries)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.categoryBreakdown.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Daily Queries
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(
                  Math.round(
                    data.totalQueries / Math.max(data.queryTrends.length, 1)
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Query Trends Over Time
          </h3>
          <LineChart data={trendsChartData} height={300} />
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Queries by FAQ Category
          </h3>
          <BarChart data={categoryChartData} height={300} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Most Popular Queries
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topQueries.slice(0, 10).map((query, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {query.query}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(query.count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {query.avg_response_time.toFixed(1)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Queries */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Queries
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentQueries.slice(0, 10).map((query, index) => (
                  <tr
                    key={query.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {query.query}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {query.filename.replace(".txt", "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(query.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryAnalytics;
