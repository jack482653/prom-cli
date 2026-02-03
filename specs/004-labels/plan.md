# Implementation Plan: Labels Command

**Branch**: `004-labels` | **Date**: 2025-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-labels/spec.md`

## Summary

Implement `prom labels` command to list Prometheus label names and values. This extends the existing CLI with two API endpoints: `/api/v1/labels` for listing all label names, and `/api/v1/label/<name>/values` for listing values of a specific label. Reuses existing time-parser and Prometheus client infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022, NodeNext modules)
**Primary Dependencies**: commander (CLI), axios (HTTP)
**Storage**: N/A (uses existing config from `~/.prom-cli/config.json`)
**Testing**: vitest
**Target Platform**: Node.js 18+
**Project Type**: Single CLI project
**Performance Goals**: <2s response for typical Prometheus deployments
**Constraints**: Reuse existing patterns from query/query-range commands
**Scale/Scope**: ~3 new files, ~200 lines of code

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle             | Status | Notes                                                              |
| --------------------- | ------ | ------------------------------------------------------------------ |
| I. Code Quality       | PASS   | Will follow existing patterns, use prettier, single responsibility |
| II. Testing (TDD/BDD) | PASS   | Tests written before implementation, BDD scenarios from spec       |
| III. UX Consistency   | PASS   | Consistent with existing commands: --json, --help, error messages  |
| IV. Performance       | PASS   | <2s goal aligns with 100ms init + network time                     |
| V. MVP First          | PASS   | P1 (list names) → P2 (list values) → P3 (time filter)              |
| VI. No Overdesign     | PASS   | Reuse existing infrastructure, no new abstractions                 |

**All gates passed. No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/004-labels/
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
│   ├── status.ts        # Existing
│   ├── targets.ts       # Existing
│   └── labels.ts        # NEW: Labels command handler
├── services/
│   ├── config.ts        # Existing: Config file management
│   ├── prometheus.ts    # MODIFY: Add labels/labelValues API methods
│   └── time-parser.ts   # Existing: Reuse for --start/--end
├── formatters/
│   ├── table.ts         # Existing: Reuse for table output
│   └── json.ts          # Existing: Reuse for JSON output
├── types/
│   └── index.ts         # MODIFY: Add LabelsOptions type
└── index.ts             # MODIFY: Register labels command

tests/
├── labels.test.ts       # NEW: Labels command tests
└── ...                  # Existing test files
```

**Structure Decision**: Single project, extends existing CLI structure. No new directories needed - follows established patterns.

## Complexity Tracking

> No violations to justify - all gates passed.
