# Data Model: Targets Filter

**Feature Branch**: `006-targets-filter`
**Date**: 2025-02-03

## Overview

This feature extends the existing targets command with filtering capabilities. No new entities are introduced - only the command options interface is extended to support filter parameters.

## Entities

### TargetsOptions (Modified)

Command options for the targets command, now including filter parameters.

| Field | Type           | Required | Description                                   |
| ----- | -------------- | -------- | --------------------------------------------- |
| json  | boolean        | No       | Output results in JSON format (existing)      |
| job   | string         | No       | Filter targets by job name (exact match, new) |
| state | "up" \| "down" | No       | Filter targets by health state (new)          |

**Validation Rules**:

- `job`: Any string value (no length restrictions, matches Prometheus job label)
- `state`: Must be exactly "up" or "down" (case-sensitive)
- Both filters are optional and can be combined

**Example Values**:

```typescript
// No filters
{ json: false }

// Job filter only
{ json: false, job: "prometheus" }

// State filter only
{ json: false, state: "up" }

// Combined filters
{ json: true, job: "node_exporter", state: "down" }
```

### Target (Unchanged)

Existing entity representing a Prometheus scrape target. No modifications needed.

| Field              | Type                        | Description                             |
| ------------------ | --------------------------- | --------------------------------------- |
| job                | string                      | Job label from Prometheus scrape config |
| instance           | string                      | Instance identifier (host:port)         |
| health             | "up" \| "down" \| "unknown" | Current health status                   |
| lastScrape         | Date                        | Timestamp of last scrape attempt        |
| lastScrapeDuration | number                      | Duration of last scrape in milliseconds |
| labels             | Record<string, string>      | All labels for this target              |

**Filtering Behavior**:

- `job` field is compared against `TargetsOptions.job` for equality
- `health` field is compared against `TargetsOptions.state` for equality
- If both filters provided, both must match (AND logic)

## Relationships

### Command → Options → Targets

```
User Input (--job, --state)
    ↓
TargetsOptions { job, state }
    ↓
filterTargets(targets, options)
    ↓
Target[] (filtered subset)
    ↓
Output (table or JSON)
```

**Flow**:

1. Commander parses CLI arguments into `TargetsOptions`
2. Command validates `state` option (must be "up" or "down")
3. API call fetches all targets (unfiltered)
4. `filterTargets()` applies client-side filtering
5. Filtered results are passed to existing formatters

## State Transitions

No state is maintained - this is a stateless operation.

**Operation Flow**:

```
START
  ↓
Validate options (state enum check)
  ↓
Fetch all targets from API
  ↓
Apply filters (job, state)
  ↓
Format output (table or JSON)
  ↓
END
```

**Edge Cases**:

- **No targets from API**: Display "No targets configured."
- **No targets after filtering**: Display "No targets found matching filters."
- **Invalid state value**: Error message "Error: --state must be 'up' or 'down'" and exit(1)

## Data Transformations

### Filter Function Signature

```typescript
function filterTargets(
  targets: Target[],
  options: { job?: string; state?: "up" | "down" },
): Target[] {
  // Returns subset of targets matching filter criteria
}
```

**Input**: Full target list from Prometheus API
**Output**: Filtered target list (may be empty)
**Side Effects**: None (pure function)

### Filter Logic

**Job Filter**:

```typescript
if (options.job && target.job !== options.job) {
  return false; // Exact match, case-sensitive
}
```

**State Filter**:

```typescript
if (options.state && target.health !== options.state) {
  return false; // Exact match ("up" | "down")
}
```

**Combined (AND logic)**:

```typescript
// Both conditions must pass if both filters provided
return (
  (!options.job || target.job === options.job) &&
  (!options.state || target.health === options.state)
);
```

## Validation Rules

### State Option Validation

**Rule**: `state` must be "up" or "down"

**Implementation**:

```typescript
if (options.state && !["up", "down"].includes(options.state)) {
  console.error('Error: --state must be "up" or "down"');
  process.exit(1);
}
```

**Timing**: Validate before API call (fail fast)

### Job Option Validation

**Rule**: No validation needed (any string is valid job name in Prometheus)

**Rationale**:

- Job names are user-defined in Prometheus configuration
- Empty string is technically valid (though unusual)
- Special characters and spaces are allowed in job labels
- No length restrictions

## Output Formats

### Table Format (Default)

Filtered results use same format as unfiltered:

```
JOB              INSTANCE                    HEALTH   LAST SCRAPE
prometheus       localhost:9090              up       5s ago
node-exporter    localhost:9100              up       12s ago
```

**Empty Result**:

```
No targets found matching filters.
```

### JSON Format (--json)

```json
[
  {
    "job": "prometheus",
    "instance": "localhost:9090",
    "health": "up",
    "lastScrape": "2025-02-03T10:30:00.000Z",
    "lastScrapeDuration": 0.05
  }
]
```

**Empty Result**:

```json
[]
```

## Performance Considerations

### Time Complexity

- **Filter operation**: O(n) where n = number of targets
- **Job comparison**: O(1) string equality
- **State comparison**: O(1) enum equality
- **Total**: O(n) - linear in target count

### Space Complexity

- **Input**: O(n) array of targets
- **Output**: O(m) where m ≤ n (filtered subset)
- **Additional memory**: O(1) (no intermediate structures)

### Benchmark Expectations

| Target Count | Expected Filter Time |
| ------------ | -------------------- |
| 100          | < 0.01ms             |
| 1000         | < 0.1ms              |
| 10000        | < 1ms                |

**Note**: Actual performance depends on CPU, but filtering is extremely fast compared to network latency (typically 10-100ms for API call).

## Examples

### Example 1: Filter by Job

**Input**:

```bash
prom targets --job prometheus
```

**Options**:

```typescript
{ json: false, job: "prometheus" }
```

**Filtering**:

```typescript
targets.filter((t) => t.job === "prometheus");
```

**Output**: Only targets with `job="prometheus"`

### Example 2: Filter by State

**Input**:

```bash
prom targets --state down
```

**Options**:

```typescript
{ json: false, state: "down" }
```

**Filtering**:

```typescript
targets.filter((t) => t.health === "down");
```

**Output**: Only unhealthy targets

### Example 3: Combined Filters

**Input**:

```bash
prom targets --job node-exporter --state down --json
```

**Options**:

```typescript
{ json: true, job: "node-exporter", state: "down" }
```

**Filtering**:

```typescript
targets.filter((t) => t.job === "node-exporter" && t.health === "down");
```

**Output**: JSON array of unhealthy node-exporter targets

### Example 4: No Matches

**Input**:

```bash
prom targets --job nonexistent
```

**Filtering**:

```typescript
targets.filter((t) => t.job === "nonexistent");
// Returns []
```

**Output**:

```
No targets found matching filters.
```

## Migration Notes

**Backward Compatibility**: ✅ 100% compatible

- Existing behavior unchanged when no filters provided
- New options are purely additive
- No changes to API responses or output formats
- Existing tests remain valid
- Existing scripts using `prom targets` continue to work

**Breaking Changes**: None
