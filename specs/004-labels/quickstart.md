# Quickstart: Labels Command

**Feature**: 004-labels
**Date**: 2025-01-03

## Prerequisites

- prom-cli installed and configured (`prom config set-url <prometheus-url>`)
- Prometheus server accessible

## Basic Usage

### List All Label Names

```bash
prom labels
```

Output:

```
__name__
instance
job
method
status_code

Total: 5 labels
```

### List Values for a Specific Label

```bash
prom labels job
```

Output:

```
prometheus
node_exporter
alertmanager

Total: 3 values for "job"
```

## Output Formats

### JSON Output

Use `--json` for scripting and automation:

```bash
# List label names as JSON
prom labels --json

# List values as JSON
prom labels job --json
```

### Pipe to Other Tools

```bash
# Count labels
prom labels --json | jq length

# Find specific labels
prom labels --json | jq '.[] | select(startswith("http"))'

# Get all job names and sort
prom labels job --json | jq -r '.[]' | sort
```

## Time Range Filtering

Filter labels/values by time range to see what existed during a specific period:

```bash
# Labels from the last hour
prom labels --start 1h --end now

# Values for "job" in a specific date range
prom labels job --start 2024-01-01T00:00:00Z --end 2024-01-02T00:00:00Z
```

### Supported Time Formats

- **Relative**: `1h`, `30m`, `7d`, `now`
- **Absolute**: RFC3339 format `2024-01-01T00:00:00Z`

## Common Workflows

### Discover Available Metrics

```bash
# See all metric names
prom labels __name__
```

### Find Targets by Job

```bash
# List all jobs
prom labels job

# Then query specific job
prom query 'up{job="prometheus"}'
```

### Debug Missing Data

```bash
# Check if label existed in past hour
prom labels my_custom_label --start 1h --end now
```

## Error Handling

### No Configuration

```
Error: No configuration found. Run 'prom config' first.
```

**Fix**: Run `prom config set-url http://your-prometheus:9090`

### Connection Failed

```
Error: Failed to connect to Prometheus server at http://localhost:9090
```

**Fix**: Check server URL and network connectivity.

### Empty Results

```
No labels found.
```

This is normal if the Prometheus server has no scraped metrics yet.
