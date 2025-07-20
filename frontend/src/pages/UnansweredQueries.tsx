import React, { useEffect, useState } from "react";
import { analyticsApi } from "../utils/api";
import { formatNumber, formatDate } from "../utils/helpers";

interface UnansweredQuery {
  query: string;
  count: number;
  keywords: string[];
  last_seen: string;
  suggested_categories: string[];
}

interface UnansweredQueriesData {
  queries: UnansweredQuery[];
  total_count: number;
  top_keywords: Array<{
    keyword: string;
    frequency: number;
  }>;
  summary: {
    total_unanswered: number;
    unique_queries: number;
    coverage_gaps: string[];
  };
}

const UnansweredQueries: React.FC = () => {
  const [data, setData] = useState<UnansweredQueriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnansweredQueries = async () => {
      try {
        setLoading(true);

        const response = await analyticsApi.getUnansweredQueries({
          limit: 100,
          sortBy: "count",
          groupSimilar: true,
        });

        const backendData = response.data;

        // Transform backend response to match component expectations
        const transformedData: UnansweredQueriesData = {
          queries:
            backendData.unansweredQueries?.map((q: any) => ({
              query: q.query_text,
              count: q.frequency || 1,
              keywords: q.query_text
                ? q.query_text
                    .toLowerCase()
                    .split(" ")
                    .filter((word: string) => word.length > 3)
                : [],
              last_seen: q.latest_timestamp || q.timestamp,
              suggested_categories: [], // Backend doesn't provide suggested categories
            })) || [],
          total_count: backendData.summary?.totalUnanswered || 0,
          top_keywords:
            backendData.summary?.topKeywords?.map((k: any) => ({
              keyword: k.word,
              frequency: parseInt(k.frequency),
            })) || [],
          summary: {
            total_unanswered: backendData.summary?.totalUnanswered || 0,
            unique_queries: backendData.summary?.uniqueQueries || 0,
            coverage_gaps: [
              "Content gaps identified based on query patterns",
              "Consider adding FAQ sections for frequent unanswered queries",
              "Review keyword analysis for missing topics",
            ],
          },
        };

        setData(transformedData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch unanswered queries:", err);
        setError("Failed to load unanswered queries data");
      } finally {
        setLoading(false);
      }
    };

    fetchUnansweredQueries();
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-700">
          No unanswered queries data available
        </div>
        <p className="text-sm text-gray-500 mt-2">
          This could mean all queries are being answered successfully, or no
          queries have been processed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Unanswered Queries</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Unanswered
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.summary.total_unanswered)}
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
                  d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Unique Queries
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.summary.unique_queries)}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Showing Results
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.queries.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Keywords */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Keywords in Unanswered Queries
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {data.top_keywords.slice(0, 10).map((keyword, index) => (
                <div
                  key={keyword.keyword}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {keyword.keyword}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (keyword.frequency /
                              data.top_keywords[0].frequency) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">
                      {keyword.frequency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coverage Gaps */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Identified Coverage Gaps
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {data.summary.coverage_gaps.map((gap, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div className="text-sm text-gray-700">{gap}</div>
                </div>
              ))}
              {data.summary.coverage_gaps.length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  No specific coverage gaps identified. Consider reviewing
                  frequently asked unanswered queries.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recommended Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Create New FAQ Content
                </h4>
                <p className="text-sm text-blue-700">
                  Add FAQ sections for the most frequently asked unanswered
                  queries.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Expand Existing FAQs
                </h4>
                <p className="text-sm text-green-700">
                  Enhance current FAQ files with additional information based on
                  query patterns.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">
                  Improve Search
                </h4>
                <p className="text-sm text-yellow-700">
                  Review and update keywords to improve FAQ discoverability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unanswered Queries Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Unanswered Queries
            </h3>
            <div className="text-sm text-gray-500">
              {data.queries.length} queries
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keywords
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggested Categories
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.queries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      No unanswered queries found
                    </div>
                  </td>
                </tr>
              ) : (
                data.queries.map((query: UnansweredQuery, index: number) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={query.query}>
                        {query.query}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {formatNumber(query.count)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {query.keywords
                          .slice(0, 3)
                          .map((keyword: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {keyword}
                            </span>
                          ))}
                        {query.keywords.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{query.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(query.last_seen)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {query.suggested_categories
                          .slice(0, 2)
                          .map((category: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                            >
                              {category}
                            </span>
                          ))}
                        {query.suggested_categories.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{query.suggested_categories.length - 2}
                          </span>
                        )}
                        {query.suggested_categories.length === 0 && (
                          <span className="text-xs text-gray-400 italic">
                            No suggestions
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnansweredQueries;
