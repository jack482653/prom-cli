# Research: Labels Command

**Feature**: 004-labels
**Date**: 2025-01-03

## Prometheus Labels API

### Decision: Use standard Prometheus HTTP API endpoints

**Endpoints**:
1. `GET /api/v1/labels` - Returns list of all label names
2. `GET /api/v1/label/<label_name>/values` - Returns list of values for a specific label

**Rationale**: These are the official Prometheus API endpoints, well-documented and stable.

**Alternatives considered**:
- Using `/api/v1/series` with label extraction - More complex, requires additional parsing
- PromQL metadata queries - Not available in all Prometheus versions

### API Response Format

**Labels endpoint** (`/api/v1/labels`):
```json
{
  "status": "success",
  "data": ["__name__", "instance", "job", "method", "status_code"]
}
```

**Label values endpoint** (`/api/v1/label/<name>/values`):
```json
{
  "status": "success",
  "data": ["prometheus", "node_exporter", "alertmanager"]
}
```

### Query Parameters

Both endpoints support optional time range filtering:
- `start`: RFC3339 or Unix timestamp
- `end`: RFC3339 or Unix timestamp

**Note**: Time range filtering limits results to labels/values that had data in that period.

## Integration with Existing Code

### Decision: Extend prometheus.ts service

**Rationale**: Follow existing patterns - all Prometheus API calls go through `services/prometheus.ts`.

**Implementation approach**:
1. Add `getLabels()` function to prometheus.ts
2. Add `getLabelValues(labelName)` function to prometheus.ts
3. Both functions accept optional `start` and `end` parameters

### Decision: Reuse time-parser.ts

**Rationale**: Already handles RFC3339 and relative time expressions (1h, 30m, now).

**No changes needed** - existing `parseTimeExpression()` function is sufficient.

## CLI Design

### Decision: Single `labels` command with optional argument

**Usage**:
```bash
prom labels              # List all label names
prom labels job          # List values for "job" label
prom labels --json       # JSON output
prom labels job --json   # JSON output for values
prom labels --start 1h --end now  # Time-filtered
```

**Rationale**:
- Consistent with existing commands (query, targets, status)
- Intuitive: no argument = list names, with argument = list values

**Alternatives considered**:
- Separate `labels` and `label-values` commands - More verbose, less intuitive
- Subcommands (`labels list`, `labels values`) - Over-engineered for simple functionality

## Output Format

### Decision: Simple list for default output, JSON for scripting

**Default (list)**:
```
__name__
instance
job
method
status_code

Total: 5 labels
```

**JSON**:
```json
["__name__", "instance", "job", "method", "status_code"]
```

**Rationale**:
- Labels are simple strings, no table structure needed
- Consistent with how other CLI tools output lists
- JSON output matches Prometheus API response format
