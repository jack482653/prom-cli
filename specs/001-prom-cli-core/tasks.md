# Tasks: prom-cli Core

**Input**: Design documents from `/specs/001-prom-cli-core/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-commands.md

**Tests**: Deferred per Constitution Check (MVP first, tests added post-validation)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and directory structure

- [x] T001 Create project directory structure: src/commands/, src/services/, src/formatters/, src/types/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Define all TypeScript interfaces (Config, Target, QueryResult, ServerStatus) in src/types/index.ts
- [x] T003 [P] Implement table formatter with column alignment in src/formatters/table.ts
- [x] T004 [P] Implement JSON formatter in src/formatters/json.ts
- [x] T005 [P] Implement config file management (load, save, validate URL) in src/services/config.ts
- [x] T006 Implement Prometheus API client base with axios, auth headers, error interceptor in src/services/prometheus.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Prometheus Server (Priority: P1) 🎯 MVP

**Goal**: Allow users to save and view Prometheus server connection settings

**Independent Test**: Run `prom config http://localhost:9090` and verify `~/.prom-cli/config.json` is created with correct content. Run `prom config --show` to display saved settings.

### Implementation for User Story 1

- [x] T007 [US1] Implement config command handler with URL validation, auth options (-u, -p, -t), --show flag, and error messages in src/commands/config.ts
- [x] T008 [US1] Register config command in CLI entry point src/index.ts

**Checkpoint**: User Story 1 complete - users can configure server connection

---

## Phase 4: User Story 2 - List Scrape Targets (Priority: P2)

**Goal**: Display all Prometheus scrape targets with their health status

**Independent Test**: Run `prom targets` and verify table output with JOB, INSTANCE, STATE, LAST SCRAPE columns. Run `prom targets --json` for JSON output.

### Implementation for User Story 2

- [x] T009 [US2] Add getTargets() method to fetch /api/v1/targets endpoint in src/services/prometheus.ts
- [x] T010 [US2] Implement targets command handler with table/JSON output, relative time formatting in src/commands/targets.ts
- [x] T011 [US2] Register targets command in CLI entry point src/index.ts

**Checkpoint**: User Story 2 complete - users can view scrape targets

---

## Phase 5: User Story 3 - Execute Instant Query (Priority: P3)

**Goal**: Execute PromQL instant queries and display results

**Independent Test**: Run `prom query "up"` and verify vector results in table format. Run `prom query "1+1"` for scalar. Run `prom query "up" --json` for JSON output.

### Implementation for User Story 3

- [x] T012 [US3] Add query() method to POST /api/v1/query endpoint with optional time parameter in src/services/prometheus.ts
- [x] T013 [US3] Implement query command handler with vector/scalar/string output, --json and --time options in src/commands/query.ts
- [x] T014 [US3] Register query command in CLI entry point src/index.ts

**Checkpoint**: User Story 3 complete - users can execute PromQL queries

---

## Phase 6: User Story 4 - Check Server Status (Priority: P4)

**Goal**: Display Prometheus server health, readiness, and build information

**Independent Test**: Run `prom status` and verify health, ready, version info displayed. Run `prom status --json` for JSON output.

### Implementation for User Story 4

- [x] T015 [US4] Add getStatus() method to check /-/healthy, /-/ready, /api/v1/status/buildinfo in src/services/prometheus.ts
- [x] T016 [US4] Implement status command handler with key-value and JSON output in src/commands/status.ts
- [x] T017 [US4] Register status command in CLI entry point src/index.ts

**Checkpoint**: User Story 4 complete - users can check server status

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup

- [x] T018 Run quickstart.md validation checklist (all 12 items)
- [x] T019 Run `pnpm format` to ensure code style consistency

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational completion
- **Polish (Phase 7)**: Depends on all user stories complete

### Task Dependencies within Phases

**Phase 2 (Foundational)**:

```
T002 (types) ──┬──> T003 (table formatter) [P]
               ├──> T004 (json formatter) [P]
               ├──> T005 (config service) [P]
               └──> T006 (prometheus service) ──> depends on T005
```

**Each User Story Phase**:

```
Service method ──> Command handler ──> Register in CLI
```

### Parallel Opportunities

**After T002 completes:**

```bash
# These can run in parallel:
Task: "T003 Implement table formatter"
Task: "T004 Implement JSON formatter"
Task: "T005 Implement config service"
```

**After Foundational completes (if team capacity allows):**

```bash
# User stories can be worked on in parallel by different developers:
Developer A: US1 (T007-T008)
Developer B: US2 (T009-T011)
Developer C: US3 (T012-T014)
Developer D: US4 (T015-T017)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Configure Server
4. **STOP and VALIDATE**: Test `prom config` independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (config) → Test → **MVP Release**
3. Add US2 (targets) → Test → Release
4. Add US3 (query) → Test → Release
5. Add US4 (status) → Test → Release

### Single Developer Strategy (Recommended)

Execute in strict order: T001 → T002 → T003-T005 (parallel) → T006 → T007-T008 → T009-T011 → T012-T014 → T015-T017 → T018-T019

---

## Task Summary

| Phase        | Count  | Description                 |
| ------------ | ------ | --------------------------- |
| Setup        | 1      | Directory structure         |
| Foundational | 5      | Types, services, formatters |
| US1 (P1)     | 2      | Config command              |
| US2 (P2)     | 3      | Targets command             |
| US3 (P3)     | 3      | Query command               |
| US4 (P4)     | 3      | Status command              |
| Polish       | 2      | Validation & formatting     |
| **Total**    | **19** |                             |

---

## Notes

- All exit codes defined in contracts/cli-commands.md
- Error messages defined in contracts/cli-commands.md
- Table output format defined in spec.md
- Entity definitions in data-model.md
- Commit after each task or logical group
