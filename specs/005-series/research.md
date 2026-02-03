# Research: Series Command

**Feature Branch**: `005-series`
**Date**: 2025-01-09

## Technology Decisions

### Reuse Existing Infrastructure

**Decision**: Reuse all existing infrastructure from previous features

**Rationale**:

- All technology choices (Node.js, TypeScript, commander, axios, vitest) already established
- Time parsing functionality from query-range and labels commands can be reused
- Prometheus client service already handles authentication and error handling
- No new dependencies needed

**Alternatives Considered**: None - constitution principle VI (No Overdesign) mandates reuse

## Prometheus API Research

### Series Endpoint

**Endpoint**: `/api/v1/series`
**Method**: GET or POST
**Purpose**: Find time series matching label selectors

**Query Parameters**:

| Parameter | Required | Type     | Description                  |
| --------- | -------- | -------- | ---------------------------- |
| `match[]` | Yes      | string[] | Label matcher(s), logical OR |
| `start`   | No       | RFC3339  | Start timestamp              |
| `end`     | No       | RFC3339  | End timestamp                |

**Example Request**:

```
GET /api/v1/series?match[]=up&match[]={job="prometheus"}&start=2024-01-01T00:00:00Z&end=2024-01-01T23:59:59Z
```

**Response Format**:

```json
{
  "status": "success",
  "data": [
    {
      "__name__": "up",
      "job": "prometheus",
      "instance": "localhost:9090"
    },
    {
      "__name__": "up",
      "job": "node",
      "instance": "localhost:9100"
    }
  ]
}
```

**Error Response** (invalid matcher):

```json
{
  "status": "error",
  "errorType": "bad_data",
  "error": "parse error at char 1: unexpected character: '&'"
}
```

### Label Matcher Syntax

Prometheus supports four matcher operators:

| Operator | Description     | Example             |
| -------- | --------------- | ------------------- |
| `=`      | Exact match     | `job="prometheus"`  |
| `!=`     | Not equal       | `job!="prometheus"` |
| `=~`     | Regex match     | `job=~"prom.*"`     |
| `!~`     | Regex not match | `job!~"test.*"`     |

**Shorthand**: A bare string like `'up'` is shorthand for `{__name__="up"}`

**Multiple Matchers**: Multiple match[] parameters are combined with logical OR

**Examples**:

- `'up'` - All series with metric name "up"
- `'{job="prometheus"}'` - All series where job label is "prometheus"
- `'{job="prometheus",instance="localhost:9090"}'` - All series matching both labels (AND within a matcher)
- `'up' '{job="node"}'` - Series with name "up" OR job "node" (OR between matchers)

### Time Range Behavior

- If `start` and `end` are omitted, Prometheus uses a default time range (typically last 5 minutes)
- Only series with at least one sample in the time range are returned
- Empty results if no series match the selectors or time range

## Architecture Decisions

### Command Structure

Following existing patterns from labels and query-range commands:

```typescript
// src/commands/series.ts
export interface SeriesOptions {
  json?: boolean;
  start?: string; // Time expression (RFC3339 or relative)
  end?: string; // Time expression (RFC3339 or relative)
}

export async function seriesCommand(
  matchers: string[], // Variadic arguments: 'up', '{job="prometheus"}', etc.
  options: SeriesOptions,
): Promise<void>;
```

### API Client Method

Following existing patterns from prometheus.ts:

```typescript
// src/services/prometheus.ts
export async function getSeries(
  client: AxiosInstance,
  matchers: string[],
  start?: number, // Unix timestamp
  end?: number, // Unix timestamp
): Promise<Record<string, string>[]>;
```

### Output Format

**Default (human-readable list)**:

```
{__name__="up", job="prometheus", instance="localhost:9090"}
{__name__="up", job="node", instance="localhost:9100"}
{__name__="node_cpu_seconds_total", cpu="0", job="node", mode="idle"}
```

**JSON format** (`--json` flag):

```json
[
  {
    "__name__": "up",
    "job": "prometheus",
    "instance": "localhost:9090"
  },
  {
    "__name__": "up",
    "job": "node",
    "instance": "localhost:9100"
  }
]
```

### Error Handling Strategy

Following Constitution Principle III (UX Consistency):

| Error Scenario          | Exit Code | Message Example                                                                            |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------ |
| No matchers provided    | 1         | "Error: At least one label matcher is required. Example: prom series 'up'"                 |
| Invalid matcher syntax  | 1         | "Error from Prometheus: parse error at char 1: ... Check your label matcher syntax."       |
| Server not configured   | 1         | "Error: Prometheus server not configured. Run 'prom config' to configure."                 |
| Connection error        | 2         | "Error: Failed to connect to http://localhost:9090. Check server URL and connectivity."    |
| Auth error              | 2         | "Error: Authentication failed. Check your credentials in 'prom config'."                   |
| Invalid time expression | 1         | "Error: Invalid start time. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)" |

### Performance Considerations

Following Constitution Principle IV (Performance):

- **Large result sets**: Prometheus may return 10,000+ series. No client-side pagination needed - display all results
- **Streaming**: Not required for CLI use case (batch output acceptable)
- **Memory**: Store results in array (typical deployments have <10k series, manageable memory footprint)
- **Timeout**: Reuse existing 30s default timeout from axios client

## Implementation Notes

### Reuse Time Parsing

From labels command (`src/services/time-parser.ts`):

```typescript
import { parseTimeExpression } from "../services/time-parser.js";

// Convert user input to Unix timestamp
const parsed = parseTimeExpression(options.start);
const startTimestamp = parsed.timestamp;
```

### Reuse Error Classes

From labels command (`src/commands/labels.ts`):

```typescript
export class InvalidTimeExpressionError extends Error { ... }
export class InvalidTimeRangeError extends Error { ... }
```

### Argument Handling

Use commander's variadic arguments feature:

```typescript
program
  .command("series")
  .arguments("<matchers...>")  // Accepts 1 or more arguments
  .action((matchers: string[], options: SeriesOptions) => { ... });
```

## Open Questions (Resolved)

**Q1**: Should we validate label matcher syntax on the client?
**A1**: No - let Prometheus handle validation and return meaningful errors (Constitution Principle VI: No Overdesign)

**Q2**: Should we paginate large result sets?
**A2**: No - CLI tools typically display all results at once. Users can pipe to `head` if needed (Constitution Principle VI: No Overdesign)

**Q3**: Should we support result filtering on client side?
**A3**: No - users should use Prometheus label matchers for filtering (Constitution Principle VI: No Overdesign)

All technology decisions have been made. No outstanding questions.
