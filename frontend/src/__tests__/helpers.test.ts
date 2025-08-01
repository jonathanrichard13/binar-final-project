import { formatTimeRange } from '../utils/helpers';

describe('Helper Functions', () => {
  describe('formatTimeRange', () => {
    test('formats 1h time range correctly', () => {
      expect(formatTimeRange('1h')).toBe('Last Hour');
    });

    test('formats 24h time range correctly', () => {
      expect(formatTimeRange('24h')).toBe('Last 24 Hours');
    });

    test('formats 7d time range correctly', () => {
      expect(formatTimeRange('7d')).toBe('Last 7 Days');
    });

    test('formats 30d time range correctly', () => {
      expect(formatTimeRange('30d')).toBe('Last 30 Days');
    });

    test('formats 1y time range correctly', () => {
      expect(formatTimeRange('1y')).toBe('Last Year');
    });

    test('handles unknown time range', () => {
      expect(formatTimeRange('unknown')).toBe('Last 24 Hours');
    });
  });
});
