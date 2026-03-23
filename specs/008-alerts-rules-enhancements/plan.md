# Implementation Plan: Alerts, Rules, CSV Output & Target Label Filter

**Branch**: `008-alerts-rules-enhancements` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-alerts-rules-enhancements/spec.md`

## Summary

Add `prom alerts` and `prom rules` commands for AI-agent incident investigation, add `--csv` output to all tabular commands, and add `--label key=value` filter to `prom targets`. All new commands follow existing patterns (commander factory functions, axios API client, table/JSON/CSV formatters).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+, ES2022, NodeNext modules
**Primary Dependencies**: commander ^14, axios ^1 (no new dependencies needed)
**Storage**: N/A (stateless CLI)
**Testing**: vitest ^4, TDD/BDD approach
**Target Platform**: macOS/Linux terminal
**Project Type**: Single project
**Performance Goals**: Command initialization < 100ms; API timeout default 30s
**Constraints**: No new npm dependencies unless unavoidable; RFC 4180 CSV without external lib

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle             | Status | Notes                                                                  |
| --------------------- | ------ | ---------------------------------------------------------------------- |
| I. Code Quality       | PASS   | Follow existing patterns; single-responsibility functions              |
| II. Testing Standards | PASS   | TDD: tests written before implementation; BDD scenarios from spec      |
| III. UX Consistency   | PASS   | `--csv` added consistently; error messages follow existing format      |
| IV. Performance       | PASS   | No blocking operations added; same axios client                        |
| V. MVP First          | PASS   | P1 (alerts) → P2 (rules) → P3 (csv) → P4 (label filter) order          |
| VI. No Overdesign     | PASS   | No new abstractions; CSV formatter is ~15 lines; reuse filterTargets() |

**Post-design re-check**: All principles still pass. CSV formatter is a pure function with no external deps. Label filtering extends existing `filterTargets()` without overabstraction.

## Project Structure

### Documentation (this feature)

```text
specs/008-alerts-rules-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli-commands.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── index.ts                  # Register alerts + rules commands
├── commands/
│   ├── alerts.ts             # NEW: createAlertsCommand()
│   ├── rules.ts              # NEW: createRulesCommand()
│   ├── targets.ts            # MODIFY: add --label, --csv
│   ├── query.ts              # MODIFY: add --csv
│   └── query-range.ts        # MODIFY: add --csv
├── formatters/
│   ├── csv.ts                # NEW: formatCsv(), escapeCsvField()
│   └── table.ts              # MODIFY: add formatAlertsTable(), formatRulesTable()
├── services/
│   └── prometheus.ts         # MODIFY: add getAlerts(), getRules()
└── types/
    └── index.ts              # MODIFY: add Alert, Rule, RuleGroup types

tests/
├── alerts.test.ts            # NEW
├── rules.test.ts             # NEW
├── csv-formatter.test.ts     # NEW
└── targets.test.ts           # MODIFY: add label filter tests
```

**Structure Decision**: Single project, extending existing layout. No new directories beyond `contracts/` in specs.
