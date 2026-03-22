# Tasks: Alerts, Rules, CSV Output & Target Label Filter

**Input**: Design documents from `/specs/008-alerts-rules-enhancements/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: TDD/BDD approach per constitution — tests written before implementation (Red → Green → Refactor).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup (Shared Types)

**Purpose**: Add TypeScript type definitions that all user stories depend on.

- [x] T001 Add Alert, RawAlert, AlertsData types to `src/types/index.ts`
- [x] T002 Add Rule, RawRule, RawAlertingRule, RawRecordingRule, RuleGroup, RulesData types to `src/types/index.ts`

**Checkpoint**: Types compiled — `pnpm build` passes with zero errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API client functions and CSV formatter foundation that user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `getAlerts(client)` function to `src/services/prometheus.ts` (calls `/api/v1/alerts`, maps RawAlert → Alert)
- [x] T004 [P] Add `getRules(client)` function to `src/services/prometheus.ts` (calls `/api/v1/rules`, flattens RuleGroups → Rule[])
- [x] T005 [P] Create `src/formatters/csv.ts` with `escapeCsvField(value)` and `formatCsv(options)` stubs (return empty string — will be implemented in US3)

**Checkpoint**: Foundation ready — `pnpm build` passes; user story phases can now begin.

---

## Phase 3: User Story 1 — View Active Alerts (Priority: P1) 🎯 MVP

**Goal**: `prom alerts` command lists all currently active alerts with name, state, severity, and active-since time.

**Independent Test**: Run `prom alerts` against a live Prometheus with firing alerts — output shows a table with ALERT NAME, STATE, SEVERITY, ACTIVE SINCE columns. Run `prom alerts --json` and confirm valid JSON array.

### Tests for User Story 1

> **Write these FIRST — ensure they FAIL before implementation**

- [x] T006 [US1] Write unit tests for `getAlerts()` in `tests/alerts.test.ts`: mock axios, test happy path (firing + pending alerts), empty alerts list, API error handling
- [x] T007 [US1] Write unit tests for `formatAlertsTable()` in `tests/alerts.test.ts`: test table column headers, row formatting, empty data case

### Implementation for User Story 1

- [x] T008 [US1] Add `formatAlertsTable()` to `src/formatters/table.ts`
- [x] T009 [US1] Create `src/commands/alerts.ts` with `createAlertsCommand()`: `prom alerts [--json]`, calls `getAlerts()`, renders table or JSON
- [x] T010 [US1] Register `createAlertsCommand()` in `src/index.ts`
- [x] T011 [US1] Add error handling for empty alerts list ("No active alerts.") in `src/commands/alerts.ts`

**Checkpoint**: `prom alerts` and `prom alerts --json` fully functional. All T006–T011 tests pass.

---

## Phase 4: User Story 2 — View Alerting & Recording Rules (Priority: P2)

**Goal**: `prom rules` command lists all rules with name, type, group, health, and PromQL expression. Supports `--type alerting|recording` filter.

**Independent Test**: Run `prom rules` — output table shows RULE NAME, TYPE, GROUP, HEALTH, EXPRESSION columns. Run `prom rules --type alerting` — only alerting rules shown. Run with invalid `--type xyz` — error message and exit code 1.

### Tests for User Story 2

> **Write these FIRST — ensure they FAIL before implementation**

- [x] T012 [US2] Write unit tests for `getRules()` in `tests/rules.test.ts`: mock axios, test flattening of multiple groups, alerting vs recording rules, empty groups, API error handling
- [x] T013 [US2] Write unit tests for `formatRulesTable()` in `tests/rules.test.ts`: test column headers, row formatting for both rule types, empty data case
- [x] T014 [US2] Write unit tests for `--type` validation in `tests/rules.test.ts`: valid values (alerting, recording), invalid value produces error

### Implementation for User Story 2

- [x] T015 [US2] Add `formatRulesTable()` to `src/formatters/table.ts`
- [x] T016 [US2] Create `src/commands/rules.ts` with `createRulesCommand()`: `prom rules [--type alerting|recording] [--json]`, calls `getRules()`, applies type filter, renders table or JSON
- [x] T017 [US2] Register `createRulesCommand()` in `src/index.ts`
- [x] T018 [US2] Add `--type` validation (error + exit 1 on invalid value) in `src/commands/rules.ts`
- [x] T019 [US2] Add empty state message ("No rules configured.") in `src/commands/rules.ts`

**Checkpoint**: `prom rules`, `prom rules --type alerting`, and `prom rules --json` fully functional. All T012–T019 tests pass.

---

## Phase 5: User Story 3 — CSV Output Format (Priority: P3)

**Goal**: All tabular-output commands support `--csv` flag producing RFC 4180 compliant CSV with headers.

**Independent Test**: Run `prom targets --csv` — output is valid CSV with comma-separated headers and rows. Values containing commas or quotes are correctly escaped. Run `prom alerts --csv`, `prom rules --csv`, `prom query 'up' --csv`, `prom query-range 'up' --start 1h --step 5m --csv` — all produce valid CSV.

### Tests for User Story 3

> **Write these FIRST — ensure they FAIL before implementation**

- [x] T020 [US3] Write unit tests for `escapeCsvField()` in `tests/csv-formatter.test.ts`: plain value, value with comma, value with double-quote, value with newline, empty string
- [x] T021 [US3] Write unit tests for `formatCsv()` in `tests/csv-formatter.test.ts`: header row, data rows, multiple rows, empty data set, special characters in values

### Implementation for User Story 3

- [x] T022 [US3] Implement `escapeCsvField()` and `formatCsv()` in `src/formatters/csv.ts` (replace stubs from T005)
- [x] T023 [US3] Add `--csv` option to `src/commands/targets.ts`: format filtered targets as CSV using `formatCsv()`
- [x] T024 [P] [US3] Add `--csv` option to `src/commands/query.ts`: format vector results as CSV (metric, labels, value columns)
- [x] T025 [P] [US3] Add `--csv` option to `src/commands/query-range.ts`: format matrix results as CSV (metric, labels, timestamp, value rows)
- [x] T026 [US3] Add `--csv` option to `src/commands/alerts.ts` (extends T009)
- [x] T027 [US3] Add `--csv` option to `src/commands/rules.ts` (extends T016)

**Checkpoint**: All tabular commands accept `--csv`. RFC 4180 escaping works. All T020–T027 tests pass.

---

## Phase 6: User Story 4 — Filter Targets by Label (Priority: P4)

**Goal**: `prom targets --label key=value` filters targets to those matching all specified labels (AND logic). Combinable with existing `--job` and `--state` filters.

**Independent Test**: Run `prom targets --label job=node_exporter` — only matching targets shown. Run `prom targets --label env=prod --label region=us-east` — only targets with BOTH labels shown. Run `prom targets --label badvalue` — error message and exit code 1.

### Tests for User Story 4

> **Write these FIRST — ensure they FAIL before implementation**

- [x] T028 [US4] Write unit tests for label filter logic in `tests/targets.test.ts`: single label match, multiple labels AND logic, no match returns empty list, combinable with job/state filters
- [x] T029 [US4] Write unit tests for `--label` format validation in `tests/targets.test.ts`: valid `key=value`, missing `=` produces error, empty key produces error

### Implementation for User Story 4

- [x] T030 [US4] Extend `filterTargets()` in `src/commands/targets.ts` to accept `labels?: string[]` parameter and apply label matching (check target.labels contains all key=value pairs)
- [x] T031 [US4] Add `--label` option (repeatable) to `createTargetsCommand()` in `src/commands/targets.ts` with `key=value` format validation
- [x] T032 [US4] Wire parsed `--label` values into `filterTargets()` call in the command action in `src/commands/targets.ts`

**Checkpoint**: `prom targets --label key=value` functional. Multiple `--label` flags apply AND logic. All T028–T032 tests pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T033 [P] Run `pnpm test:run` — confirm all tests pass (target: 177+ existing + new tests)
- [x] T034 [P] Run `pnpm build` — confirm TypeScript compiles without errors
- [x] T035 Update `THOUGHTS.md` with implementation notes for feature 008

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must exist first)
- **Phase 3 (US1)**: Depends on Phase 2 (getAlerts must exist)
- **Phase 4 (US2)**: Depends on Phase 2 (getRules must exist) — can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 (csv.ts stub) + Phase 3 (alerts.ts) + Phase 4 (rules.ts) for --csv on new commands
- **Phase 6 (US4)**: Depends on Phase 1 only — fully independent of US1/US2/US3
- **Phase 7 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 complete; independent of US2/US3/US4
- **US2 (P2)**: Requires Phase 2 complete; independent of US1/US3/US4
- **US3 (P3)**: Requires Phase 2 + US1 (alerts.ts) + US2 (rules.ts) for full scope; CSV formatter itself is independent
- **US4 (P4)**: Requires Phase 1 only; fully independent of US1/US2/US3

### Parallel Opportunities

- T003 + T004 + T005 (Phase 2): getRules and csv.ts stub can run in parallel with getAlerts
- T006 + T007 (Phase 3 tests): both test files can be written in parallel
- T012 + T013 + T014 (Phase 4 tests): all rule tests can be written in parallel
- T024 + T025 (Phase 5): query.ts and query-range.ts CSV additions are independent
- T033 + T034 (Phase 7): test run and build check are independent

---

## Parallel Example: User Story 1

```bash
# Write tests in parallel (different concerns):
Task T006: "Write getAlerts() unit tests in tests/alerts.test.ts"
Task T007: "Write formatAlertsTable() unit tests in tests/alerts.test.ts"

# After tests fail (RED), implement in order:
Task T008: "Add formatAlertsTable() to src/formatters/table.ts"
Task T009: "Create src/commands/alerts.ts"        # depends on T008
Task T010: "Register in src/index.ts"             # depends on T009
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Types
2. Complete Phase 2: Foundational (T003 only — skip T004, T005 for MVP)
3. Complete Phase 3: US1 alerts command
4. **STOP and VALIDATE**: `prom alerts` works end-to-end
5. Proceed to next story

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → `prom alerts` delivered ✓
3. Phase 4 (US2) → `prom rules` delivered ✓
4. Phase 5 (US3) → CSV output on all commands ✓
5. Phase 6 (US4) → `--label` filter on targets ✓
6. Phase 7 → Polish and validate

---

## Summary

| Phase               | Story | Tasks     | Parallel?               |
| ------------------- | ----- | --------- | ----------------------- |
| 1: Setup            | —     | T001–T002 | No (sequential types)   |
| 2: Foundational     | —     | T003–T005 | T004, T005 parallel     |
| 3: US1 Alerts       | P1    | T006–T011 | T006+T007 parallel      |
| 4: US2 Rules        | P2    | T012–T019 | T012+T013+T014 parallel |
| 5: US3 CSV          | P3    | T020–T027 | T024+T025 parallel      |
| 6: US4 Label Filter | P4    | T028–T032 | No (same file)          |
| 7: Polish           | —     | T033–T035 | T033+T034 parallel      |

**Total tasks**: 35
**Suggested MVP scope**: Phase 1 + Phase 2 (T003 only) + Phase 3 = 8 tasks for `prom alerts`
