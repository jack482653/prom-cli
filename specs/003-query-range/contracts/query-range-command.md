# CLI Contract: query-range Command

**Date**: 2025-01-03
**Feature**: 003-query-range

## Command Signature

```
prom query-range <expression> --start <time> --end <time> [--step <seconds>] [--json]
```

## Arguments

| Argument       | Required | Description                   |
| -------------- | -------- | ----------------------------- |
| `<expression>` | Yes      | PromQL expression to evaluate |

## Options

| Option             | Short | Required | Default | Description                      |
| ------------------ | ----- | -------- | ------- | -------------------------------- |
| `--start <time>`   | `-s`  | Yes      | -       | Start time (RFC3339 or relative) |
| `--end <time>`     | `-e`  | Yes      | -       | End time (RFC3339 or relative)   |
| `--step <seconds>` | `-p`  | No       | Auto    | Resolution step in seconds       |
| `--json`           | `-j`  | No       | false   | Output as JSON                   |

## Time Format Support

### Absolute (RFC3339)

```
2024-01-01T00:00:00Z
2024-01-01T12:30:00+08:00
```

### Relative

```
now     → current timestamp
30s     → 30 seconds ago
5m      → 5 minutes ago
1h      → 1 hour ago
12h     → 12 hours ago
1d      → 1 day ago
7d      → 7 days ago
```

## Output Formats

### Table (Default)

For matrix results with multiple series:

```
METRIC   LABELS                              POINTS   RANGE
up       {instance="localhost:9090",job="prometheus"}   60       1.0 - 1.0
up       {instance="localhost:9100",job="node"}         60       0.0 - 1.0

Time range: 2024-01-01T00:00:00Z to 2024-01-01T01:00:00Z (step: 60s)
Total: 2 series, 120 data points
```

For single series detail (< 20 points):

```
METRIC: up
LABELS: {instance="localhost:9090",job="prometheus"}

TIMESTAMP                    VALUE
2024-01-01T00:00:00Z        1
2024-01-01T00:01:00Z        1
2024-01-01T00:02:00Z        1
...
```

### JSON (--json)

```json
{
  "resultType": "matrix",
  "result": [
    {
      "metric": {
        "__name__": "up",
        "instance": "localhost:9090",
        "job": "prometheus"
      },
      "values": [
        [1704067200, "1"],
        [1704067260, "1"]
      ]
    }
  ]
}
```

## Error Messages

### Invalid Time Format

```
Error: Invalid start time format.
Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)
```

### Invalid Time Range

```
Error: Invalid time range.
Start time must be before end time.
Start: 2024-01-02T00:00:00Z
End:   2024-01-01T00:00:00Z
```

### Empty Results

```
No data found for the specified time range.
Query: up{job="nonexistent"}
Time range: 2024-01-01T00:00:00Z to 2024-01-01T01:00:00Z
```

### Large Result Warning

```
Warning: Large result set (1500+ data points).
Consider using a larger step value or narrower time range.
Use --json for full output or pipe to a file.
```

### Step Warning

```
Warning: Step (3700s) is larger than time range (3600s).
Only 1 data point will be returned.
```

## Exit Codes

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| 0    | Success                                             |
| 1    | Invalid input (bad time format, invalid expression) |
| 2    | Connection/server error                             |

## Examples

```bash
# Basic range query with absolute times
prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z" --step 60

# Query last hour with relative times
prom query-range "up" --start "1h" --end "now"

# Query with auto-calculated step
prom query-range 'rate(http_requests_total[5m])' -s "6h" -e "now"

# JSON output for scripting
prom query-range "up" -s "30m" -e "now" --json | jq '.result[0].values'

# Query last 24 hours with 5-minute resolution
prom query-range "node_cpu_seconds_total" -s "1d" -e "now" -p 300
```
