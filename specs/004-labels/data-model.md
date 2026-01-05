# Data Model: Labels Command

**Feature**: 004-labels
**Date**: 2025-01-03

## Entities

### LabelsOptions (CLI Options)

Options for the labels command parsed from CLI arguments.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| labelName | string | No | Optional label name to get values for |
| json | boolean | No | Output as JSON format |
| start | string | No | Start time for filtering (RFC3339 or relative) |
| end | string | No | End time for filtering (RFC3339 or relative) |

### LabelsResponse (API Response)

Response from Prometheus `/api/v1/labels` endpoint.

| Field | Type | Description |
|-------|------|-------------|
| status | "success" \| "error" | Response status |
| data | string[] | Array of label names |
| error | string | Error message (when status is "error") |
| errorType | string | Error type (when status is "error") |

### LabelValuesResponse (API Response)

Response from Prometheus `/api/v1/label/<name>/values` endpoint.

| Field | Type | Description |
|-------|------|-------------|
| status | "success" \| "error" | Response status |
| data | string[] | Array of label values |
| error | string | Error message (when status is "error") |
| errorType | string | Error type (when status is "error") |

## Type Definitions

```typescript
// New type for labels command options
export interface LabelsOptions {
  json?: boolean;
  start?: string;
  end?: string;
}

// API response types (reuse existing pattern)
export interface LabelsResult {
  status: "success" | "error";
  data: string[];
  error?: string;
  errorType?: string;
}
```

## Validation Rules

1. **Label name**: Must be a valid Prometheus label name (alphanumeric + underscore, starts with letter or underscore)
2. **Time range**: If both start and end provided, start must be before end
3. **Time format**: Must be valid RFC3339 or relative expression (handled by existing time-parser)

## Relationships

```
LabelsOptions ──uses──> TimeParseResult (existing)
     │
     └──produces──> LabelsResult/LabelValuesResponse
```

The labels command integrates with:
- `services/config.ts` - Load server configuration
- `services/prometheus.ts` - Make API calls
- `services/time-parser.ts` - Parse time expressions
- `formatters/json.ts` - Format JSON output
