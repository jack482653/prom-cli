# Implementation Plan: Query Range Command

**Branch**: `003-query-range` | **Date**: 2025-01-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-query-range/spec.md`

## Summary

Add `query-range` command to prom-cli for executing Prometheus range queries over time intervals. The command will support absolute timestamps (RFC3339), relative time expressions (1h, 30m, now), and automatic step calculation for optimal data point density.

## Technical Context

**Language/Version**: Node.js 18+ with TypeScript 5.x (ESM)
**Primary Dependencies**: commander (CLI), axios (HTTP)
**Storage**: N/A (uses existing config from `~/.prom-cli/config.json`)
**Testing**: vitest
**Target Platform**: Cross-platform (macOS, Linux, Windows)
**Project Type**: Single project (existing CLI tool extension)
**Performance Goals**: Command responds within 5 seconds (excluding network)
**Constraints**: Memory-efficient for large result sets
**Scale/Scope**: Single new command, ~4 new files

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status  | Notes                                           |
| ------------------------------- | ------- | ----------------------------------------------- |
| I. Code Quality                 | ✅ Pass | Follow existing patterns in `query.ts`          |
| II. Testing Standards (TDD/BDD) | ✅ Pass | Write tests before implementation               |
| III. UX Consistency             | ✅ Pass | Same `--json` flag, consistent error messages   |
| IV. Performance                 | ✅ Pass | Uses existing axios client with timeout         |
| V. MVP First                    | ✅ Pass | P1 first (basic range query), P2/P3 incremental |
| VI. No Overdesign               | ✅ Pass | Extend existing services, no new abstractions   |

## Project Structure

### Documentation (this feature)

```text
specs/003-query-range/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── query-range-command.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── commands/
│   ├── query.ts          # Existing instant query
│   └── query-range.ts    # NEW: Range query command
├── services/
│   ├── prometheus.ts     # Extend with queryRange function
│   └── time-parser.ts    # NEW: Parse relative time expressions
├── formatters/
│   ├── table.ts          # Extend for matrix results
│   └── json.ts           # Existing (reuse)
└── types/
    └── index.ts          # Extend with QueryRangeParams

tests/
├── query-range.test.ts   # NEW: Range query command tests
└── time-parser.test.ts   # NEW: Time parsing tests
```

**Structure Decision**: Extend existing single-project structure. Add new command file, new time-parser service, and extend prometheus service with `queryRange` function.

## Complexity Tracking

No complexity violations. All additions follow existing patterns.
