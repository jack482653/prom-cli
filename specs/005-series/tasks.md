# Tasks: Series Command

**Input**: Design documents from `/specs/005-series/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-commands.md

**Tests**: TDD approach per constitution (Principle II). Tests written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Infrastructure)

**Purpose**: Add type definitions and API methods needed by all user stories

- [x] T001 [P] Add SeriesOptions interface to src/types/index.ts
- [x] T002 [P] Add LabelSet type to src/types/index.ts
- [x] T003 Add getSeries() function to src/services/prometheus.ts

**Checkpoint**: API layer ready - command implementation can begin

---

## Phase 2: User Story 1 - Query Time Series by Label Matchers (Priority: P1) 🎯 MVP

**Goal**: Users can run `prom series 'up'` or `prom series '{job="prometheus"}'` to query time series matching label selectors

**Independent Test**: Run `prom series 'up'` and verify it returns matching time series from connected server

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [P] [US1] Test getSeries() with single matcher in tests/series.test.ts
- [x] T005 [P] [US1] Test getSeries() with multiple matchers in tests/series.test.ts
- [x] T006 [P] [US1] Test getSeries() handles empty results in tests/series.test.ts
- [x] T007 [P] [US1] Test getSeries() handles Prometheus errors in tests/series.test.ts
- [x] T008 [P] [US1] Test seriesCommand() requires at least one matcher in tests/series.test.ts
- [x] T009 [P] [US1] Test seriesCommand() outputs human-readable list format in tests/series.test.ts
- [x] T010 [P] [US1] Test seriesCommand() shows error when no config in tests/series.test.ts

### Implementation for User Story 1

- [x] T011 [US1] Create series command handler in src/commands/series.ts
- [x] T012 [US1] Implement variadic arguments handling for matchers in src/commands/series.ts
- [x] T013 [US1] Implement list output format showing label sets in src/commands/series.ts
- [x] T014 [US1] Add error handling for missing matchers in src/commands/series.ts
- [x] T015 [US1] Add error handling for no config and connection failures in src/commands/series.ts
- [x] T016 [US1] Add error handling for invalid matcher syntax in src/commands/series.ts
- [x] T017 [US1] Register series command in src/index.ts

**Checkpoint**: `prom series 'up'` and `prom series '{job="prometheus"}'` work. MVP complete.

---

## Phase 3: User Story 2 - Filter Series by Time Range (Priority: P2)

**Goal**: Users can filter series by time range using --start and --end options

**Independent Test**: Run `prom series 'up' --start 1h --end now` and verify time-scoped results

### Tests for User Story 2

- [x] T018 [P] [US2] Test getSeries() accepts start/end parameters in tests/series.test.ts
- [x] T019 [P] [US2] Test parseTimeRange() parses RFC3339 format in tests/series.test.ts
- [x] T020 [P] [US2] Test parseTimeRange() parses relative format in tests/series.test.ts
- [x] T021 [P] [US2] Test parseTimeRange() validates start < end in tests/series.test.ts
- [x] T022 [P] [US2] Test parseTimeRange() throws InvalidTimeExpressionError in tests/series.test.ts
- [x] T023 [P] [US2] Test parseTimeRange() throws InvalidTimeRangeError in tests/series.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Add --start and --end options to series command in src/commands/series.ts
- [x] T025 [US2] Implement parseTimeRange() helper function in src/commands/series.ts
- [x] T026 [US2] Add InvalidTimeExpressionError class in src/commands/series.ts
- [x] T027 [US2] Add InvalidTimeRangeError class in src/commands/series.ts
- [x] T028 [US2] Integrate time-parser.ts for parsing time expressions in src/commands/series.ts
- [x] T029 [US2] Pass start/end timestamps to getSeries() in src/commands/series.ts
- [x] T030 [US2] Add time range validation error handling in src/commands/series.ts

**Checkpoint**: `prom series 'up' --start 1h --end now` works. Stories 1 and 2 complete.

---

## Phase 4: User Story 3 - JSON Output for Scripting (Priority: P3)

**Goal**: Users can output series data in JSON format for scripting and automation

**Independent Test**: Run `prom series 'up' --json` and verify output is valid JSON parseable by jq

### Tests for User Story 3

- [x] T031 [P] [US3] Test seriesCommand() outputs valid JSON with --json in tests/series.test.ts
- [x] T032 [P] [US3] Test JSON output is array of label set objects in tests/series.test.ts
- [x] T033 [P] [US3] Test JSON output for empty results in tests/series.test.ts

### Implementation for User Story 3

- [x] T034 [US3] Add --json option to series command in src/commands/series.ts
- [x] T035 [US3] Implement JSON output format using formatJson() in src/commands/series.ts
- [x] T036 [US3] Ensure JSON output is pretty-printed in src/commands/series.ts

**Checkpoint**: All user stories complete. Full feature ready.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T037 Run all tests and ensure they pass with pnpm test
- [x] T038 Run build and ensure it compiles with pnpm build
- [x] T039 Format code with pnpm format
- [x] T040 Validate quickstart.md examples work correctly
- [x] T041 Update THOUGHTS.md with implementation notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (US1)**: Depends on Phase 1 completion
- **Phase 3 (US2)**: Depends on Phase 2 completion (extends series command with time options)
- **Phase 4 (US3)**: Depends on Phase 2 completion (adds JSON output to series command)
- **Phase 5 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core functionality - required for US2 and US3
- **User Story 2 (P2)**: Extends US1 with time filtering - can start after US1
- **User Story 3 (P3)**: Extends US1 with JSON output - can start after US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- API functions (getSeries) before command handler
- Core implementation before output formatting
- Error handling integrated throughout
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:

```bash
# T001 and T002 can run in parallel (different type additions)
Task: T001 [P] Add SeriesOptions interface
Task: T002 [P] Add LabelSet type
```

**Phase 2 (US1 Tests)**:

```bash
# All US1 tests can run in parallel
Task: T004 [P] Test getSeries() with single matcher
Task: T005 [P] Test getSeries() with multiple matchers
Task: T006 [P] Test getSeries() handles empty results
Task: T007 [P] Test getSeries() handles Prometheus errors
Task: T008 [P] Test seriesCommand() requires at least one matcher
Task: T009 [P] Test seriesCommand() outputs human-readable list
Task: T010 [P] Test seriesCommand() shows error when no config
```

**Phase 3 (US2 Tests)**:

```bash
# All US2 tests can run in parallel
Task: T018 [P] Test getSeries() accepts start/end parameters
Task: T019 [P] Test parseTimeRange() parses RFC3339 format
Task: T020 [P] Test parseTimeRange() parses relative format
Task: T021 [P] Test parseTimeRange() validates start < end
Task: T022 [P] Test parseTimeRange() throws InvalidTimeExpressionError
Task: T023 [P] Test parseTimeRange() throws InvalidTimeRangeError
```

**Phase 4 (US3 Tests)**:

```bash
# All US3 tests can run in parallel
Task: T031 [P] Test seriesCommand() outputs valid JSON
Task: T032 [P] Test JSON output is array of label sets
Task: T033 [P] Test JSON output for empty results
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 (T004-T017)
3. **STOP and VALIDATE**: Test `prom series 'up'` and `prom series '{job="prometheus"}'`
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → API layer ready
2. Add User Story 1 → `prom series` works → MVP!
3. Add User Story 2 → Time filtering works
4. Add User Story 3 → JSON output works
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files or independent test cases
- [Story] label maps task to specific user story for traceability
- Reuse existing `time-parser.ts` for US2 (no new time parsing code)
- Follow existing patterns from `labels.ts` (list output) and `query-range.ts` (variadic args)
- Commit after each task per constitution (Git Commit Standards v1.2.0)
- getSeries() uses axios params option for query parameters (consistent with labels/query-range)
- Error classes follow patterns from labels command (InvalidTimeExpressionError, InvalidTimeRangeError)
