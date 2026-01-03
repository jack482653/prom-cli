# Tasks: Query Range Command

**Input**: Design documents from `/specs/003-query-range/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD/BDD approach per constitution - tests written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: This feature extends existing project - no new setup needed.

_No tasks required - project structure already exists._

---

## Phase 2: Foundational (Shared Types & Services)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 [P] Add QueryRangeParams interface in src/types/index.ts
- [ ] T002 [P] Add QueryRangeResult interface in src/types/index.ts
- [ ] T003 [P] Add QueryRangeOptions interface in src/types/index.ts
- [ ] T004 Write tests for queryRange function in tests/prometheus.test.ts (expect FAIL)
- [ ] T005 Implement queryRange function in src/services/prometheus.ts
- [ ] T006 Add formatMatrixTable function tests in tests/formatters.test.ts (expect FAIL)
- [ ] T007 Implement formatMatrixTable in src/formatters/table.ts

**Checkpoint**: Foundation ready - types defined, queryRange API working, matrix formatter ready.

---

## Phase 3: User Story 1 - Basic Range Query (Priority: P1) 🎯 MVP

**Goal**: Users can execute range queries with absolute timestamps (RFC3339) and see matrix results.

**Independent Test**: `prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z" --step 60`

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Write command integration tests in tests/query-range.test.ts (expect FAIL)
- [ ] T009 [P] [US1] Write validation tests for time range in tests/query-range.test.ts (expect FAIL)

### Implementation for User Story 1

- [ ] T010 [US1] Create query-range command skeleton in src/commands/query-range.ts
- [ ] T011 [US1] Add --start, --end, --step, --json options to command in src/commands/query-range.ts
- [ ] T012 [US1] Implement RFC3339 timestamp parsing and validation in src/commands/query-range.ts
- [ ] T013 [US1] Connect command to queryRange service in src/commands/query-range.ts
- [ ] T014 [US1] Implement table output for matrix results in src/commands/query-range.ts
- [ ] T015 [US1] Implement JSON output mode in src/commands/query-range.ts
- [ ] T016 [US1] Add error handling for invalid time range (start >= end) in src/commands/query-range.ts
- [ ] T017 [US1] Register query-range command in src/index.ts
- [ ] T018 [US1] Run tests - verify T008, T009 now PASS

**Checkpoint**: User Story 1 complete - range query with absolute timestamps works independently.

---

## Phase 4: User Story 2 - Relative Time Ranges (Priority: P2)

**Goal**: Users can query using relative time expressions (1h, 30m, now) instead of absolute timestamps.

**Independent Test**: `prom query-range "up" --start "1h" --end "now"`

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T019 [P] [US2] Write time-parser unit tests in tests/time-parser.test.ts (expect FAIL)
- [ ] T020 [P] [US2] Write relative time integration tests in tests/query-range.test.ts (expect FAIL)

### Implementation for User Story 2

- [ ] T021 [P] [US2] Add TimeParseResult interface in src/types/index.ts
- [ ] T022 [US2] Create time-parser service skeleton in src/services/time-parser.ts
- [ ] T023 [US2] Implement parseTimeExpression function for "now" in src/services/time-parser.ts
- [ ] T024 [US2] Implement relative duration parsing (Ns, Nm, Nh, Nd) in src/services/time-parser.ts
- [ ] T025 [US2] Implement RFC3339 passthrough detection in src/services/time-parser.ts
- [ ] T026 [US2] Add invalid format error messages in src/services/time-parser.ts
- [ ] T027 [US2] Integrate time-parser into query-range command in src/commands/query-range.ts
- [ ] T028 [US2] Run tests - verify T019, T020 now PASS

**Checkpoint**: User Story 2 complete - relative time expressions work independently.

---

## Phase 5: User Story 3 - Default Step Calculation (Priority: P3)

**Goal**: When step is not provided, system calculates a sensible default based on time range (~200 data points).

**Independent Test**: `prom query-range "up" --start "1h" --end "now"` (no --step flag)

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T029 [P] [US3] Write calculateDefaultStep unit tests in tests/time-parser.test.ts (expect FAIL)
- [ ] T030 [P] [US3] Write default step integration tests in tests/query-range.test.ts (expect FAIL)

### Implementation for User Story 3

- [ ] T031 [US3] Implement calculateDefaultStep function in src/services/time-parser.ts
- [ ] T032 [US3] Make --step parameter optional in src/commands/query-range.ts
- [ ] T033 [US3] Integrate calculateDefaultStep when step not provided in src/commands/query-range.ts
- [ ] T034 [US3] Add warning for step larger than time range in src/commands/query-range.ts
- [ ] T035 [US3] Run tests - verify T029, T030 now PASS

**Checkpoint**: User Story 3 complete - default step calculation works independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T036 [P] Add large result warning (1500+ data points) in src/commands/query-range.ts
- [ ] T037 [P] Add empty result "No data" message in src/commands/query-range.ts
- [ ] T038 Run all tests with `pnpm test:run`
- [ ] T039 Run format check with `pnpm format:check`
- [ ] T040 Run build with `pnpm build`
- [ ] T041 Run quickstart.md manual validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - project exists
- **Foundational (Phase 2)**: No dependencies - types and shared services
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (builds on command)
- **User Story 3 (Phase 5)**: Depends on User Story 2 (uses time-parser)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational)
    │
    ▼
Phase 3 (US1: Basic Range Query) ──▶ MVP Checkpoint
    │
    ▼
Phase 4 (US2: Relative Time)
    │
    ▼
Phase 5 (US3: Default Step)
    │
    ▼
Phase 6 (Polish)
```

### Within Each Phase

1. Tests MUST be written and FAIL before implementation (TDD)
2. Types before services
3. Services before commands
4. Run tests to verify PASS after implementation

### Parallel Opportunities

- **Phase 2**: T001, T002, T003 can run in parallel (different types)
- **Phase 3**: T008, T009 can run in parallel (different test scenarios)
- **Phase 4**: T019, T020 can run in parallel; T021 can run parallel with tests
- **Phase 5**: T029, T030 can run in parallel
- **Phase 6**: T036, T037 can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch type definitions together:
Task: "Add QueryRangeParams interface in src/types/index.ts"
Task: "Add QueryRangeResult interface in src/types/index.ts"
Task: "Add QueryRangeOptions interface in src/types/index.ts"

# Then write tests (must fail first):
Task: "Write tests for queryRange function in tests/prometheus.test.ts"

# Then implement:
Task: "Implement queryRange function in src/services/prometheus.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types, queryRange, formatter)
2. Complete Phase 3: User Story 1 (absolute timestamps)
3. **STOP and VALIDATE**: Test with `prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z" --step 60`
4. Deploy/demo if ready

### Incremental Delivery

1. Foundational → Basic types and API ready
2. User Story 1 → Absolute timestamps work (MVP!)
3. User Story 2 → Relative time expressions work
4. User Story 3 → Default step calculation works
5. Polish → Warnings, empty states, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story builds on previous but adds distinct functionality
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
