# Data Model: prom-cli Core

**Feature Branch**: `001-prom-cli-core`
**Date**: 2024-12-31

## Entities

### Configuration

Stores user's Prometheus server connection settings.

```typescript
interface Config {
  serverUrl: string; // e.g., "http://localhost:9090"
  auth?: {
    type: "basic" | "bearer";
    username?: string; // For basic auth
    password?: string; // For basic auth
    token?: string; // For bearer token
  };
  timeout?: number; // Request timeout in ms (default: 30000)
}
```

**Storage**: `~/.prom-cli/config.json`

**Validation Rules**:

- `serverUrl` MUST be a valid HTTP/HTTPS URL
- `serverUrl` MUST NOT have trailing slash
- If `auth.type` is "basic", both `username` and `password` MUST be present
- If `auth.type` is "bearer", `token` MUST be present
- `timeout` MUST be positive integer if provided

### Target

Represents a Prometheus scrape target.

```typescript
interface Target {
  job: string; // Job name from Prometheus config
  instance: string; // Instance URL (e.g., "localhost:9090")
  health: "up" | "down" | "unknown";
  lastScrape: Date; // Last successful scrape timestamp
  lastScrapeDuration: number; // Duration in seconds
  labels: Record<string, string>; // All labels
}
```

**Source**: Prometheus `/api/v1/targets` endpoint

### QueryResult

Represents the result of a PromQL query.

```typescript
interface QueryResult {
  resultType: "vector" | "scalar" | "string" | "matrix";
  result: VectorResult[] | ScalarResult | StringResult | MatrixResult[];
}

interface VectorResult {
  metric: Record<string, string>; // Metric name and labels
  value: [number, string]; // [timestamp, value]
}

interface ScalarResult {
  value: [number, string]; // [timestamp, value]
}

interface StringResult {
  value: [number, string]; // [timestamp, string_value]
}

interface MatrixResult {
  metric: Record<string, string>;
  values: [number, string][]; // Array of [timestamp, value]
}
```

**Source**: Prometheus `/api/v1/query` endpoint

### ServerStatus

Represents Prometheus server health and build information.

```typescript
interface ServerStatus {
  healthy: boolean;
  ready: boolean;
  buildInfo?: {
    version: string;
    revision: string;
    branch: string;
    buildUser: string;
    buildDate: string;
    goVersion: string;
  };
}
```

**Source**:

- `/-/healthy` - Returns 200 if healthy
- `/-/ready` - Returns 200 if ready
- `/api/v1/status/buildinfo` - Returns build info JSON

## Entity Relationships

```
┌─────────────┐
│   Config    │
└──────┬──────┘
       │ uses
       ▼
┌─────────────────────────────────────┐
│        PrometheusService            │
├─────────────────────────────────────┤
│ + getTargets(): Target[]            │
│ + query(expr: string): QueryResult  │
│ + getStatus(): ServerStatus         │
└─────────────────────────────────────┘
       │
       │ returns
       ▼
┌──────────┐  ┌─────────────┐  ┌──────────────┐
│  Target  │  │ QueryResult │  │ ServerStatus │
└──────────┘  └─────────────┘  └──────────────┘
```

## State Transitions

### Configuration Lifecycle

```
[No Config] ---(config set)---> [Configured]
     │                              │
     │                              │ (config set with new values)
     │                              ▼
     │                         [Updated]
     │                              │
     └──────────────────────────────┘
```

### Target Health States

```
[unknown] ──┬──(scrape success)──> [up]
            │                        │
            │                        │ (scrape fails)
            │                        ▼
            └──(scrape fails)────> [down]
                                     │
                                     │ (scrape success)
                                     └────────> [up]
```

## Data Volume Assumptions

- Config file: < 1KB (single JSON object)
- Targets list: Typically 10-1000 targets (< 1MB response)
- Query results: Varies widely, streaming recommended for large results
- Status info: < 1KB (single JSON object)
