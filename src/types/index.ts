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
