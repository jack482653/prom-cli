# Feature Specification: Query Range Command

**Feature Branch**: `003-query-range`
**Created**: 2025-01-03
**Status**: Draft
**Input**: User description: "新增 query_range 範圍查詢功能"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Basic Range Query (Priority: P1)

A user wants to query metric values over a time range to analyze trends or patterns. They specify a PromQL expression along with start time, end time, and step interval to retrieve time series data.

**Why this priority**: Range queries are the core functionality - without them, users cannot analyze historical data or trends, which is a primary use case for Prometheus.

**Independent Test**: User can execute `prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z" --step 60` and see matrix results with timestamps and values.

**Acceptance Scenarios**:

1. **Given** a configured Prometheus server, **When** the user runs a range query with start, end, and step parameters, **Then** the system displays matrix results with timestamps and corresponding values.
2. **Given** valid PromQL expression, **When** the query returns multiple time series, **Then** each series is displayed with its labels and all data points within the range.
3. **Given** a range query, **When** the user specifies `--json` flag, **Then** the output is formatted as JSON.

---

### User Story 2 - Relative Time Ranges (Priority: P2)

A user wants to query data using relative time expressions (like "last 1 hour" or "last 30 minutes") instead of absolute timestamps for convenience.

**Why this priority**: Relative time ranges improve usability significantly - users often want to check "the last hour" without calculating exact timestamps.

**Independent Test**: User can execute `prom query-range "up" --start "1h" --end "now"` to query the last hour of data.

**Acceptance Scenarios**:

1. **Given** a range query, **When** the user specifies `--start "1h"` (meaning 1 hour ago), **Then** the system interprets this as a relative time from now.
2. **Given** a range query, **When** the user specifies `--end "now"`, **Then** the system uses the current timestamp as the end time.
3. **Given** relative time inputs, **When** combined with step parameter, **Then** the query executes correctly with calculated absolute timestamps.

---

### User Story 3 - Default Step Calculation (Priority: P3)

A user wants reasonable default behavior when they don't specify a step interval, so they don't need to calculate an appropriate step value manually.

**Why this priority**: Sensible defaults reduce cognitive load and make the tool more accessible to users who are less familiar with Prometheus.

**Independent Test**: User can execute `prom query-range "up" --start "1h" --end "now"` without specifying step, and the system automatically calculates an appropriate step value.

**Acceptance Scenarios**:

1. **Given** a range query without step parameter, **When** the time range is 1 hour, **Then** the system calculates an appropriate step to target ~200 data points (e.g., ~18 seconds for 1 hour).
2. **Given** a range query without step parameter, **When** the time range is 24 hours, **Then** the system uses a larger step to keep data points manageable.

---

### Edge Cases

- What happens when start time is after end time? Display clear error message indicating invalid time range.
- What happens when step is larger than the time range? Display warning and return single data point.
- What happens when the query returns empty results? Display "no data" message clearly.
- What happens when the result set is very large? Display results with a warning about large result count, suggest using larger step.
- What happens when time format is invalid? Display error with expected format examples.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a `query-range` command that accepts a PromQL expression
- **FR-002**: System MUST accept `--start` parameter for range start time (absolute or relative)
- **FR-003**: System MUST accept `--end` parameter for range end time (absolute or relative)
- **FR-004**: System MUST accept `--step` parameter for resolution step in seconds
- **FR-005**: System MUST calculate a sensible default step when not provided (based on time range)
- **FR-006**: System MUST support absolute timestamps in RFC3339 format
- **FR-007**: System MUST support relative time expressions (e.g., "1h", "30m", "1d", "now")
- **FR-008**: System MUST display matrix results with metric labels, timestamps, and values
- **FR-009**: System MUST support `--json` flag for JSON output format
- **FR-010**: System MUST validate that start time is before end time
- **FR-011**: System MUST display actionable error messages for invalid inputs

### Key Entities

- **Matrix Result**: A collection of time series data, where each series has labels and multiple timestamp-value pairs
- **Time Range**: Defined by start time, end time, and step interval
- **Data Point**: A single timestamp-value pair within a time series

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can execute range queries and see results within 5 seconds (excluding network latency)
- **SC-002**: All matrix results display with clear timestamp and value formatting
- **SC-003**: Relative time expressions are correctly interpreted 100% of the time
- **SC-004**: Default step calculation produces between 50-500 data points for typical time ranges
- **SC-005**: Error messages clearly indicate the problem and how to fix it

## Assumptions

- Users have already configured the Prometheus server URL via `prom config`
- Users are familiar with basic PromQL syntax
- Prometheus server supports the `/api/v1/query_range` endpoint (standard in all versions)
- Relative time expressions follow common conventions (1h = 1 hour, 30m = 30 minutes, 1d = 1 day)
- Default step calculation aims for approximately 100-200 data points for readability
- Table output will show a summary view; full data available via JSON output
