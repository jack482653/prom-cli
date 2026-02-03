# CLI Commands Contract: Series

**Feature Branch**: `005-series`
**Date**: 2025-01-09

## Command Signature

```
prom series <matchers...> [options]
```

## Arguments

### `<matchers...>`

**Type**: Variadic string arguments (1 or more required)
**Description**: Prometheus label matchers to filter time series
**Examples**:

- `'up'` - Metric name only (shorthand for `{__name__="up"}`)
- `'{job="prometheus"}'` - Single label matcher
- `'{job="prometheus",instance="localhost:9090"}'` - Multiple labels (AND)
- `'up' '{job="node"}'` - Multiple matchers (OR)

**Validation**:

- At least one matcher is required
- Matchers must be quoted if they contain special characters
- Syntax validation delegated to Prometheus API

## Options

### `--json`

**Type**: Boolean flag
**Default**: `false`
**Description**: Output results in JSON format instead of human-readable list

### `--start <time>`

**Type**: String
**Default**: None (Prometheus uses default ~5 minutes)
**Description**: Start time for filtering series by time range
**Format**:

- RFC3339: `2024-01-01T00:00:00Z`
- Relative: `1h`, `30m`, `1d`, `now`

**Validation**:

- Must be valid time expression
- If both `--start` and `--end` provided, start must be before end

### `--end <time>`

**Type**: String
**Default**: None (Prometheus uses current time)
**Description**: End time for filtering series by time range
**Format**: Same as `--start`

**Validation**: Same as `--start`

## Output Formats

### Default (Human-Readable List)

Each series is displayed on one line in label set format:

```
{__name__="up", job="prometheus", instance="localhost:9090"}
{__name__="up", job="node", instance="localhost:9100"}
{__name__="node_cpu_seconds_total", cpu="0", job="node", mode="idle"}
```

**Format Rules**:

- Curly braces wrap label set
- Labels separated by commas
- Label format: `key="value"`
- One series per line
- Empty output if no matching series

### JSON Format (`--json`)

Array of label set objects:

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

**Format Rules**:

- Valid JSON array
- Each element is an object with string key-value pairs
- Empty array `[]` if no matching series
- Pretty-printed with 2-space indentation

## Exit Codes

| Code | Condition       | Example Scenario                                           |
| ---- | --------------- | ---------------------------------------------------------- |
| 0    | Success         | Series found and displayed                                 |
| 0    | Success (empty) | No matching series (valid query, no results)               |
| 1    | User Error      | No matchers provided, invalid time expression, start > end |
| 2    | Server Error    | Connection failed, authentication failed, Prometheus error |

## Error Messages

### No Matchers Provided

```
Error: At least one label matcher is required

Usage: prom series <matchers...> [options]
Example: prom series 'up'
Example: prom series '{job="prometheus"}'
```

### Invalid Matcher Syntax (from Prometheus)

```
Error from Prometheus: parse error at char 1: unexpected character: '&'

Check your label matcher syntax. See https://prometheus.io/docs/prometheus/latest/querying/basics/#time-series-selectors
```

### Server Not Configured

```
Error: Prometheus server not configured

Run 'prom config' to configure your server connection.
```

### Connection Error

```
Error: Failed to connect to http://localhost:9090

Check that:
- The server URL is correct
- The server is running and accessible
- Network connectivity is available
```

### Authentication Error

```
Error: Authentication failed (401 Unauthorized)

Check your credentials with 'prom config'.
```

### Invalid Time Expression

```
Error: Invalid start time format: "invalid"

Use RFC3339 format (2024-01-01T00:00:00Z) or relative format (1h, 30m, now).
```

### Invalid Time Range

```
Error: Start time must be before end time

Start: 2024-01-02T00:00:00Z
End:   2024-01-01T00:00:00Z
```

## Usage Examples

### Basic Usage

```bash
# Query series by metric name
prom series 'up'

# Query series by label
prom series '{job="prometheus"}'

# Query with multiple labels (AND)
prom series '{job="prometheus",instance="localhost:9090"}'
```

### Multiple Matchers (OR)

```bash
# Series matching either matcher
prom series 'up' '{job="node"}'

# Series matching any of three patterns
prom series 'up' 'node_cpu_seconds_total' '{job="prometheus"}'
```

### Time Filtering

```bash
# Series from last hour
prom series 'up' --start 1h --end now

# Series in specific date range
prom series '{job="prometheus"}' --start 2024-01-01T00:00:00Z --end 2024-01-02T00:00:00Z

# Only start time (end defaults to now)
prom series 'up' --start 2024-01-01T00:00:00Z
```

### JSON Output

```bash
# JSON for scripting
prom series 'up' --json

# Pipe to jq for filtering
prom series '{job="prometheus"}' --json | jq '.[] | select(.instance | contains("9090"))'

# Save to file
prom series 'up' --json > series.json
```

### Regex Matchers

```bash
# Regex match (note: quote escaping may be needed in shell)
prom series '{job=~"prom.*"}'

# Negative regex match
prom series '{job!~"test.*"}'
```

## Help Output

```
Usage: prom series <matchers...> [options]

Query time series matching label selectors

Arguments:
  matchers                 Prometheus label matchers (e.g., 'up', '{job="prometheus"}')

Options:
  --json                   Output in JSON format
  --start <time>           Start time (RFC3339 or relative, e.g., '1h')
  --end <time>             End time (RFC3339 or relative, e.g., 'now')
  -h, --help               Display help for command

Examples:
  $ prom series 'up'
  $ prom series '{job="prometheus"}'
  $ prom series 'up' '{job="node"}'
  $ prom series 'up' --start 1h --end now
  $ prom series '{job="prometheus"}' --json
```

## Consistency with Other Commands

### Common Options

- `--json` - Consistent with query, query-range, labels, targets
- `--start` / `--end` - Consistent with query-range, labels
- `-h, --help` - Standard across all commands

### Error Message Style

- Consistent format: "Error: {description}"
- Actionable suggestions included
- Clear distinction between user errors (exit 1) and server errors (exit 2)

### Output Format

- Human-readable default, JSON optional
- Consistent with labels command (simple list format)
- No table output (series are variable-length label sets)
