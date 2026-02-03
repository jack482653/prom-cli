# Implementation Plan: Series Command

**Branch**: `005-series` | **Date**: 2025-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-series/spec.md`

## Summary

Implement `prom series` command to query Prometheus time series using label matchers. This extends the existing CLI with the `/api/v1/series` endpoint, enabling users to discover which metric and label combinations exist in their Prometheus server. Reuses existing time-parser and Prometheus client infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022, NodeNext modules)
**Primary Dependencies**: commander (CLI), axios (HTTP)
**Storage**: N/A (uses existing config from `~/.prom-cli/config.json`)
**Testing**: vitest
**Target Platform**: Node.js 18+
**Project Type**: Single CLI project
**Performance Goals**: <2s response for typical Prometheus deployments (up to 10,000 series)
**Constraints**: Reuse existing patterns from query/query-range/labels commands
**Scale/Scope**: ~3 new files, ~250 lines of code

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle             | Status | Notes                                                              |
| --------------------- | ------ | ------------------------------------------------------------------ |
| I. Code Quality       | PASS   | Will follow existing patterns, use prettier, single responsibility |
| II. Testing (TDD/BDD) | PASS   | Tests written before implementation, BDD scenarios from spec       |
| III. UX Consistency   | PASS   | Consistent with existing commands: --json, --help, error messages  |
| IV. Performance       | PASS   | <2s goal aligns with 100ms init + network time                     |
| V. MVP First          | PASS   | P1 (label matchers) → P2 (time filter) → P3 (JSON output)          |
| VI. No Overdesign     | PASS   | Reuse existing infrastructure, no new abstractions                 |

**All gates passed. No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/005-series/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-commands.md  # CLI interface contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── commands/
│   ├── config.ts        # Existing
│   ├── query.ts         # Existing
│   ├── query-range.ts   # Existing
│   ├── labels.ts        # Existing
│   ├── status.ts        # Existing
│   ├── targets.ts       # Existing
│   └── series.ts        # NEW: Series command handler
├── services/
│   ├── config.ts        # Existing: Config file management
│   ├── prometheus.ts    # MODIFY: Add getSeries API method
│   └── time-parser.ts   # Existing: Reuse for --start/--end
├── formatters/
│   ├── table.ts         # Existing: Not used (series uses list format)
│   └── json.ts          # Existing: Reuse for JSON output
├── types/
│   └── index.ts         # MODIFY: Add SeriesOptions and SeriesResult types
└── index.ts             # MODIFY: Register series command

tests/
├── series.test.ts       # NEW: Series command tests
└── ...                  # Existing test files
```

**Structure Decision**: Single project, extends existing CLI structure. No new directories needed - follows established patterns from labels command (list output format) and query-range command (multiple arguments).

## Complexity Tracking

> No violations to justify - all gates passed.

---

## Phase 0: Research (COMPLETED)

**Status**: ✅ Complete

**Artifacts**:

- [research.md](./research.md) - Prometheus API research, architecture decisions

**Key Decisions**:

- Reuse all existing infrastructure (no new dependencies)
- Use `/api/v1/series` endpoint with `match[]` query parameters
- Follow patterns from labels and query-range commands
- Let Prometheus handle label matcher syntax validation

---

## Phase 1: Design & Contracts (COMPLETED)

**Status**: ✅ Complete

**Artifacts**:

- [data-model.md](./data-model.md) - SeriesOptions, LabelSet, SeriesResult types
- [contracts/cli-commands.md](./contracts/cli-commands.md) - CLI interface specification
- [quickstart.md](./quickstart.md) - TDD implementation guide

**Constitution Re-Check** (Post-Design):

| Principle             | Status | Notes                                                                     |
| --------------------- | ------ | ------------------------------------------------------------------------- |
| I. Code Quality       | PASS   | Data model follows existing patterns, clear separation of concerns        |
| II. Testing (TDD/BDD) | PASS   | Quickstart provides TDD workflow, acceptance scenarios mapped             |
| III. UX Consistency   | PASS   | CLI contract consistent with existing commands, error messages actionable |
| IV. Performance       | PASS   | No client-side pagination, streams results directly (simple array)        |
| V. MVP First          | PASS   | P1→P2→P3 clearly defined in quickstart                                    |
| VI. No Overdesign     | PASS   | No new abstractions, reuses time-parser, formatters, error classes        |

**All gates still passed. Ready for task generation.**

---

## Phase 2: Task Breakdown (NOT STARTED)

**Status**: ⏳ Pending - Use `/speckit.tasks` command

This phase will generate detailed tasks in `tasks.md` based on the design artifacts above.
