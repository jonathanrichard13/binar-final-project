import React, { useEffect, useState } from "react";
import { analyticsApi } from "../utils/api";
import { formatNumber, formatDate } from "../utils/helpers";
import { BarChart, DoughnutChart } from "../components/Charts";

interface FaqStatsData {
  totalFaqFiles: number;
  totalQuestions: number;
  mostAccessedFiles: Array<{
    filename: string;
    accessCount: number;
    lastAccessed: string;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  fileUsageStats: Array<{
    filename: string;
    queriesCount: number;
    avgResponseTime: number;
    successRate: number;
  }>;
}

const FaqStats: React.FC = () => {
  const [data, setData] = useState<FaqStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqStats = async () => {
      try {
        setLoading(true);

        // For now, we'll use mock data since the backend endpoint doesn't exist yet
        const faqCategories = [
          "account_management",
          "billing_payments",
          "customer_support",
          "file_management",
          "integrations_api",
          "mobile_app",
          "privacy_security",
          "subscription_plans",
          "team_collaboration",
          "technical_issues",
        ];

        const mockData: FaqStatsData = {
          totalFaqFiles: faqCategories.length,
          totalQuestions: 127,
          mostAccessedFiles: faqCategories
            .slice(0, 5)
            .map((category, index) => ({
              filename: `${category}.txt`,
              accessCount: 50 - index * 8,
              lastAccessed: new Date(
                Date.now() - index * 24 * 60 * 60 * 1000
              ).toISOString(),
            })),
          categoryDistribution: faqCategories.map((category, index) => ({
            category: category.replace("_", " ").toUpperCase(),
            count: 15 - index,
            percentage: ((15 - index) / 127) * 100,
          })),
          fileUsageStats: faqCategories.map((category, index) => ({
            filename: `${category}.txt`,
            queriesCount: 50 - index * 4,
            avgResponseTime: 200 + index * 20,
            successRate: 98 - index * 0.5,
          })),
        };

        setData(mockData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch FAQ stats:", err);
        setError("Failed to load FAQ statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqStats();
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

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-gray-700">No FAQ statistics available</div>
      </div>
    );
  }

  const categoryChartData = {
    labels: data.categoryDistribution.map((item) => item.category),
    datasets: [
      {
        label: "Questions",
        data: data.categoryDistribution.map((item) => item.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(6, 182, 212, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
      },
    ],
  };

  const accessChartData = {
    labels: data.mostAccessedFiles.map((item) =>
      item.filename.replace(".txt", "")
    ),
    datasets: [
      {
        label: "Access Count",
        data: data.mostAccessedFiles.map((item) => item.accessCount),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">FAQ Statistics</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total FAQ Files
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalFaqFiles}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Questions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Questions/File
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(data.totalQuestions / data.totalFaqFiles)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Questions by Category
          </h3>
          <div className="h-64">
            <BarChart data={categoryChartData} />
          </div>
        </div>

        {/* Most Accessed Files */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Most Accessed Files
          </h3>
          <div className="h-64">
            <BarChart data={accessChartData} />
          </div>
        </div>
      </div>

      {/* File Usage Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            File Usage Statistics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FAQ File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.fileUsageStats.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {file.filename.replace(".txt", "").replace("_", " ")}
                    </div>
                    <div className="text-sm text-gray-500">{file.filename}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(file.queriesCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.avgResponseTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.successRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        file.successRate > 95
                          ? "bg-green-100 text-green-800"
                          : file.successRate > 90
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {file.successRate > 95
                        ? "Excellent"
                        : file.successRate > 90
                        ? "Good"
                        : "Needs Attention"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Accessed Files Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent File Access
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Accessed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.mostAccessedFiles.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {file.filename.replace(".txt", "").replace("_", " ")}
                    </div>
                    <div className="text-sm text-gray-500">{file.filename}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(file.accessCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.lastAccessed)}
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

export default FaqStats;
