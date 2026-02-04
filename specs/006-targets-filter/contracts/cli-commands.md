# CLI Commands Contract: Targets Filter

**Feature Branch**: `006-targets-filter`
**Date**: 2025-02-03

## Command: prom targets

List scrape targets with optional filtering by job name and health state.

### Synopsis

```bash
prom targets [options]
```

### Description

Lists all Prometheus scrape targets and their current health status. Targets can be filtered by job name (`--job`) and/or health state (`--state`) to focus on specific subsets. Results are displayed in a table format by default, or as JSON with the `--json` flag.

### Arguments

None. All parameters are provided as options.

### Options

| Option          | Short | Type   | Default | Description                                      |
| --------------- | ----- | ------ | ------- | ------------------------------------------------ |
| --json          | -j    | flag   | false   | Output as JSON (existing)                        |
| --job <name>    | -     | string | -       | Filter by job name (exact match, case-sensitive) |
| --state <state> | -     | string | -       | Filter by health state ("up" or "down")          |
| --help          | -h    | flag   | -       | Show help                                        |

**Option Details**:

- **--json**: Existing option, no changes. Returns array of target objects.
- **--job**: New option. Filters targets to only those with matching job label. Requires exact match (case-sensitive). Can be combined with --state.
- **--state**: New option. Filters targets by health status. Valid values: "up" or "down". Case-sensitive. Invalid values show error and exit.

### Examples

#### Example 1: List all targets (unchanged behavior)

```bash
$ prom targets
JOB              INSTANCE                    HEALTH   LAST SCRAPE
prometheus       localhost:9090              up       5s ago
node_exporter    localhost:9100              up       12s ago
alertmanager     localhost:9093              down     3m ago
```

#### Example 2: Filter by job name

```bash
$ prom targets --job prometheus
JOB              INSTANCE                    HEALTH   LAST SCRAPE
prometheus       localhost:9090              up       5s ago
```

#### Example 3: Filter by health state

```bash
$ prom targets --state down
JOB              INSTANCE                    HEALTH   LAST SCRAPE
alertmanager     localhost:9093              down     3m ago
```

#### Example 4: Combined filters (job AND state)

```bash
$ prom targets --job node_exporter --state down
No targets found matching filters.
```

#### Example 5: JSON output with filters

```bash
$ prom targets --job prometheus --json
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

#### Example 6: No matches

```bash
$ prom targets --job nonexistent
No targets found matching filters.
```

### Output Formats

#### Default Format (Table)

Displays targets in a readable table with columns: JOB, INSTANCE, HEALTH, LAST SCRAPE.

**With targets**:

```
JOB              INSTANCE                    HEALTH   LAST SCRAPE
prometheus       localhost:9090              up       5s ago
node_exporter    localhost:9100              up       12s ago
```

**No targets configured**:

```
No targets configured.
```

**No matches after filtering**:

```
No targets found matching filters.
```

#### JSON Format

Returns array of target objects.

**With targets**:

```json
[
  {
    "job": "prometheus",
    "instance": "localhost:9090",
    "health": "up",
    "lastScrape": "2025-02-03T10:30:00.000Z",
    "lastScrapeDuration": 0.05
  },
  {
    "job": "node_exporter",
    "instance": "localhost:9100",
    "health": "up",
    "lastScrape": "2025-02-03T10:30:12.000Z",
    "lastScrapeDuration": 0.03
  }
]
```

**No targets**:

```json
[]
```

### Exit Codes

| Code | Description                                       |
| ---- | ------------------------------------------------- |
| 0    | Success (includes empty results after filtering)  |
| 1    | Error (no config, invalid --state value)          |
| 2    | Connection error (cannot reach Prometheus server) |

### Error Messages

| Condition             | Message                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------- |
| No config             | `Error: No server configured.\nRun 'prom config <url>' to configure your Prometheus server.` |
| Invalid --state value | `Error: --state must be "up" or "down"`                                                      |
| Connection failed     | `Error: Could not connect to Prometheus server.\nURL: <url>\nReason: <reason>\n...`          |
| API error             | `Error: <message from Prometheus API>`                                                       |

### Behavior Specifications

#### Filter Logic

**Job Filter**:

- Exact string match (case-sensitive)
- Compared against target's `job` label
- No partial matching or regex support
- Empty string `""` is valid (matches targets with empty job label)

**State Filter**:

- Exact match against "up" or "down" (case-sensitive)
- Compared against target's health status
- "unknown" health state is not filterable (considered internal state)

**Combined Filters**:

- Applies AND logic: both filters must match
- Example: `--job X --state Y` returns targets where job=X AND health=Y

**No Filters**:

- Returns all targets (unchanged from current behavior)
- Equivalent to not using filter options at all

#### Validation

**--state validation**:

```bash
# Invalid value
$ prom targets --state invalid
Error: --state must be "up" or "down"
# Exit code: 1

# Valid values
$ prom targets --state up    # OK
$ prom targets --state down  # OK
$ prom targets --state UP    # Error (case-sensitive)
```

**--job validation**:

- No validation needed (any string is valid job name)
- Special characters and spaces are allowed
- Empty string is technically valid

#### Edge Cases

**Case 1: No targets configured**

```bash
$ prom targets --job anything
No targets configured.
```

**Case 2: Filters applied to empty result**

- Shows "No targets configured." (not "No targets found matching filters.")

**Case 3: Multiple spaces or special characters in job name**

```bash
$ prom targets --job "my service"  # Quotes required for spaces
JOB              INSTANCE                    HEALTH   LAST SCRAPE
my service       localhost:8080              up       5s ago
```

**Case 4: Case sensitivity**

```bash
$ prom targets --job Prometheus  # No match
No targets found matching filters.

$ prom targets --job prometheus  # Match
JOB              INSTANCE                    HEALTH   LAST SCRAPE
prometheus       localhost:9090              up       5s ago
```

### Performance Characteristics

**Expected Performance**:

- Filtering 100 targets: < 0.01ms
- Filtering 1000 targets: < 0.1ms (well under 2s requirement)
- Network latency dominates total time (10-100ms for API call)

**Scalability**:

- Client-side filtering scales linearly O(n)
- Acceptable for typical deployments (< 1000 targets)
- No server-side load increase (API call unchanged)

### Compatibility

**Backward Compatibility**: ✅ 100% compatible

- Existing command without filters works identically
- New options are optional and additive
- Output format unchanged (same table/JSON structure)
- Exit codes unchanged
- Error messages unchanged (except new --state validation)

**Breaking Changes**: None

**Script Compatibility**:

```bash
# Existing scripts continue to work
prom targets --json | jq '.[] | select(.health == "down")'

# New filtering is optional enhancement
prom targets --state down --json
```

### Testing Verification

**Test Scenarios**:

1. No filters provided → returns all targets
2. Filter by job → returns only matching job
3. Filter by state → returns only matching health state
4. Combined filters → returns targets matching both
5. No matches → shows appropriate message
6. Invalid --state value → shows error and exits
7. JSON output with filters → valid JSON array
8. Empty target list → shows "No targets configured."

**Integration Points**:

- Existing `getTargets(client)` API call
- Existing `formatTargetsTable()` formatter
- Existing `formatJson()` formatter
- Existing `handleError()` error handler
