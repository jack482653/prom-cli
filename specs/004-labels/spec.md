# Feature Specification: Labels Command

**Feature Branch**: `004-labels`
**Created**: 2025-01-03
**Status**: Draft
**Input**: User description: "labels command to list label names and values from Prometheus"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - List All Label Names (Priority: P1)

As a user, I want to list all available label names from Prometheus so that I can understand what dimensions are available for querying metrics.

**Why this priority**: This is the core discovery functionality - users need to know what labels exist before they can query specific values.

**Independent Test**: Can be fully tested by running `prom labels` and verifying it returns a list of label names from the connected Prometheus server.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server with metrics, **When** user runs `prom labels`, **Then** the system displays all available label names in a readable list.
2. **Given** a configured Prometheus server, **When** user runs `prom labels --json`, **Then** the system outputs label names in JSON format for scripting.
3. **Given** no Prometheus server is configured, **When** user runs `prom labels`, **Then** the system displays an error message instructing user to configure a server first.

---

### User Story 2 - List Values for Specific Label (Priority: P2)

As a user, I want to list all values for a specific label so that I can see what options are available when building queries.

**Why this priority**: After discovering label names, users need to explore the values for specific labels to construct effective queries.

**Independent Test**: Can be fully tested by running `prom labels job` and verifying it returns all values for the "job" label.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server, **When** user runs `prom labels <label_name>`, **Then** the system displays all values for that label.
2. **Given** a configured Prometheus server, **When** user runs `prom labels job --json`, **Then** the system outputs label values in JSON format.
3. **Given** a non-existent label name, **When** user runs `prom labels nonexistent`, **Then** the system displays an empty result or appropriate message.

---

### User Story 3 - Filter Labels by Time Range (Priority: P3)

As a user, I want to filter label names and values by a time range so that I can see what labels/values existed during a specific period.

**Why this priority**: Time-based filtering is an advanced feature that helps with debugging historical data but is not essential for basic label discovery.

**Independent Test**: Can be fully tested by running `prom labels --start 1h --end now` and verifying results are scoped to the time range.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server, **When** user runs `prom labels --start 1h --end now`, **Then** the system displays labels that have data within the last hour.
2. **Given** a configured Prometheus server, **When** user runs `prom labels job --start 2024-01-01T00:00:00Z --end 2024-01-02T00:00:00Z`, **Then** the system displays values for "job" label within that time range.

---

### Edge Cases

- What happens when the Prometheus server returns an empty label list? Display "No labels found" message.
- What happens when the user requests values for a label with thousands of values? Display all values (no pagination needed for CLI).
- How does the system handle connection timeout? Display error with server URL and suggest checking connectivity.
- What happens when authentication fails? Display clear authentication error message.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a `labels` command to list all label names from Prometheus.
- **FR-002**: System MUST allow specifying a label name argument to list values for that specific label.
- **FR-003**: System MUST support `--json` flag for JSON output format.
- **FR-004**: System MUST support `--start` and `--end` options for time-range filtering.
- **FR-005**: System MUST reuse existing time parsing (RFC3339 and relative expressions like "1h", "30m", "now").
- **FR-006**: System MUST display helpful error messages when server is not configured.
- **FR-007**: System MUST display helpful error messages when connection fails.
- **FR-008**: System MUST display results in a clean, readable list format by default.

### Key Entities

- **Label Name**: A string identifier for a metric dimension (e.g., "job", "instance", "__name__").
- **Label Value**: A string value for a specific label (e.g., "prometheus", "localhost:9090").

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can list all label names in under 2 seconds for typical Prometheus deployments.
- **SC-002**: Users can list values for any label in under 2 seconds.
- **SC-003**: Command provides clear feedback within 1 second when server is unreachable.
- **SC-004**: JSON output is valid and parseable by standard tools (jq, etc.).
- **SC-005**: Error messages clearly indicate the problem and suggest corrective action.

## Assumptions

- The existing configuration system (`~/.prom-cli/config.json`) is already set up and working.
- Time parsing functionality from query-range feature can be reused.
- Prometheus server supports the standard `/api/v1/labels` and `/api/v1/label/<name>/values` endpoints.

## Out of Scope

- Label name autocompletion in the shell.
- Caching of label data locally.
- Filtering labels by metric name pattern (match[] parameter).
