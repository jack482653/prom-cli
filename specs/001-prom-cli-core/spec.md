# Feature Specification: prom-cli Core

**Feature Branch**: `001-prom-cli-core`
**Created**: 2024-12-31
**Status**: Draft
**Input**: User description: "建立一個 prom-cli 程式，需要有配置、查詢和狀態檢查功能"

## Clarifications

### Session 2024-12-31

- Q: User Story 優先順序調整 → A: P2 改為抓取目標狀態，P3 改為執行查詢，P4 改為檢查狀態
- Q: 輸出格式支援 → A: targets 和 query (vector) 預設使用 table 格式，支援 --json 輸出 JSON

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure Prometheus Server (Priority: P1)

As a DevOps engineer, I want to configure the Prometheus server connection so that I can start querying metrics from my terminal.

**Why this priority**: Without server configuration, no other functionality can work. This is the foundation for all subsequent operations.

**Independent Test**: Can be tested by running the configuration command and verifying the settings are saved correctly.

**Acceptance Scenarios**:

1. **Given** no existing configuration, **When** user runs the config command with a server URL, **Then** the configuration is saved and a success message is displayed
2. **Given** an existing configuration, **When** user runs the config command with new settings, **Then** the old configuration is replaced with new settings
3. **Given** user provides invalid URL format, **When** config command runs, **Then** an error message explains the correct format
4. **Given** user wants to add authentication, **When** user provides username/password or token, **Then** credentials are stored securely

---

### User Story 2 - List Scrape Targets (Priority: P2)

As a DevOps engineer, I want to view all scrape targets and their current status so that I can quickly identify which services are being monitored and detect scraping issues.

**Why this priority**: Knowing what targets are being scraped is fundamental to understanding the monitoring setup before diving into specific metrics queries.

**Independent Test**: Can be tested by running the targets command and verifying target list with health status is displayed.

**Acceptance Scenarios**:

1. **Given** a configured server, **When** user runs targets command, **Then** list of all scrape targets is displayed as aligned table (columns: JOB, INSTANCE, STATE, LAST SCRAPE)
2. **Given** a configured server, **When** user runs targets with `--json` flag, **Then** results are output as JSON
3. **Given** targets have different states, **When** targets command runs, **Then** each target shows: job name, instance, health state, last scrape time in table format
4. **Given** no server configured, **When** user runs targets command, **Then** user is prompted to configure server first

---

### User Story 3 - Execute Instant Query (Priority: P3)

As a DevOps engineer, I want to execute PromQL queries from the command line so that I can quickly check metric values without opening a browser.

**Why this priority**: Querying is a primary use case for this CLI tool. After understanding targets, users can query specific metrics.

**Independent Test**: Can be tested by running a simple query (e.g., `up`) against a configured Prometheus server and verifying results are displayed.

**Acceptance Scenarios**:

1. **Given** a configured server, **When** user runs query with valid PromQL returning vector result, **Then** query results are displayed as aligned table (columns: METRIC, LABELS, VALUE)
2. **Given** a configured server, **When** user runs query with `--json` flag, **Then** results are output as JSON regardless of result type
3. **Given** query returns scalar or string result, **When** query runs, **Then** the value is displayed directly with type indicator
4. **Given** an invalid PromQL expression, **When** query runs, **Then** error message from Prometheus is displayed clearly
5. **Given** no server configured, **When** user runs query, **Then** user is prompted to configure server first

---

### User Story 4 - Check Server Status (Priority: P4)

As a DevOps engineer, I want to check if my Prometheus server is healthy and ready so that I can troubleshoot connectivity issues.

**Why this priority**: Health check is useful for debugging but not essential for day-to-day monitoring operations.

**Independent Test**: Can be tested by running status command and verifying server health and readiness information is shown.

**Acceptance Scenarios**:

1. **Given** a configured server, **When** user runs status command, **Then** server health, readiness, and build info are displayed in key-value format
2. **Given** server is unreachable, **When** user runs status command, **Then** connection error is displayed with helpful troubleshooting hints
3. **Given** no server configured, **When** user runs status command, **Then** user is prompted to configure server first

---

### Edge Cases

- What happens when server responds with timeout? Display timeout error with configurable timeout option.
- What happens when authentication fails? Display 401/403 error with suggestion to check credentials.
- What happens when query returns empty results? Display "no data" message clearly, not an empty screen.
- What happens when query returns large result set? Stream results or paginate to avoid memory issues. _(Deferred to future iteration - current MVP loads full result)_
- What happens when targets list is empty? Display "no targets configured" message.
- What happens when table columns exceed terminal width? Truncate long values with ellipsis, show full value in JSON mode.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to configure Prometheus server URL
- **FR-002**: System MUST allow users to optionally configure authentication (basic auth or bearer token)
- **FR-003**: System MUST persist configuration between sessions
- **FR-004**: System MUST list all scrape targets with their health status
- **FR-005**: System MUST display target details as aligned table: job name, instance, health state, last scrape time
- **FR-006**: System MUST execute instant PromQL queries against configured server
- **FR-007**: System MUST display vector query results as aligned table (METRIC, LABELS, VALUE) by default
- **FR-008**: System MUST display scalar/string query results with type indicator
- **FR-009**: System MUST support JSON output format via `--json` flag for targets and query commands
- **FR-010**: System MUST display server health and readiness status in key-value format
- **FR-011**: System MUST display server build information
- **FR-012**: System MUST provide helpful error messages when operations fail
- **FR-013**: System MUST validate server URL format before saving
- **FR-014**: System MUST handle terminal width gracefully (truncate with ellipsis when needed)

### Output Format Reference

**Targets table example:**

```
JOB          INSTANCE              STATE   LAST SCRAPE
prometheus   localhost:9090        up      2s ago
node         192.168.1.10:9100     down    5m ago
```

**Query vector table example:**

```
METRIC                        LABELS                          VALUE
up                           {instance="localhost:9090"}      1
node_cpu_seconds_total       {cpu="0",mode="idle"}           12345.67
```

**Query scalar example:**

```
scalar: 42
```

### Key Entities

- **Configuration**: Server URL, authentication type (none/basic/token), credentials
- **Target**: Job name, instance URL, health state (up/down/unknown), last scrape timestamp, scrape duration
- **Query**: PromQL expression, optional timestamp parameter
- **QueryResult**: Result type (vector/scalar/string), metric name, labels, value(s), timestamp(s)
- **ServerStatus**: Health state, readiness state, build version, uptime

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete server configuration in under 30 seconds
- **SC-002**: Targets list displays within 3 seconds for servers with up to 100 targets
- **SC-003**: Query results appear within 5 seconds for typical queries (excluding network latency)
- **SC-004**: 100% of error scenarios display actionable error messages (not stack traces)
- **SC-005**: Users can successfully view targets on first attempt after configuration
- **SC-006**: Status check completes within 3 seconds for reachable servers
- **SC-007**: Configuration persists correctly across CLI restarts (100% reliability)
- **SC-008**: Table output columns are properly aligned regardless of content length

## Assumptions

- Users have basic familiarity with Prometheus and PromQL syntax
- Users have network access to their Prometheus server
- Configuration will be stored in user's home directory (standard CLI practice)
- Timeout default is 30 seconds (can be made configurable later if needed)
- Basic auth and bearer token are sufficient authentication methods for MVP
- MVP focuses on instant queries (vector/scalar/string); range queries (matrix) deferred to future iteration
