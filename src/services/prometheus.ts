import axios, { AxiosError, AxiosInstance } from "axios";

import type {
  ActiveTarget,
  BuildInfo,
  Config,
  LabelSet,
  LabelsResult,
  PrometheusResponse,
  QueryRangeParams,
  QueryRangeResult,
  QueryResult,
  ServerStatus,
  Target,
  TargetsData,
} from "../types/index.js";

/**
 * Error messages for consistent user feedback
 */
export const ErrorMessages = {
  NO_CONFIG: `Error: No server configured.
Run 'prom config <url>' to configure your Prometheus server.`,

  INVALID_URL: `Error: Invalid URL format.
URL must start with http:// or https://
Example: prom config http://localhost:9090`,

  connectionFailed: (url: string, reason: string) => `Error: Could not connect to Prometheus server.
URL: ${url}
Reason: ${reason}

Troubleshooting:
  - Check if Prometheus is running
  - Verify the URL is correct
  - Check network connectivity`,

  AUTH_FAILED: `Error: Authentication failed (401 Unauthorized).
Hint: Check your username/password or token.
Run 'prom config --show' to view current settings.`,

  invalidPromQL: (message: string) =>
    `Error: Invalid PromQL expression.
Server response: ${message}`,
};

/**
 * Create axios instance with config
 */
export function createClient(config: Config): AxiosInstance {
  const client = axios.create({
    baseURL: config.serverUrl,
    timeout: config.timeout ?? 30000,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  // Add auth headers
  if (config.auth) {
    if (config.auth.type === "basic" && config.auth.username) {
      const credentials = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString(
        "base64",
      );
      client.defaults.headers.common["Authorization"] = `Basic ${credentials}`;
    } else if (config.auth.type === "bearer" && config.auth.token) {
      client.defaults.headers.common["Authorization"] = `Bearer ${config.auth.token}`;
    }
  }

  return client;
}

/**
 * Handle errors with user-friendly messages
 * Handles both AxiosError (network/API errors) and custom Error types (validation errors)
 */
export function handleError(error: unknown, serverUrl: string): never {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      console.error(ErrorMessages.AUTH_FAILED);
      process.exit(2);
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.error(ErrorMessages.connectionFailed(serverUrl, error.code || "Unknown"));
      process.exit(2);
    }

    if (error.response?.data?.error) {
      console.error(ErrorMessages.invalidPromQL(error.response.data.error));
      process.exit(1);
    }

    console.error(ErrorMessages.connectionFailed(serverUrl, error.message || "Unknown"));
    process.exit(2);
  }

  // Handle custom Error types (e.g., InvalidTimeExpressionError, InvalidTimeRangeError)
  // These errors already have user-friendly messages, so we just display them
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  // Unknown error type - re-throw to show stack trace for debugging
  throw error;
}

/**
 * Fetch scrape targets from Prometheus
 */
export async function getTargets(client: AxiosInstance): Promise<Target[]> {
  const response = await client.get<PrometheusResponse<TargetsData>>("/api/v1/targets");

  if (response.data.status !== "success" || !response.data.data) {
    return [];
  }

  return response.data.data.activeTargets.map(
    (target: ActiveTarget): Target => ({
      job: target.labels.job || "",
      instance: target.labels.instance || "",
      health: target.health,
      lastScrape: new Date(target.lastScrape),
      lastScrapeDuration: target.lastScrapeDuration,
      labels: target.labels,
    }),
  );
}

/**
 * Execute instant PromQL query
 */
export async function query(
  client: AxiosInstance,
  expr: string,
  time?: string,
): Promise<QueryResult> {
  const params = new URLSearchParams();
  params.append("query", expr);
  if (time) {
    params.append("time", time);
  }

  const response = await client.post<PrometheusResponse<QueryResult>>("/api/v1/query", params);

  if (response.data.status !== "success" || !response.data.data) {
    throw new Error(response.data.error || "Query failed");
  }

  return response.data.data;
}

/**
 * Execute range PromQL query
 */
export async function queryRange(
  client: AxiosInstance,
  params: QueryRangeParams,
): Promise<QueryRangeResult> {
  const urlParams = new URLSearchParams();
  urlParams.append("query", params.query);
  urlParams.append("start", params.start.toString());
  urlParams.append("end", params.end.toString());
  urlParams.append("step", params.step.toString());

  const response = await client.post<PrometheusResponse<QueryRangeResult>>(
    "/api/v1/query_range",
    urlParams,
  );

  if (response.data.status !== "success" || !response.data.data) {
    throw new Error(response.data.error || "Range query failed");
  }

  return response.data.data;
}

/**
 * Get server health, readiness, and build info
 */
export async function getStatus(client: AxiosInstance): Promise<ServerStatus> {
  const [healthRes, readyRes, buildRes] = await Promise.allSettled([
    client.get("/-/healthy"),
    client.get("/-/ready"),
    client.get<PrometheusResponse<BuildInfo>>("/api/v1/status/buildinfo"),
  ]);

  const healthy = healthRes.status === "fulfilled" && healthRes.value.status === 200;
  const ready = readyRes.status === "fulfilled" && readyRes.value.status === 200;

  let buildInfo: BuildInfo | undefined;
  if (buildRes.status === "fulfilled" && buildRes.value.data.status === "success") {
    buildInfo = buildRes.value.data.data;
  }

  return { healthy, ready, buildInfo };
}

/**
 * Format relative time (e.g., "2s ago", "5m ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

/**
 * Get all label names from Prometheus
 */
export async function getLabels(
  client: AxiosInstance,
  start?: number,
  end?: number,
): Promise<string[]> {
  const params: Record<string, string> = {};
  if (start !== undefined) {
    params.start = start.toString();
  }
  if (end !== undefined) {
    params.end = end.toString();
  }

  const response = await client.get<LabelsResult>("/api/v1/labels", { params });

  if (response.data.status !== "success" || !response.data.data) {
    throw new Error(response.data.error || "Failed to get labels");
  }

  return response.data.data;
}

/**
 * Get all values for a specific label from Prometheus
 */
export async function getLabelValues(
  client: AxiosInstance,
  labelName: string,
  start?: number,
  end?: number,
): Promise<string[]> {
  const params: Record<string, string> = {};
  if (start !== undefined) {
    params.start = start.toString();
  }
  if (end !== undefined) {
    params.end = end.toString();
  }

  const url = `/api/v1/label/${encodeURIComponent(labelName)}/values`;
  const response = await client.get<LabelsResult>(url, { params });

  if (response.data.status !== "success" || !response.data.data) {
    throw new Error(response.data.error || "Failed to get label values");
  }

  return response.data.data;
}

/**
 * Result from series API endpoint
 */
interface SeriesResult {
  status: "success" | "error";
  data?: LabelSet[];
  error?: string;
  errorType?: string;
}

/**
 * Get time series matching label selectors from Prometheus
 */
export async function getSeries(
  client: AxiosInstance,
  matchers: string[],
  start?: number,
  end?: number,
): Promise<LabelSet[]> {
  const params: Record<string, any> = {
    "match[]": matchers,
  };
  if (start !== undefined) {
    params.start = start.toString();
  }
  if (end !== undefined) {
    params.end = end.toString();
  }

  const response = await client.get<SeriesResult>("/api/v1/series", { params });

  if (response.data.status !== "success") {
    throw new Error(response.data.error || "Failed to get series");
  }

  return response.data.data || [];
}
