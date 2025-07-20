import { format, subHours, subDays, subMonths, subYears } from "date-fns";

export const formatTimeRange = (timeRange: string): string => {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "1h":
      startDate = subHours(now, 1);
      return `Last Hour`;
    case "24h":
      startDate = subHours(now, 24);
      return "Last 24 Hours";
    case "7d":
      startDate = subDays(now, 7);
      return "Last 7 Days";
    case "30d":
      startDate = subDays(now, 30);
      return "Last 30 Days";
    case "90d":
      startDate = subDays(now, 90);
      return "Last 90 Days";
    case "1y":
      startDate = subYears(now, 1);
      return "Last Year";
    default:
      return "Last 24 Hours";
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), "MMM dd, yyyy HH:mm");
};

export const formatDateShort = (date: string | Date): string => {
  return format(new Date(date), "MMM dd");
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "success":
      return "text-green-600 bg-green-50";
    case "no_answer":
      return "text-yellow-600 bg-yellow-50";
    case "error":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "no_answer":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getTimeRangeOptions = () => [
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "1y", label: "Last Year" },
];

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString();
};
