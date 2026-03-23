# Data Model: Alerts, Rules, CSV Output & Target Label Filter

**Feature**: 008-alerts-rules-enhancements
**Date**: 2026-03-21

## New Types (src/types/index.ts)

### Alert

Represents a currently active (firing or pending) alert.

```typescript
export interface Alert {
  name: string; // From labels.alertname
  state: "firing" | "pending";
  severity: string; // From labels.severity, empty string if absent
  labels: Record<string, string>; // All labels except alertname
  annotations: Record<string, string>;
  activeAt: Date; // Parsed from activeAt ISO string
  value: string; // Numeric value as string
}
```

### AlertsData (API response wrapper)

```typescript
export interface AlertsData {
  alerts: RawAlert[];
}

export interface RawAlert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: "firing" | "pending";
  activeAt: string; // ISO 8601 string
  value: string;
}
```

### Rule

Represents a single alerting or recording rule (flattened from group).

```typescript
export interface Rule {
  name: string;
  type: "alerting" | "recording";
  query: string; // PromQL expression
  health: "ok" | "err" | "unknown";
  group: string; // Parent group name
  duration?: number; // Seconds (alerting rules only)
  labels: Record<string, string>;
  annotations: Record<string, string>; // (alerting rules only)
}
```

### RulesData (API response wrapper)

```typescript
export interface RulesData {
  groups: RuleGroup[];
}

export interface RuleGroup {
  name: string;
  file: string;
  interval: number;
  rules: RawRule[];
}

export type RawRule = RawAlertingRule | RawRecordingRule;

export interface RawAlertingRule {
  type: "alerting";
  name: string;
  query: string;
  duration: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  health: "ok" | "err" | "unknown";
  lastEvaluation: string;
  evaluationTime: number;
}

export interface RawRecordingRule {
  type: "recording";
  name: string;
  query: string;
  labels: Record<string, string>;
  health: "ok" | "err" | "unknown";
  lastEvaluation: string;
  evaluationTime: number;
}
```

---

## Modified Types

### TargetsOptions (src/commands/targets.ts)

Add `label` field:

```typescript
interface TargetsOptions {
  json?: boolean;
  csv?: boolean; // NEW
  job?: string;
  state?: "up" | "down";
  label?: string[]; // NEW - repeatable --label key=value
}
```

---

## New Formatter (src/formatters/csv.ts)

```typescript
// RFC 4180 compliant CSV formatter

export interface CsvOptions {
  columns: { header: string; key: string }[];
  data: Record<string, unknown>[];
}

export function formatCsv(options: CsvOptions): string;
export function escapeCsvField(value: string): string;
```

---

## Data Flow

```
prom alerts
  └─ loadConfig() → createClient() → getAlerts(client)
       └─ GET /api/v1/alerts → RawAlert[] → Alert[]
            └─ formatAlertsTable() | formatJson() | formatCsv()

prom rules [--type alerting|recording]
  └─ loadConfig() → createClient() → getRules(client)
       └─ GET /api/v1/rules → RuleGroup[] → Rule[] (flattened)
            └─ filter by type → formatRulesTable() | formatJson() | formatCsv()

prom targets --label env=prod --label job=api
  └─ ... existing flow ...
       └─ filterTargets(targets, { job, state, labels: ["env=prod","job=api"] })
```
