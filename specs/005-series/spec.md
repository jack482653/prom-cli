# Feature Specification: Series Command

**Feature Branch**: `005-series`
**Created**: 2025-01-09
**Status**: Draft
**Input**: User description: "希望可以支援查詢時間序列功能"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Query Time Series by Label Matchers (Priority: P1)

As a DevOps engineer, I want to query time series using label matchers so that I can discover which metric and label combinations exist in my Prometheus server.

**Why this priority**: This is the core functionality - users need to find time series by their labels to understand what metrics are available and how they are labeled.

**Independent Test**: Can be fully tested by running `prom series 'up'` or `prom series '{job="prometheus"}'` and verifying it returns matching time series from the connected Prometheus server.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server with metrics, **When** user runs `prom series 'up'`, **Then** the system displays all time series with the metric name "up" showing their complete label sets.
2. **Given** a configured Prometheus server, **When** user runs `prom series '{job="prometheus"}'`, **Then** the system displays all time series matching the label selector.
3. **Given** a configured Prometheus server, **When** user runs `prom series 'up' '{job="node"}'`, **Then** the system displays time series matching either selector (logical OR).
4. **Given** no Prometheus server is configured, **When** user runs `prom series`, **Then** the system displays an error message instructing user to configure a server first.
5. **Given** no label matchers provided, **When** user runs `prom series`, **Then** the system displays an error message explaining that at least one matcher is required.

---

### User Story 2 - Filter Series by Time Range (Priority: P2)

As a user, I want to filter time series by a time range so that I can see which series existed during a specific period, useful for debugging historical data issues.

**Why this priority**: Time-based filtering is an advanced feature that helps with investigating past incidents but is not essential for basic series discovery.

**Independent Test**: Can be fully tested by running `prom series 'up' --start 1h --end now` and verifying results are scoped to the time range.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server, **When** user runs `prom series 'up' --start 1h --end now`, **Then** the system displays series that have data points within the last hour.
2. **Given** a configured Prometheus server, **When** user runs `prom series '{job="prometheus"}' --start 2024-01-01T00:00:00Z --end 2024-01-02T00:00:00Z`, **Then** the system displays series within that specific time range.
3. **Given** an invalid time expression, **When** user runs `prom series 'up' --start invalid`, **Then** the system displays a clear error message about the time format.

---

### User Story 3 - JSON Output for Scripting (Priority: P3)

As a user, I want to output series data in JSON format so that I can process the results programmatically in scripts and automation workflows.

**Why this priority**: JSON output enables scripting and integration with other tools, but the human-readable format is sufficient for interactive use.

**Independent Test**: Can be fully tested by running `prom series 'up' --json` and verifying the output is valid JSON parseable by standard tools.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server, **When** user runs `prom series 'up' --json`, **Then** the system outputs series data in valid JSON format.
2. **Given** series query results, **When** user pipes JSON output to jq or similar tools, **Then** the JSON is parseable without errors.

---

### Edge Cases

- What happens when no series match the label matchers? Display "No series found matching the given selectors" message.
- What happens when the query returns thousands of series? Display all results (no pagination needed for CLI, but consider performance).
- How does the system handle invalid label matcher syntax? Display Prometheus error message with clear indication of the syntax issue.
- What happens when authentication fails? Display clear authentication error message with server URL.
- How does the system handle connection timeout? Display error with server URL and suggest checking connectivity.
- What happens when both --start and --end are provided but --start is after --end? Display error message about invalid time range.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a `series` command that accepts one or more label matcher arguments.
- **FR-002**: System MUST support Prometheus label matcher syntax (e.g., `'up'`, `'{job="prometheus"}'`, `'{job=~".*"}'`).
- **FR-003**: System MUST support multiple label matchers (logical OR) by accepting multiple matcher arguments.
- **FR-004**: System MUST support `--start` and `--end` options for time-range filtering.
- **FR-005**: System MUST reuse existing time parsing functionality (RFC3339 and relative expressions like "1h", "30m", "now").
- **FR-006**: System MUST support `--json` flag for JSON output format.
- **FR-007**: System MUST display series as human-readable list by default, showing each series' complete label set.
- **FR-008**: System MUST display helpful error messages when server is not configured.
- **FR-009**: System MUST display helpful error messages when connection fails or authentication fails.
- **FR-010**: System MUST require at least one label matcher argument and show error if none provided.
- **FR-011**: System MUST handle large result sets (thousands of series) efficiently without crashing or hanging.

### Key Entities

- **Time Series**: A unique combination of metric name and label key-value pairs that identifies a stream of timestamped data points.
- **Label Matcher**: A selector expression that filters time series by their labels (e.g., `{job="prometheus",instance="localhost:9090"}`).
- **Label Set**: A collection of key-value pairs that uniquely identify a time series (e.g., `{__name__="up", job="prometheus", instance="localhost:9090"}`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can query time series in under 2 seconds for typical Prometheus deployments (up to 10,000 series).
- **SC-002**: Command provides clear feedback within 1 second when server is unreachable.
- **SC-003**: JSON output is valid and parseable by standard tools (jq, etc.).
- **SC-004**: Error messages clearly indicate the problem and suggest corrective action.
- **SC-005**: Users can successfully query series with multiple matchers and understand the OR logic.
- **SC-006**: System handles large result sets (10,000+ series) without performance degradation or crashes.

## Assumptions

- The existing configuration system (`~/.prom-cli/config.json`) is already set up and working.
- Time parsing functionality from query-range and labels features can be reused.
- Prometheus server supports the standard `/api/v1/series` endpoint.
- Users are familiar with Prometheus label matcher syntax or can reference Prometheus documentation.

## Out of Scope

- Label matcher syntax validation before sending to Prometheus (let Prometheus handle validation).
- Caching of series data locally.
- Pagination or limiting of results (display all results returned by Prometheus).
- Filtering results by regex pattern on client side (use Prometheus label matchers instead).
- Autocompletion of label names or values in the shell.
