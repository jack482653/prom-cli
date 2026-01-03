# Data Model: Query Range Command

**Date**: 2025-01-03
**Feature**: 003-query-range

## New Types

### QueryRangeParams

Parameters for the range query API call.

```typescript
interface QueryRangeParams {
  query: string; // PromQL expression
  start: number; // Start timestamp (Unix epoch seconds)
  end: number; // End timestamp (Unix epoch seconds)
  step: number; // Resolution step in seconds
}
```

**Validation Rules**:

- `query`: Non-empty string
- `start`: Positive number, must be < end
- `end`: Positive number, must be > start
- `step`: Positive integer ≥ 1

### QueryRangeResult

Response from `/api/v1/query_range` endpoint.

```typescript
interface QueryRangeResult {
  resultType: "matrix";
  result: MatrixResult[];
}
```

**Note**: `MatrixResult` already exists in `types/index.ts`:

```typescript
interface MatrixResult {
  metric: Record<string, string>;
  values: [number, string][]; // [timestamp, value] pairs
}
```

### TimeParseResult

Result of parsing a time expression (absolute or relative).

```typescript
interface TimeParseResult {
  timestamp: number; // Unix epoch seconds
  isRelative: boolean;
}
```

### QueryRangeOptions

CLI options for the query-range command.

```typescript
interface QueryRangeOptions {
  start: string; // Required: start time expression
  end: string; // Required: end time expression
  step?: number; // Optional: step in seconds
  json?: boolean; // Optional: JSON output flag
}
```

## Existing Types (Reused)

| Type                    | File           | Usage                    |
| ----------------------- | -------------- | ------------------------ |
| `Config`                | types/index.ts | Server connection config |
| `MatrixResult`          | types/index.ts | Individual time series   |
| `PrometheusResponse<T>` | types/index.ts | API response wrapper     |

## Entity Relationships

```
┌─────────────────┐     ┌──────────────────┐
│  CLI Options    │────▶│ QueryRangeParams │
│  (user input)   │     │ (API params)     │
└─────────────────┘     └──────────────────┘
        │                       │
        │                       ▼
        │               ┌──────────────────┐
        │               │ Prometheus API   │
        │               │ /api/v1/query_   │
        │               │ range            │
        │               └──────────────────┘
        │                       │
        │                       ▼
        │               ┌──────────────────┐
        └──────────────▶│ QueryRangeResult │
          (--json)      │ (matrix data)    │
                        └──────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ Table/JSON Output│
                        └──────────────────┘
```

## Validation Constraints

| Field        | Constraint               | Error Message                                                                                         |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| start        | Must be parseable        | "Invalid start time format. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)"            |
| end          | Must be parseable        | "Invalid end time format. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)"              |
| start < end  | start must precede end   | "Invalid time range: start must be before end"                                                        |
| step > 0     | Positive integer         | "Step must be a positive number in seconds"                                                           |
| step ≤ range | Step cannot exceed range | "Warning: Step ({step}s) is larger than time range ({range}s). Only one data point will be returned." |
