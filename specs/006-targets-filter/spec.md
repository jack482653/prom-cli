# Feature Specification: Targets Filter

**Feature Branch**: `006-targets-filter`
**Created**: 2025-02-03
**Status**: Draft
**Input**: User description: "Add filtering options to prom targets command. Users should be able to filter targets by job name (--job) and health state (--state). This makes it easier to focus on specific targets when there are many scrape targets configured."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Filter Targets by Job (Priority: P1)

As a user, I want to filter targets by job name so that I can focus on specific services without viewing all configured targets.

**Why this priority**: When managing multiple services with dozens or hundreds of targets, viewing all targets creates information overload. Filtering by job is the most common use case for narrowing down targets to a specific service or application.

**Independent Test**: Can be fully tested by running `prom targets --job prometheus` and verifying it returns only targets belonging to the "prometheus" job.

**Acceptance Scenarios**:

1. **Given** a Prometheus server with multiple jobs configured, **When** user runs `prom targets --job prometheus`, **Then** the system displays only targets with job="prometheus"
2. **Given** a Prometheus server, **When** user runs `prom targets --job nonexistent`, **Then** the system displays an empty result or message indicating no targets found
3. **Given** a Prometheus server with targets, **When** user runs `prom targets --job prometheus --json`, **Then** the system outputs filtered targets in JSON format

---

### User Story 2 - Filter Targets by Health State (Priority: P2)

As a user, I want to filter targets by health state so that I can quickly identify unhealthy targets without manually scanning through all targets.

**Why this priority**: Identifying failing targets is critical for operations, but less frequently needed than filtering by job. This is typically used for troubleshooting rather than routine monitoring.

**Independent Test**: Can be fully tested by running `prom targets --state down` and verifying it returns only targets with health="down".

**Acceptance Scenarios**:

1. **Given** a Prometheus server with mixed healthy and unhealthy targets, **When** user runs `prom targets --state up`, **Then** the system displays only targets with health state "up"
2. **Given** a Prometheus server with targets, **When** user runs `prom targets --state down`, **Then** the system displays only targets with health state "down"
3. **Given** all targets are healthy, **When** user runs `prom targets --state down`, **Then** the system displays an empty result or message indicating no matching targets

---

### User Story 3 - Combine Multiple Filters (Priority: P3)

As a user, I want to combine job and state filters so that I can identify specific unhealthy targets within a particular job.

**Why this priority**: This is a power-user feature that combines both filters for advanced troubleshooting scenarios. While valuable, it's less critical than individual filter capabilities.

**Independent Test**: Can be fully tested by running `prom targets --job node-exporter --state down` and verifying it returns only targets matching both criteria.

**Acceptance Scenarios**:

1. **Given** a Prometheus server with multiple jobs and health states, **When** user runs `prom targets --job node-exporter --state down`, **Then** the system displays only targets where job="node-exporter" AND health="down"
2. **Given** filtered results, **When** user adds `--json` flag, **Then** the system outputs combined filtered results in JSON format
3. **Given** no targets match both criteria, **When** user runs combined filters, **Then** the system displays an appropriate empty result

---

### Edge Cases

- What happens when the job name contains special characters or spaces?
- How does the system handle case sensitivity in job names?
- What happens when --state is provided with an invalid value (not "up" or "down")?
- How does the system handle network timeouts or connection failures when fetching targets?
- What happens when there are no targets configured on the Prometheus server?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST add a `--job` option to the `prom targets` command that accepts a job name string
- **FR-002**: System MUST add a `--state` option to the `prom targets` command that accepts "up" or "down" as values
- **FR-003**: System MUST filter targets client-side based on the provided `--job` value, matching the job label exactly
- **FR-004**: System MUST filter targets client-side based on the provided `--state` value, matching the health state
- **FR-005**: System MUST support combining both `--job` and `--state` filters with AND logic
- **FR-006**: System MUST maintain existing functionality when no filters are provided (show all targets)
- **FR-007**: System MUST maintain compatibility with existing `--json` output format when filters are applied
- **FR-008**: System MUST display filtered results using the same table format as unfiltered results
- **FR-009**: System MUST show appropriate feedback when no targets match the filter criteria
- **FR-010**: System MUST validate the `--state` option value and reject invalid values with a helpful error message

### Key Entities

- **Target**: A scrape target with attributes including job name, instance, health state, and last scrape time
- **Filter Criteria**: User-specified job name and/or health state used to narrow down target list

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can filter targets by job in under 2 seconds for lists containing up to 1000 targets
- **SC-002**: Filtered results accurately match specified criteria with 100% precision (no false positives)
- **SC-003**: Users can identify unhealthy targets in a specific job without manually scanning through all targets
- **SC-004**: Filtering maintains the same output format and user experience as the unfiltered command
- **SC-005**: Invalid filter inputs provide clear, actionable error messages

## Scope _(mandatory)_

### In Scope

- Adding `--job` and `--state` command-line options
- Client-side filtering of targets returned from Prometheus API
- Maintaining backward compatibility with existing `prom targets` behavior
- Supporting filter combinations with AND logic
- Providing helpful feedback for empty results

### Out of Scope

- Server-side filtering (Prometheus API doesn't support query parameters for /api/v1/targets)
- Partial string matching or regex patterns for job names (exact match only)
- OR logic between filters (e.g., --job job1 --job job2)
- Filtering by other target attributes (instance, scrape URL, labels beyond job)
- Saving or persisting filter preferences

## Assumptions _(mandatory)_

- The Prometheus `/api/v1/targets` API returns all targets without server-side filtering capabilities
- Job names are case-sensitive in Prometheus
- Health states are limited to "up" and "down" values
- Users understand the difference between job names and instance identifiers
- The existing `prom targets` command structure and output format are already established and working
- Filtering performance for typical deployments (< 1000 targets) is acceptable with client-side filtering
