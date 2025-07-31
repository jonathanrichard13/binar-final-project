import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../utils/api';
import { formatNumber, formatDate } from '../utils/helpers';

interface PerformanceData {
  averageResponseTime: number;
  responseTimeHistory: Array<{
    date: string;
    responseTime: number;
  }>;
  errorRate: number;
  uptime: number;
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    status: string;
  };
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

interface SystemHealthData {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  status: string;
}

const Performance: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get system health from device
  const getSystemHealth = async (): Promise<SystemHealthData> => {
    try {
      // Get system info using Navigator API when available
      const performanceInfo = performance as any;
      const connection = (navigator as any).connection;

      // Estimate system metrics (these are approximations since direct system access is limited in browsers)
      const cpuUsage = Math.min(
        100,
        Math.max(
          0,
          performanceInfo.memory
            ? (performanceInfo.memory.usedJSHeapSize /
                performanceInfo.memory.jsHeapSizeLimit) *
                100
            : 30 + Math.random() * 40
        )
      );

      const memoryUsage = performanceInfo.memory
        ? (performanceInfo.memory.usedJSHeapSize /
            performanceInfo.memory.totalJSHeapSize) *
          100
        : 50 + Math.random() * 30;

      const uptime = performance.now() / (1000 * 60 * 60 * 24); // Days since page load

      // Network connection quality as a proxy for system health
      const networkQuality = connection
        ? ((connection.downlink || 10) / 10) * 100
        : 80;

      const diskUsage = Math.min(100, 20 + Math.random() * 50); // Simulated disk usage

      const overallHealth =
        (100 - cpuUsage) * 0.3 +
        (100 - memoryUsage) * 0.3 +
        (100 - diskUsage) * 0.2 +
        Math.min(networkQuality, 100) * 0.2;

      let status = 'Good';
      if (overallHealth < 50) status = 'Critical';
      else if (overallHealth < 70) status = 'Warning';
      else if (overallHealth < 85) status = 'Fair';

      return {
        cpu: Math.round(cpuUsage),
        memory: Math.round(memoryUsage),
        disk: Math.round(diskUsage),
        uptime: Math.round(uptime * 100) / 100,
        status,
      };
    } catch (error) {
      console.warn('Could not get system health:', error);
      return {
        cpu: 45,
        memory: 60,
        disk: 30,
        uptime: 99.5,
        status: 'Unknown',
      };
    }
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);

        // Fetch data from backend API
        const [performanceResponse, backendSystemHealth, clientSystemHealth] =
          await Promise.all([
            analyticsApi.getPerformance(),
            analyticsApi.getSystemHealth(),
            getSystemHealth(),
          ]);

        const backendData = performanceResponse.data;
        const serverHealth = backendSystemHealth.data;

        // Calculate average response time from percentiles
        const avgResponseTime = backendData.responseTimePercentiles?.p50
          ? Math.round(backendData.responseTimePercentiles.p50 * 1000)
          : 0;

        // Process error rate trends
        const errorRate =
          backendData.errorRateTrends?.length > 0
            ? backendData.errorRateTrends.reduce((acc, trend) => {
                const total = parseInt(trend.total) || 0;
                const errors = parseInt(trend.errors) || 0;
                return acc + (total > 0 ? (errors / total) * 100 : 0);
              }, 0) / backendData.errorRateTrends.length
            : 0;

        // Process response time history from system metrics
        const responseTimeHistory =
          backendData.systemMetrics
            ?.filter((metric: any) => metric.metric_name === 'response_time')
            ?.slice(0, 24)
            ?.reverse()
            ?.map((metric: any) => ({
              date: metric.timestamp,
              responseTime: parseFloat(metric.metric_value) || 0,
            })) || [];

        const transformedData: PerformanceData = {
          averageResponseTime: avgResponseTime,
          responseTimeHistory,
          errorRate: Math.round(errorRate * 100) / 100,
          uptime: 100 - errorRate, // Estimate uptime from error rate
          systemHealth: {
            cpu: serverHealth.cpu, // Use server CPU
            memory: clientSystemHealth.memory, // Use client memory for browser context
            disk: serverHealth.disk, // Use server disk
            status: serverHealth.status, // Use server status
          },
          responseTimePercentiles: {
            p50: Math.round(
              (backendData.responseTimePercentiles?.p50 || 0) * 1000
            ),
            p95: Math.round(
              (backendData.responseTimePercentiles?.p95 || 0) * 1000
            ),
            p99: Math.round(
              (backendData.responseTimePercentiles?.p99 || 0) * 1000
            ),
          },
        };

        setData(transformedData);
        setSystemHealth({
          ...clientSystemHealth,
          cpu: serverHealth.cpu, // Merge server CPU data
          status: serverHealth.status,
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();

    // Refresh system health every 30 seconds
    const healthInterval = setInterval(async () => {
      try {
        const [serverHealth, clientHealth] = await Promise.all([
          analyticsApi.getSystemHealth(),
          getSystemHealth(),
        ]);

        const combinedHealth = {
          ...clientHealth,
          cpu: serverHealth.data.cpu, // Use server CPU
          status: serverHealth.data.status, // Use server status
        };

        setSystemHealth(combinedHealth);

        // Update system health in current data
        setData((prev) =>
          prev
            ? {
                ...prev,
                systemHealth: {
                  cpu: serverHealth.data.cpu,
                  memory: clientHealth.memory,
                  disk: serverHealth.data.disk,
                  status: serverHealth.data.status,
                },
              }
            : null
        );
      } catch (error) {
        console.warn('Failed to refresh system health:', error);
      }
    }, 30000);

    return () => clearInterval(healthInterval);
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
        <div className="text-gray-700">No performance data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Performance Analytics
        </h1>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Response Time (P50)
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.responseTimePercentiles.p50}ms
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                95th Percentile
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.responseTimePercentiles.p95}ms
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Error Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.errorRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  data.systemHealth.status === 'Good'
                    ? 'bg-green-100'
                    : data.systemHealth.status === 'Fair'
                      ? 'bg-yellow-100'
                      : data.systemHealth.status === 'Warning'
                        ? 'bg-orange-100'
                        : 'bg-red-100'
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    data.systemHealth.status === 'Good'
                      ? 'text-green-600'
                      : data.systemHealth.status === 'Fair'
                        ? 'text-yellow-600'
                        : data.systemHealth.status === 'Warning'
                          ? 'text-orange-600'
                          : 'text-red-600'
                  }`}
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Health</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.systemHealth.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Response Time Percentiles
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                50th percentile (median)
              </span>
              <span className="text-sm font-medium text-gray-900">
                {data.responseTimePercentiles.p50}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">95th percentile</span>
              <span className="text-sm font-medium text-gray-900">
                {data.responseTimePercentiles.p95}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">99th percentile</span>
              <span className="text-sm font-medium text-gray-900">
                {data.responseTimePercentiles.p99}ms
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">
                {data.uptime.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data.errorRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Health Status</span>
              <span
                className={`text-sm font-medium ${
                  data.systemHealth.status === 'Good'
                    ? 'text-green-600'
                    : data.systemHealth.status === 'Fair'
                      ? 'text-yellow-600'
                      : data.systemHealth.status === 'Warning'
                        ? 'text-orange-600'
                        : 'text-red-600'
                }`}
              >
                {data.systemHealth.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Real-time Metrics
          </h3>
          <div className="space-y-3">
            {systemHealth && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Browser Memory</span>
                  <span className="text-sm font-medium text-gray-900">
                    {systemHealth.memory}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CPU Load</span>
                  <span className="text-sm font-medium text-gray-900">
                    {systemHealth.cpu}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Session Uptime</span>
                  <span className="text-sm font-medium text-gray-900">
                    {systemHealth.uptime}h
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          System Health
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                CPU Usage
              </span>
              <span className="text-sm text-gray-500">
                {data.systemHealth.cpu}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${data.systemHealth.cpu}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Memory Usage
              </span>
              <span className="text-sm text-gray-500">
                {data.systemHealth.memory}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${data.systemHealth.memory}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Disk Usage
              </span>
              <span className="text-sm text-gray-500">
                {data.systemHealth.disk}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${data.systemHealth.disk}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
