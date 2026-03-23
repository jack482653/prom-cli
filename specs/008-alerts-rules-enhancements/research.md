# Research: Alerts, Rules, CSV Output & Target Label Filter

**Feature**: 008-alerts-rules-enhancements
**Date**: 2026-03-21

## 1. Prometheus `/api/v1/alerts` Response Shape

**Decision**: Map alert fields directly from API response.

**API Response**:

```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "labels": { "alertname": "HighCPU", "severity": "critical", "job": "node" },
        "annotations": { "summary": "CPU above 90%", "description": "..." },
        "state": "firing",
        "activeAt": "2026-03-21T10:00:00Z",
        "value": "0.95"
      }
    ]
  }
}
```

**Fields exposed in CLI output**:

- `alertname` (from labels)
- `state` (firing | pending)
- `severity` (from labels, optional)
- `labels` (full label set minus alertname)
- `activeAt` (formatted as relative time)
- `value`

**Rationale**: Mirrors how existing commands expose nested API data (e.g., Target from ActiveTarget).

---

## 2. Prometheus `/api/v1/rules` Response Shape

**Decision**: Flatten rule groups for display; expose group name as a column.

**API Response**:

```json
{
  "status": "success",
  "data": {
    "groups": [
      {
        "name": "node.rules",
        "file": "/etc/prometheus/rules.yml",
        "interval": 60,
        "rules": [
          {
            "type": "alerting",
            "name": "HighCPU",
            "query": "node_cpu_seconds_total > 0.9",
            "duration": 300,
            "labels": { "severity": "critical" },
            "annotations": { "summary": "..." },
            "health": "ok",
            "lastEvaluation": "2026-03-21T10:00:00Z",
            "evaluationTime": 0.001
          },
          {
            "type": "recording",
            "name": "job:node_cpu:avg",
            "query": "avg by (job)(rate(node_cpu_seconds_total[5m]))",
            "labels": {},
            "health": "ok",
            "lastEvaluation": "2026-03-21T10:00:00Z",
            "evaluationTime": 0.001
          }
        ]
      }
    ]
  }
}
```

**Fields exposed in CLI output**:

- `name` (rule name)
- `type` (alerting | recording)
- `query` (PromQL expression)
- `health` (ok | err | unknown)
- `group` (parent group name)

**Rationale**: Flattening is simpler to display in a table and easier for agents to consume. Group name as column provides context without nested structure.

---

## 3. CSV Output Format

**Decision**: RFC 4180 compliant CSV using a custom `formatCsv()` function. No external library.

**Rationale**: The project avoids adding dependencies for simple functionality (constitution principle VI: No Overdesign). RFC 4180 escaping is straightforward: wrap fields containing commas, double-quotes, or newlines in double-quotes; escape embedded double-quotes by doubling them.

**Alternative considered**: `csv-stringify` npm package — rejected because it adds a dependency for ~10 lines of logic.

**Scope of `--csv` support** (commands with tabular output):

- `prom targets`
- `prom query` (vector results only; scalar/string produce single values)
- `prom query-range`
- `prom alerts` (new)
- `prom rules` (new)

**Out of scope**: `prom status`, `prom labels`, `prom series` — these produce non-tabular output.

---

## 4. Target Label Filtering

**Decision**: Client-side filtering with `--label key=value` option (repeatable). AND logic across multiple labels.

**Implementation**: Extend the existing `filterTargets()` pure function to accept `labels?: string[]` (raw `key=value` strings), parse them, and filter targets whose `labels` record contains all specified key-value pairs.

**Validation**: `--label` values not matching `key=value` format produce an error and exit(1).

**Rationale**: Consistent with existing client-side filtering approach for `--job` and `--state`. Keeps `filterTargets()` as a pure function, maintainable and testable.

---

## 5. Command Registration Pattern

**Decision**: Follow existing `createXxxCommand()` factory pattern in `src/commands/`.

New files:

- `src/commands/alerts.ts` → `createAlertsCommand()`
- `src/commands/rules.ts` → `createRulesCommand()`

Register in `src/index.ts` alongside existing commands.

---

## 6. Type Definitions Location

**Decision**: Add new types (`Alert`, `Rule`, `RuleGroup`, `AlertsData`, `RulesData`) to `src/types/index.ts`, consistent with all existing types.
