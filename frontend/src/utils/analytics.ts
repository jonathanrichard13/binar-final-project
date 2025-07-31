// Analytics utility functions for data processing and calculations

export interface QueryPattern {
  pattern: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface PerformanceMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  min: number;
}

// Calculate performance percentiles from response time data
export const calculatePercentiles = (
  responseTimes: number[]
): PerformanceMetrics => {
  if (responseTimes.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0, min: 0 };
  }

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const length = sorted.length;

  return {
    p50: sorted[Math.floor(length * 0.5)],
    p95: sorted[Math.floor(length * 0.95)],
    p99: sorted[Math.floor(length * 0.99)],
    avg: responseTimes.reduce((sum, time) => sum + time, 0) / length,
    max: Math.max(...responseTimes),
    min: Math.min(...responseTimes),
  };
};

// Extract keywords from query text
export const extractKeywords = (
  queries: string[]
): { keyword: string; frequency: number }[] => {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'can',
    'may',
    'might',
    'must',
    'how',
    'what',
    'where',
    'when',
    'why',
    'who',
    'which',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'me',
    'him',
    'her',
    'us',
    'them',
  ]);

  const wordCount = new Map<string, number>();

  queries.forEach((query) => {
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
  });

  return Array.from(wordCount.entries())
    .map(([keyword, frequency]) => ({ keyword, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
};

// Calculate query complexity score based on length and content
export const calculateQueryComplexity = (query: string): number => {
  const words = query.split(/\s+/).length;
  const hasQuestionWords = /\b(how|what|where|when|why|who|which)\b/i.test(
    query
  );
  const hasSpecialChars = /[?!]/.test(query);

  let complexity = Math.min(words / 5, 1); // Base complexity from length
  if (hasQuestionWords) complexity += 0.3;
  if (hasSpecialChars) complexity += 0.2;

  return Math.min(complexity, 1);
};

// Group data by time period
export const groupByTimePeriod = (
  data: Array<{ timestamp: string; value: number }>,
  period: 'hour' | 'day' | 'week' | 'month'
): TimeSeriesData[] => {
  const grouped = new Map<string, number>();

  data.forEach((item) => {
    const date = new Date(item.timestamp);
    let key: string;

    switch (period) {
      case 'hour':
        key = date.toISOString().substring(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        key = date.toISOString().substring(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10);
        break;
      case 'month':
        key = date.toISOString().substring(0, 7); // YYYY-MM
        break;
      default:
        key = date.toISOString().substring(0, 10);
    }

    grouped.set(key, (grouped.get(key) || 0) + item.value);
  });

  return Array.from(grouped.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

// Calculate success rate trends
export const calculateSuccessRateTrend = (
  data: Array<{ timestamp: string; success: boolean }>
): TimeSeriesData[] => {
  const grouped = groupByTimePeriod(
    data.map((item) => ({ timestamp: item.timestamp, value: 1 })),
    'day'
  );

  const successGrouped = groupByTimePeriod(
    data
      .filter((item) => item.success)
      .map((item) => ({ timestamp: item.timestamp, value: 1 })),
    'day'
  );

  return grouped.map((total) => {
    const success = successGrouped.find((s) => s.timestamp === total.timestamp);
    const successRate = success ? (success.value / total.value) * 100 : 0;
    return {
      timestamp: total.timestamp,
      value: successRate,
      label: `${successRate.toFixed(1)}%`,
    };
  });
};

// Identify content gaps based on unanswered queries
export const identifyContentGaps = (
  unansweredQueries: Array<{ query: string; count: number; keywords: string[] }>
): string[] => {
  const keywordFrequency = new Map<string, number>();

  unansweredQueries.forEach((item) => {
    item.keywords.forEach((keyword) => {
      keywordFrequency.set(
        keyword,
        (keywordFrequency.get(keyword) || 0) + item.count
      );
    });
  });

  const topKeywords = Array.from(keywordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);

  // Generate gap suggestions based on frequent keywords
  return topKeywords.map(
    (keyword) =>
      `Consider adding FAQ content about "${keyword}" - appears in ${keywordFrequency.get(
        keyword
      )} unanswered queries`
  );
};

// Calculate moving average for smoothing data
export const calculateMovingAverage = (
  data: number[],
  windowSize: number = 7
): number[] => {
  if (data.length < windowSize) return data;

  const result: number[] = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
    result.push(average);
  }

  return result;
};

// Generate color palette for charts
export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#22C55E', // green-500
    '#F97316', // orange
    '#6366F1', // indigo
    '#14B8A6', // teal
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Generate additional colors if needed
  const colors = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.508) % 360; // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }

  return colors;
};
