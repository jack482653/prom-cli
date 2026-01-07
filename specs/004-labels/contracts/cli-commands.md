# CLI Contract: Labels Command

**Feature**: 004-labels
**Date**: 2025-01-03

## Command: `prom labels`

### Synopsis

```bash
prom labels [label_name] [options]
```

### Description

List Prometheus label names or values for a specific label.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| label_name | No | If provided, list values for this label. If omitted, list all label names. |

### Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| --json | -j | boolean | false | Output as JSON |
| --start | -s | string | - | Start time (RFC3339 or relative: 1h, 30m, now) |
| --end | -e | string | - | End time (RFC3339 or relative: 1h, 30m, now) |
| --help | -h | - | - | Show help |

### Examples

```bash
# List all label names
prom labels

# List values for "job" label
prom labels job

# JSON output
prom labels --json
prom labels job --json

# Filter by time range
prom labels --start 1h --end now
prom labels job --start 2024-01-01T00:00:00Z --end 2024-01-02T00:00:00Z
```

### Output

#### Default Format (List)

**List label names:**
```
__name__
instance
job
method
status_code

Total: 5 labels
```

**List label values:**
```
prometheus
node_exporter
alertmanager

Total: 3 values for "job"
```

#### JSON Format

**List label names:**
```json
["__name__", "instance", "job", "method", "status_code"]
```

**List label values:**
```json
["prometheus", "node_exporter", "alertmanager"]
```

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (no config, connection failed, etc.) |

### Error Messages

| Condition | Message |
|-----------|---------|
| No config | `Error: No configuration found. Run 'prom config' first.` |
| Connection failed | `Error: Failed to connect to Prometheus server at <url>` |
| Invalid time format | `Error: Invalid start/end time. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)` |
| Invalid time range | `Error: Start time must be before end time.` |
| Empty results | `No labels found.` or `No values found for "<label>".` |
