# Tasks: Labels Command

**Input**: Design documents from `/specs/004-labels/`
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

- [x] T001 [P] Add LabelsOptions interface to src/types/index.ts
- [x] T002 [P] Add LabelsResult type to src/types/index.ts
- [x] T003 Add getLabels() function to src/services/prometheus.ts
- [x] T004 Add getLabelValues(labelName) function to src/services/prometheus.ts

**Checkpoint**: API layer ready - command implementation can begin

---

## Phase 2: User Story 1 - List All Label Names (Priority: P1) 🎯 MVP

**Goal**: Users can run `prom labels` to list all available label names from Prometheus

**Independent Test**: Run `prom labels` and verify it returns label names from connected server

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Test getLabels() returns label names array in tests/labels.test.ts
- [x] T006 [P] [US1] Test labels command outputs list format in tests/labels.test.ts
- [x] T007 [P] [US1] Test labels command outputs JSON format with --json in tests/labels.test.ts
- [x] T008 [P] [US1] Test labels command shows error when no config in tests/labels.test.ts

### Implementation for User Story 1

- [x] T009 [US1] Create labels command handler in src/commands/labels.ts
- [x] T010 [US1] Implement list output format for label names in src/commands/labels.ts
- [x] T011 [US1] Implement JSON output format for label names in src/commands/labels.ts
- [x] T012 [US1] Add error handling for no config and connection failures in src/commands/labels.ts
- [x] T013 [US1] Register labels command in src/index.ts

**Checkpoint**: `prom labels` works with list and JSON output. MVP complete.

---

## Phase 3: User Story 2 - List Values for Specific Label (Priority: P2)

**Goal**: Users can run `prom labels job` to list all values for the "job" label

**Independent Test**: Run `prom labels job` and verify it returns values for that label

### Tests for User Story 2

- [x] T014 [P] [US2] Test getLabelValues() returns values array in tests/labels.test.ts
- [x] T015 [P] [US2] Test labels command with label argument outputs values in tests/labels.test.ts
- [x] T016 [P] [US2] Test labels command with label argument outputs JSON with --json in tests/labels.test.ts
- [x] T017 [P] [US2] Test labels command handles empty results for nonexistent label in tests/labels.test.ts

### Implementation for User Story 2

- [x] T018 [US2] Add label_name argument handling to src/commands/labels.ts
- [x] T019 [US2] Implement list output format for label values in src/commands/labels.ts
- [x] T020 [US2] Implement JSON output format for label values in src/commands/labels.ts
- [x] T021 [US2] Add empty result message for label values in src/commands/labels.ts

**Checkpoint**: `prom labels <label_name>` works. Stories 1 and 2 complete.

---

## Phase 4: User Story 3 - Filter by Time Range (Priority: P3)

**Goal**: Users can filter labels/values by time range using --start and --end options

**Independent Test**: Run `prom labels --start 1h --end now` and verify time-scoped results

### Tests for User Story 3

- [x] T022 [P] [US3] Test getLabels() accepts start/end parameters in tests/labels.test.ts
- [x] T023 [P] [US3] Test getLabelValues() accepts start/end parameters in tests/labels.test.ts
- [x] T024 [P] [US3] Test time parsing integration (RFC3339 and relative) in tests/labels.test.ts
- [x] T025 [P] [US3] Test invalid time range error handling in tests/labels.test.ts

### Implementation for User Story 3

- [x] T026 [US3] Add --start and --end options to labels command in src/commands/labels.ts
- [x] T027 [US3] Integrate time-parser.ts for parsing time expressions in src/commands/labels.ts
- [x] T028 [US3] Pass start/end timestamps to API functions in src/commands/labels.ts
- [x] T029 [US3] Add time range validation (start < end) in src/commands/labels.ts

**Checkpoint**: All user stories complete. Full feature ready.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T030 Run all tests and ensure they pass
- [x] T031 Validate quickstart.md examples work correctly
- [x] T032 Update THOUGHTS.md with implementation notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (US1)**: Depends on Phase 1 completion
- **Phase 3 (US2)**: Depends on Phase 2 completion (extends labels command)
- **Phase 4 (US3)**: Depends on Phase 2 completion (adds time options)
- **Phase 5 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core functionality - required for US2 and US3
- **User Story 2 (P2)**: Extends US1 with label argument - can start after US1
- **User Story 3 (P3)**: Adds time filtering to both US1 and US2 - can start after US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- API functions before command handler
- Core implementation before output formatting
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:

```bash
# T001 and T002 can run in parallel (different type additions)
Task: T001 [P] Add LabelsOptions interface
Task: T002 [P] Add LabelsResult type
```

**Phase 2 (US1 Tests)**:

```bash
# All US1 tests can run in parallel
Task: T005 [P] Test getLabels() returns label names
Task: T006 [P] Test labels command outputs list format
Task: T007 [P] Test labels command outputs JSON format
Task: T008 [P] Test labels command shows error when no config
```

**Phase 3 (US2 Tests)**:

```bash
# All US2 tests can run in parallel
Task: T014 [P] Test getLabelValues() returns values array
Task: T015 [P] Test labels command with label argument
Task: T016 [P] Test labels command with --json for values
Task: T017 [P] Test empty results handling
```

**Phase 4 (US3 Tests)**:

```bash
# All US3 tests can run in parallel
Task: T022 [P] Test getLabels() with start/end
Task: T023 [P] Test getLabelValues() with start/end
Task: T024 [P] Test time parsing integration
Task: T025 [P] Test invalid time range error
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: User Story 1 (T005-T013)
3. **STOP and VALIDATE**: Test `prom labels` and `prom labels --json`
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → API layer ready
2. Add User Story 1 → `prom labels` works → MVP!
3. Add User Story 2 → `prom labels <name>` works
4. Add User Story 3 → Time filtering works
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files or independent test cases
- [Story] label maps task to specific user story for traceability
- Reuse existing `time-parser.ts` for US3 (no new time parsing code)
- Follow existing patterns in prometheus.ts and commands/\*.ts
- Commit after each task per constitution (Git Commit Standards v1.2.0)
