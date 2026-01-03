# Research: Query Range Command

**Date**: 2025-01-03
**Feature**: 003-query-range

## Prometheus API: query_range

### Decision

Use `/api/v1/query_range` endpoint with POST method (consistent with existing `query` command).

### Rationale

- Standard Prometheus API endpoint for range queries
- Already using POST for instant queries to handle complex expressions
- POST avoids URL length limits for large PromQL expressions

### API Reference

```
POST /api/v1/query_range
Content-Type: application/x-www-form-urlencoded

Parameters:
- query: PromQL expression (required)
- start: Start timestamp (RFC3339 or Unix epoch) (required)
- end: End timestamp (RFC3339 or Unix epoch) (required)
- step: Query resolution step (duration format or float seconds) (required)
- timeout: Evaluation timeout (optional)

Response:
{
  "status": "success",
  "data": {
    "resultType": "matrix",
    "result": [
      {
        "metric": { "__name__": "up", "job": "prometheus", ... },
        "values": [
          [1609459200, "1"],
          [1609459260, "1"],
          ...
        ]
      }
    ]
  }
}
```

## Relative Time Parsing

### Decision

Implement simple duration parser supporting: `now`, `Ns`, `Nm`, `Nh`, `Nd` (seconds, minutes, hours, days).

### Rationale

- Matches Prometheus/Grafana conventions
- Covers 95%+ of real-world use cases
- Simple to implement and test
- No external dependencies needed

### Alternatives Considered

| Option        | Pros                       | Cons                       |
| ------------- | -------------------------- | -------------------------- |
| ms (date-fns) | Full-featured, well-tested | Heavy dependency, overkill |
| Custom parser | Zero dependencies, fast    | Limited formats            |
| dayjs         | Light, chainable           | Still extra dependency     |

**Chosen**: Custom parser - matches No Overdesign principle.

### Format Specification

```
now          → current timestamp
30s          → 30 seconds ago
5m           → 5 minutes ago
1h           → 1 hour ago
7d           → 7 days ago
2024-01-01T00:00:00Z  → absolute RFC3339 (pass through)
```

## Default Step Calculation

### Decision

Calculate step based on time range to target ~200 data points.

### Rationale

- 200 points provides good resolution for terminal display
- Matches Grafana's default behavior
- Avoids overwhelming users with thousands of data points

### Formula

```
step = Math.max(1, Math.floor((end - start) / 200))
```

### Examples

| Time Range | Calculated Step | Data Points |
| ---------- | --------------- | ----------- |
| 1 hour     | 18s             | 200         |
| 6 hours    | 108s (~2m)      | 200         |
| 24 hours   | 432s (~7m)      | 200         |
| 7 days     | 3024s (~50m)    | 200         |

## Matrix Output Formatting

### Decision

Display matrix results in a summary table format, with full data available via `--json`.

### Rationale

- Matrix results can have thousands of data points
- Terminal width is limited
- Users can pipe to `jq` for processing

### Table Format

```
METRIC   LABELS                         POINTS   RANGE
up       {instance="localhost:9090"}    60       1.0 - 1.0
up       {instance="localhost:9100"}    60       0.0 - 1.0
```

## Error Handling

### Decision

Extend existing error patterns from `prometheus.ts`.

### New Error Cases

- Invalid time range (start >= end)
- Invalid time format
- Step larger than range
- Empty results
- Large result warning
