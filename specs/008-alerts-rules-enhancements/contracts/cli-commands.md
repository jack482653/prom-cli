# CLI Command Contracts

**Feature**: 008-alerts-rules-enhancements
**Date**: 2026-03-21

---

## New Commands

### `prom alerts`

List currently active alerts from Prometheus.

```
prom alerts [options]

Options:
  -j, --json       Output as JSON
  --csv            Output as CSV
  -h, --help       Display help
```

**Default (table) output:**

```
NAME        STATE    SEVERITY   ACTIVE SINCE   VALUE
HighCPU     firing   critical   5m ago         0.95
DiskFull    pending  warning    2m ago         0.87
```

**JSON output (`--json`):**

```json
[
  {
    "name": "HighCPU",
    "state": "firing",
    "severity": "critical",
    "labels": { "job": "node", "instance": "server1:9100" },
    "annotations": { "summary": "CPU above 90%" },
    "activeAt": "2026-03-21T10:00:00.000Z",
    "value": "0.95"
  }
]
```

**CSV output (`--csv`):**

```csv
name,state,severity,activeAt,value
HighCPU,firing,critical,2026-03-21T10:00:00.000Z,0.95
DiskFull,pending,warning,2026-03-21T10:05:00.000Z,0.87
```

**Empty state:**

```
No active alerts.
```

**Exit codes**: 0 = success, 1 = validation error, 2 = connection/auth error

---

### `prom rules`

List all configured alerting and recording rules.

```
prom rules [options]

Options:
  --type <type>    Filter by rule type (alerting or recording)
  -j, --json       Output as JSON
  --csv            Output as CSV
  -h, --help       Display help
```

**Default (table) output:**

```
NAME            TYPE        GROUP        HEALTH   EXPRESSION
HighCPU         alerting    node.rules   ok       node_cpu_seconds_total > 0.9
job:cpu:avg     recording   node.rules   ok       avg by (job)(rate(...))
```

**JSON output (`--json`):**

```json
[
  {
    "name": "HighCPU",
    "type": "alerting",
    "query": "node_cpu_seconds_total > 0.9",
    "health": "ok",
    "group": "node.rules",
    "duration": 300,
    "labels": { "severity": "critical" },
    "annotations": { "summary": "CPU above 90%" }
  }
]
```

**CSV output (`--csv`):**

```csv
name,type,group,health,query
HighCPU,alerting,node.rules,ok,node_cpu_seconds_total > 0.9
job:cpu:avg,recording,node.rules,ok,"avg by (job)(rate(node_cpu_seconds_total[5m]))"
```

**Invalid `--type` value:**

```
Error: --type must be "alerting" or "recording"
```

Exit code: 1

**Empty state:**

```
No rules configured.
```

**Exit codes**: 0 = success, 1 = validation error, 2 = connection/auth error

---

## Modified Commands

### `prom targets` — add `--label` and `--csv`

```
prom targets [options]

Options:
  -j, --json          Output as JSON
  --csv               Output as CSV           (NEW)
  --job <name>        Filter by job name
  --state <state>     Filter by health state (up or down)
  --label <key=value> Filter by label (repeatable)  (NEW)
  -h, --help          Display help
```

**Example:**

```bash
prom targets --label env=production --label region=us-east
prom targets --state up --label job=api --csv
```

**Invalid `--label` format:**

```
Error: --label must be in "key=value" format, got: "badvalue"
```

Exit code: 1

**No targets match label filter:**

```
No targets found matching filters.
```

---

### `prom query` — add `--csv`

```
prom query <expr> [options]

Options:
  -j, --json     Output as JSON
  --csv          Output as CSV    (NEW)
  -h, --help     Display help
```

**CSV output (`--csv`, vector results):**

```csv
metric,labels,value
node_cpu_seconds_total,"{job=""node"",instance=""server1:9100""}",1234.5
```

---

### `prom query-range` — add `--csv`

```
prom query-range <expr> [options]

Options:
  --start <time>   Start time (required)
  --end <time>     End time (required)
  --step <secs>    Step in seconds (default: 60)
  -j, --json       Output as JSON
  --csv            Output as CSV    (NEW)
  -h, --help       Display help
```

**CSV output (`--csv`):**

```csv
metric,labels,timestamp,value
node_cpu_seconds_total,"{job=""node""}",2026-03-21T10:00:00.000Z,1234.5
node_cpu_seconds_total,"{job=""node""}",2026-03-21T10:01:00.000Z,1235.1
```

---

## CSV Escaping Rules (RFC 4180)

- Fields containing `,`, `"`, or newlines are wrapped in double-quotes
- Embedded double-quotes are escaped as `""`
- Header row always present
- No trailing newline after last row
