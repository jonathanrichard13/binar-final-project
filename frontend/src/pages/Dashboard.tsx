import React, { useEffect, useState } from "react";
import { analyticsApi } from "../utils/api";
import { formatNumber, formatPercentage } from "../utils/helpers";
import { LineChart, BarChart } from "../components/Charts";

interface OverviewStats {
  totalQueries: number;
  todayQueries: number;
  avgResponseTime: number;
  successRate: number;
  topFiles: Array<{
    filename: string;
    query_count: number;
  }>;
  hourlyTrend: Array<{
    hour: number;
    queries: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);

        // Fetch multiple data sources in parallel
        const [overviewResponse, queriesResponse] = await Promise.all([
          analyticsApi.getOverview({ timeRange: "24h" }),
          analyticsApi.getAnalytics({ timeRange: "24h", limit: 1000 }), // Get more queries for trend analysis
        ]);

        // Process the data
        const overview = overviewResponse.data;
        const queries = queriesResponse.data;

        // Process query timestamps to create hourly trend data
        const hourlyTrends: { [hour: number]: number } = {};

        // Initialize all hours (0-23) with 0 queries
        for (let i = 0; i < 24; i++) {
          hourlyTrends[i] = 0;
        }

        // Count queries by hour from actual timestamps
        if (queries.queries) {
          queries.queries.forEach((query: any) => {
            const hour = new Date(query.timestamp).getHours();
            hourlyTrends[hour] = (hourlyTrends[hour] || 0) + 1;
          });
        }

        // Convert to array format for chart
        const hourlyTrendArray = Object.entries(hourlyTrends).map(
          ([hour, count]) => ({
            hour: parseInt(hour),
            queries: count,
          })
        );

        const overviewStats: OverviewStats = {
          totalQueries: overview.totalQueries || 0,
          todayQueries: overview.totalQueries || 0,
          avgResponseTime: overview.averageResponseTime || 0,
          successRate: overview.successRate || 0,
          topFiles:
            overview.topFaqFiles?.map((file: any) => ({
              filename: file.source_file,
              query_count: parseInt(file.usage_count),
            })) || [],
          hourlyTrend: hourlyTrendArray,
        };

        setStats(overviewStats);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch overview data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchOverviewData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-gray-700">No data available</div>
      </div>
    );
  }

  // Chart data for hourly trends
  const chartData = {
    labels: stats.hourlyTrend.map((item) => {
      const hour = item.hour;
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      if (hour < 12) return `${hour} AM`;
      return `${hour - 12} PM`;
    }),
    datasets: [
      {
        label: "Queries per Hour",
        data: stats.hourlyTrend.map((item) => item.queries),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Chart data for top files
  const topFilesData = {
    labels: stats.topFiles.map((file) => file.filename.replace(".txt", "")),
    datasets: [
      {
        label: "Queries",
        data: stats.topFiles.map((file) => file.query_count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Queries</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.totalQueries)}
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Today's Queries
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.todayQueries)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgResponseTime.toFixed(1)}ms
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(stats.successRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Query Trends (Last 24 Hours)
          </h3>
          <LineChart data={chartData} height={300} />
        </div>

        {/* Top FAQ Files Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Most Queried FAQ Categories
          </h3>
          <BarChart data={topFilesData} height={300} />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Top FAQ Categories
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topFiles.map((file, index) => (
                <tr
                  key={file.filename}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {file.filename
                      .replace(".txt", "")
                      .replace("_", " ")
                      .toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(file.query_count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercentage(
                      (file.query_count / stats.totalQueries) * 100
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
