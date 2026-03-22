# Feature Specification: Alerts, Rules, CSV Output & Target Label Filter

**Feature Branch**: `008-alerts-rules-enhancements`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Add alerts and rules commands to view triggered alerts and alerting rules, add CSV output format support to all query commands, and add --label filter option to targets command"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Active Alerts (Priority: P1)

An AI agent investigating an incident wants to know which alerts are currently firing so it can understand the known problem scope before diving into metrics.

**Why this priority**: The first step in incident investigation is understanding what the monitoring system has already detected. Knowing which alerts are firing gives the agent a starting point for deeper analysis.

**Independent Test**: Can be fully tested by running `prom alerts` against a Prometheus server with firing alerts, and confirming the output lists alert name, state, severity, and labels.

**Acceptance Scenarios**:

1. **Given** a connected Prometheus server with firing alerts, **When** the agent runs `prom alerts`, **Then** it sees a list of alerts with name, state (firing/pending), severity, and label set.
2. **Given** no alerts are firing, **When** the agent runs `prom alerts`, **Then** it receives a clear message indicating no active alerts.
3. **Given** the agent needs machine-parseable output, **When** running `prom alerts --json`, **Then** the output is valid JSON with full alert details.

---

### User Story 2 - View Alerting & Recording Rules (Priority: P2)

An AI agent wants to understand what alerting rules are configured in Prometheus so it can understand the thresholds and conditions that triggered an alert.

**Why this priority**: Understanding the rule definition helps the agent interpret why an alert fired and what conditions to investigate. Without this, the agent only knows an alert fired but not the criteria.

**Independent Test**: Can be fully tested by running `prom rules` and verifying output shows rule name, type (alerting/recording), expression, and status.

**Acceptance Scenarios**:

1. **Given** a connected Prometheus server, **When** the agent runs `prom rules`, **Then** it sees all configured rules with name, type, expression, and health status.
2. **Given** the agent wants only alerting rules, **When** running `prom rules --type alerting`, **Then** only alerting rules are shown.
3. **Given** the agent wants only recording rules, **When** running `prom rules --type recording`, **Then** only recording rules are shown.
4. **Given** the agent needs machine-parseable output, **When** running `prom rules --json`, **Then** the output is valid JSON.

---

### User Story 3 - CSV Output Format (Priority: P3)

An AI agent or user wants to export query results or target lists in CSV format for further processing or analysis in external tools.

**Why this priority**: CSV is a widely supported format for data exchange. Adding this output option increases the tool's utility for downstream data processing by agents and users.

**Independent Test**: Can be fully tested by running any command with `--csv` flag and verifying the output is valid CSV with headers and data rows.

**Acceptance Scenarios**:

1. **Given** a query result, **When** running `prom query <expr> --csv`, **Then** output is valid CSV with column headers and one data row per result.
2. **Given** a targets list, **When** running `prom targets --csv`, **Then** output is valid CSV with all target fields as columns.
3. **Given** a range query result, **When** running `prom query-range <expr> --csv`, **Then** output is valid CSV with timestamp and value columns.
4. **Given** special characters (commas, quotes) in label values, **When** outputting CSV, **Then** values are properly escaped per RFC 4180.

---

### User Story 4 - Filter Targets by Label (Priority: P4)

An AI agent wants to narrow down the target list to those matching specific labels (e.g., `env=production`, `region=us-east`) to focus investigation on the relevant subset of infrastructure.

**Why this priority**: In large environments there may be hundreds of targets. Label filtering lets the agent focus on the specific subset relevant to the incident without processing irrelevant targets.

**Independent Test**: Can be fully tested by running `prom targets --label job=node_exporter` and verifying only targets with that label are returned.

**Acceptance Scenarios**:

1. **Given** targets with various labels, **When** running `prom targets --label job=node_exporter`, **Then** only targets whose labels include `job=node_exporter` are shown.
2. **Given** multiple label filters are needed, **When** running `prom targets --label env=prod --label region=us-east`, **Then** only targets matching ALL specified labels are shown (AND logic).
3. **Given** no targets match the label filter, **When** the filter is applied, **Then** a clear message indicates no matching targets were found.
4. **Given** label filters combined with existing filters, **When** running `prom targets --state up --label job=api`, **Then** all filter conditions are applied together.

---

### Edge Cases

- What happens when Prometheus has no rules configured? → Return empty list with informative message.
- What happens when alert labels contain commas or quotes? → CSV output must escape these per RFC 4180.
- What happens when `--label` receives an invalid format (missing `=`)? → Display error message and exit with non-zero code.
- What happens when `--type` receives an invalid value for rules? → Display allowed values and exit with non-zero code.
- What happens when targets have no labels matching the filter? → Display "no targets found" message, not an error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an `alerts` command that retrieves and displays currently active (firing and pending) alerts from the connected Prometheus server.
- **FR-002**: The `alerts` command MUST display alert name, state (firing/pending), severity (if present), and associated labels for each alert.
- **FR-003**: The `alerts` command MUST support `--json` output flag.
- **FR-004**: System MUST provide a `rules` command that retrieves and displays all configured alerting and recording rules.
- **FR-005**: The `rules` command MUST display rule name, type (alerting/recording), PromQL expression, and health status.
- **FR-006**: The `rules` command MUST support filtering by rule type via `--type alerting` or `--type recording`.
- **FR-007**: The `rules` command MUST support `--json` output flag.
- **FR-008**: All commands that produce tabular output MUST support a `--csv` output flag.
- **FR-009**: CSV output MUST include a header row with column names and properly escape values containing commas or double-quotes per RFC 4180.
- **FR-010**: The `targets` command MUST accept one or more `--label key=value` options to filter targets by label.
- **FR-011**: Multiple `--label` filters MUST be applied with AND logic (target must match all specified labels).
- **FR-012**: The `--label` filter MUST be combinable with existing `--job` and `--state` filters.
- **FR-013**: Invalid `--label` format (not `key=value`) MUST produce an error message and exit with non-zero code.

### Key Entities

- **Alert**: A firing or pending notification with name, state, severity, labels, value, and active-since timestamp.
- **Rule**: A configured alerting or recording rule with name, type, PromQL expression, health status, and group name.
- **RuleGroup**: A named collection of rules with an evaluation interval.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An AI agent can identify all currently firing alerts in a single command invocation with no additional tooling.
- **SC-002**: An AI agent can retrieve the PromQL expression for any alerting rule to understand what conditions triggered an incident.
- **SC-003**: All commands producing tabular output deliver results in CSV format when `--csv` is specified, enabling zero-friction data handoff to downstream processing.
- **SC-004**: An AI agent investigating an incident with 100+ targets can narrow results to a relevant subset using label filters in a single command, without post-processing.
- **SC-005**: All new commands return structured JSON output when `--json` is specified, ensuring consistent machine-readable output across the entire CLI.

## Assumptions

- Prometheus server version supports `/api/v1/alerts` and `/api/v1/rules` endpoints (Prometheus 2.x+).
- CSV output uses comma as delimiter and follows RFC 4180 quoting rules.
- Label filter format is `key=value`; exact match only (no regex or glob).
- The `alerts` command displays both `firing` and `pending` state alerts by default.
- Commands that produce non-tabular output (e.g., `status`, `labels`) are out of scope for CSV support.
