# Data Model: Series Command

**Feature Branch**: `005-series`
**Date**: 2025-01-09

## Overview

This document defines the data structures for the series command. All types are TypeScript interfaces representing data passed between layers.

## Core Entities

### SeriesOptions

**Purpose**: Command-line options for the series command

**Attributes**:

| Name    | Type    | Required | Validation                                       |
| ------- | ------- | -------- | ------------------------------------------------ |
| `json`  | boolean | No       | Flag for JSON output format                      |
| `start` | string  | No       | Time expression (RFC3339 or relative like "1h")  |
| `end`   | string  | No       | Time expression (RFC3339 or relative like "now") |

**TypeScript Definition**:

```typescript
export interface SeriesOptions {
  json?: boolean;
  start?: string;
  end?: string;
}
```

**Validation Rules**:

- If `start` is provided, it must be a valid time expression (validated by time-parser)
- If `end` is provided, it must be a valid time expression (validated by time-parser)
- If both `start` and `end` are provided, `start` must be before `end`

**Relationships**: Used by `seriesCommand()` in `src/commands/series.ts`

---

### LabelSet

**Purpose**: Represents a single time series as a set of label key-value pairs

**Attributes**: Dynamic - any string key-value pairs

**TypeScript Definition**:

```typescript
export type LabelSet = Record<string, string>;
```

**Example**:

```typescript
const series: LabelSet = {
  __name__: "up",
  job: "prometheus",
  instance: "localhost:9090",
};
```

**Validation Rules**:

- Must be a valid JSON object
- All keys and values must be strings
- Typically includes `__name__` key for the metric name
- Keys and values follow Prometheus label naming rules (but validation handled by server)

**Relationships**: Returned by `getSeries()` in `src/services/prometheus.ts`

---

### SeriesResult (Prometheus API Response)

**Purpose**: Raw response structure from Prometheus `/api/v1/series` endpoint

**Attributes**:

| Name        | Type       | Required | Description                               |
| ----------- | ---------- | -------- | ----------------------------------------- |
| `status`    | string     | Yes      | "success" or "error"                      |
| `data`      | LabelSet[] | Yes      | Array of label sets (when status=success) |
| `error`     | string     | No       | Error message (when status=error)         |
| `errorType` | string     | No       | Error type code (when status=error)       |

**TypeScript Definition**:

```typescript
interface SeriesResult {
  status: "success" | "error";
  data?: LabelSet[];
  error?: string;
  errorType?: string;
}
```

**Example (success)**:

```json
{
  "status": "success",
  "data": [
    { "__name__": "up", "job": "prometheus", "instance": "localhost:9090" },
    { "__name__": "up", "job": "node", "instance": "localhost:9100" }
  ]
}
```

**Example (error)**:

```json
{
  "status": "error",
  "errorType": "bad_data",
  "error": "parse error at char 1: unexpected character: '&'"
}
```

**Validation Rules**:

- `status` must be "success" or "error"
- If `status` is "success", `data` must be present
- If `status` is "error", `error` message should be present
- `data` array can be empty (no matching series)

**Relationships**: Internal type used by `getSeries()` to parse API response

---

### TimeRange (Internal)

**Purpose**: Parsed time range with Unix timestamps for API calls

**Attributes**:

| Name    | Type   | Required | Description               |
| ------- | ------ | -------- | ------------------------- |
| `start` | number | No       | Unix timestamp in seconds |
| `end`   | number | No       | Unix timestamp in seconds |

**TypeScript Definition**:

```typescript
interface TimeRange {
  start?: number;
  end?: number;
}
```

**Validation Rules**:

- Timestamps must be positive integers
- If both present, `start` must be less than `end`

**Relationships**: Returned by `parseTimeRange()` helper in `src/commands/series.ts`, passed to `getSeries()`

---

## Data Flow

```
User Input (CLI)
  ↓
SeriesOptions + matchers: string[]
  ↓
parseTimeRange() → TimeRange
  ↓
getSeries(client, matchers, start?, end?)
  ↓
Prometheus API → SeriesResult
  ↓
Extract LabelSet[]
  ↓
formatOutput() → console output
```

## State Transitions

No state transitions - this is a read-only query operation with no persistent state.

## Error States

| Error Type                 | Trigger             | Handler         | User Message                                              |
| -------------------------- | ------------------- | --------------- | --------------------------------------------------------- |
| InvalidTimeExpressionError | Invalid time format | seriesCommand() | "Invalid start/end time. Use RFC3339 or relative format." |
| InvalidTimeRangeError      | start > end         | seriesCommand() | "Start time must be before end time."                     |
| AxiosError (4xx)           | Client error        | getSeries()     | "Error from Prometheus: {error message}"                  |
| AxiosError (5xx)           | Server error        | getSeries()     | "Prometheus server error: {error message}"                |
| AxiosError (network)       | Connection failed   | getSeries()     | "Failed to connect to {url}. Check connectivity."         |

## Existing Types to Reuse

From `src/types/index.ts`:

```typescript
// Already defined - no changes needed
export interface Config {
  url: string;
  auth?: {
    type: "basic" | "bearer";
    username?: string;
    password?: string;
    token?: string;
  };
}
```

From `src/services/time-parser.ts`:

```typescript
// Already defined - no changes needed
export interface TimeExpression {
  timestamp: number;
  original: string;
}
```

## New Types to Add

Add to `src/types/index.ts`:

```typescript
// Series command types
export interface SeriesOptions {
  json?: boolean;
  start?: string;
  end?: string;
}

export type LabelSet = Record<string, string>;
```

**Note**: `SeriesResult` and `TimeRange` are internal types and do not need to be exported to `src/types/index.ts`.
