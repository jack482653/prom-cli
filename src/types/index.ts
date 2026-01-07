/**
 * Configuration for Prometheus server connection
 * Storage: ~/.prom-cli/config.json
 */
export interface Config {
  serverUrl: string;
  auth?: {
    type: "basic" | "bearer";
    username?: string;
    password?: string;
    token?: string;
  };
  timeout?: number;
}

/**
 * Prometheus scrape target
 * Source: /api/v1/targets endpoint
 */
export interface Target {
  job: string;
  instance: string;
  health: "up" | "down" | "unknown";
  lastScrape: Date;
  lastScrapeDuration: number;
  labels: Record<string, string>;
}

/**
 * Query result types
 * Source: /api/v1/query endpoint
 */
export interface QueryResult {
  resultType: "vector" | "scalar" | "string" | "matrix";
  result: VectorResult[] | ScalarResult | StringResult | MatrixResult[];
}

export interface VectorResult {
  metric: Record<string, string>;
  value: [number, string];
}

export interface ScalarResult {
  value: [number, string];
}

export interface StringResult {
  value: [number, string];
}

export interface MatrixResult {
  metric: Record<string, string>;
  values: [number, string][];
}

/**
 * Prometheus server health and build information
 * Source: /-/healthy, /-/ready, /api/v1/status/buildinfo
 */
export interface ServerStatus {
  healthy: boolean;
  ready: boolean;
  buildInfo?: BuildInfo;
}

export interface BuildInfo {
  version: string;
  revision: string;
  branch: string;
  buildUser: string;
  buildDate: string;
  goVersion: string;
}

/**
 * Prometheus API response wrapper
 */
export interface PrometheusResponse<T> {
  status: "success" | "error";
  data?: T;
  errorType?: string;
  error?: string;
}

/**
 * Targets API response data
 */
export interface TargetsData {
  activeTargets: ActiveTarget[];
  droppedTargets?: unknown[];
}

export interface ActiveTarget {
  labels: Record<string, string>;
  scrapePool: string;
  scrapeUrl: string;
  globalUrl: string;
  lastError: string;
  lastScrape: string;
  lastScrapeDuration: number;
  health: "up" | "down" | "unknown";
  scrapeInterval: string;
  scrapeTimeout: string;
}

/**
 * Parameters for range query API call
 * Source: /api/v1/query_range endpoint
 */
export interface QueryRangeParams {
  query: string; // PromQL expression
  start: number; // Start timestamp (Unix epoch seconds)
  end: number; // End timestamp (Unix epoch seconds)
  step: number; // Resolution step in seconds
}

/**
 * Result from range query (always matrix type)
 * Source: /api/v1/query_range endpoint
 */
export interface QueryRangeResult {
  resultType: "matrix";
  result: MatrixResult[];
}

/**
 * CLI options for query-range command
 */
export interface QueryRangeOptions {
  start: string; // Required: start time expression
  end: string; // Required: end time expression
  step?: number; // Optional: step in seconds
  json?: boolean; // Optional: JSON output flag
}

/**
 * Result of parsing a time expression
 */
export interface TimeParseResult {
  timestamp: number; // Unix epoch seconds
  isRelative: boolean; // Whether the input was a relative expression
}

/**
 * CLI options for labels command
 */
export interface LabelsOptions {
  json?: boolean; // Optional: JSON output flag
  start?: string; // Optional: start time expression
  end?: string; // Optional: end time expression
}

/**
 * Result from labels API endpoints
 * Source: /api/v1/labels and /api/v1/label/<name>/values
 */
export interface LabelsResult {
  status: "success" | "error";
  data: string[];
  error?: string;
  errorType?: string;
}
