# Implementation Plan: Targets Filter

**Branch**: `006-targets-filter` | **Date**: 2025-02-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-targets-filter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add `--job` and `--state` filtering options to the `prom targets` command. Users can filter targets by job name and/or health state (up/down) to reduce information overload when managing many scrape targets. Filtering is performed client-side on the full target list returned from Prometheus API.

**Technical Approach**: Extend existing `targets.ts` command with optional filter parameters, apply filters after fetching all targets from API, maintain existing output formats (table/JSON).

## Technical Context

**Language/Version**: TypeScript 5.x with ES2022 (NodeNext modules)
**Primary Dependencies**: commander (CLI), axios (HTTP client)
**Storage**: N/A (stateless CLI)
**Testing**: vitest with mocked axios instances
**Target Platform**: Node.js 18+ CLI application
**Project Type**: Single project (CLI tool)
**Performance Goals**: Filter 1000 targets in under 2 seconds (client-side filtering)
**Constraints**: Must maintain backward compatibility with existing `prom targets` behavior
**Scale/Scope**: ~150 lines of code (modify 1 file, add 1 test file)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Code Quality

✅ **PASS** - Single responsibility: filtering logic will be extracted to separate function
✅ **PASS** - Descriptive names: `filterTargets`, `job`, `state` are self-documenting
✅ **PASS** - No magic strings: health states validated against type union
✅ **PASS** - No duplication: reuses existing table/JSON formatters

### Principle II: Testing Standards (TDD/BDD)

✅ **PASS** - Tests will be written before implementation
✅ **PASS** - Acceptance scenarios from spec will drive test design
✅ **PASS** - Tests will use Given/When/Then pattern for filtering behavior
✅ **PASS** - Happy path and error cases will be tested

### Principle III: User Experience Consistency

✅ **PASS** - Help text will document new `--job` and `--state` options
✅ **PASS** - Error messages for invalid state values will be actionable
✅ **PASS** - Output format remains consistent (reuses existing formatters)
✅ **PASS** - Exit codes follow convention (0 for success, 1 for errors)

### Principle IV: Performance Requirements

✅ **PASS** - Filtering 1000 targets client-side is well under 2s requirement
✅ **PASS** - API timeout remains configurable via existing config
✅ **PASS** - Memory stable (no additional buffering needed)
✅ **PASS** - Network errors handled by existing `handleError` function

### Principle V: MVP First

✅ **PASS** - Feature delivers value independently (filter targets without other changes)
✅ **PASS** - P1 (job filter) can be implemented and tested before P2 (state filter)
✅ **PASS** - Feature is "done" when filtering works, no over-engineering

### Principle VI: No Overdesign

✅ **PASS** - No premature abstractions (simple filter function)
✅ **PASS** - No "just in case" configuration (only required --job and --state options)
✅ **PASS** - Simple client-side filtering (no complex query DSL)

**Constitution Status**: ✅ ALL GATES PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/006-targets-filter/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── cli-commands.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── commands/
│   └── targets.ts       # MODIFIED: Add filter options and logic
├── services/
│   └── prometheus.ts    # UNCHANGED: API calls remain the same
├── formatters/
│   └── table.ts         # UNCHANGED: Reuse existing formatters
└── types/
    └── index.ts         # MODIFIED: Add TargetsOptions interface with filter fields

tests/
└── targets.test.ts      # NEW: Add filter tests (Given/When/Then scenarios)
```

**Structure Decision**: Single project structure (Option 1). This is a CLI tool with no frontend/backend separation. All source code lives under `src/` with tests in `tests/`. The targets filter only modifies one command file and adds corresponding tests.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations. This feature is straightforward client-side filtering with no complexity concerns.

## Phase 0: Research

### Technology Decisions

#### Client-side vs Server-side Filtering

**Decision**: Client-side filtering

**Rationale**:

- Prometheus `/api/v1/targets` API does not support query parameters for filtering
- Typical target counts (< 1000) make client-side filtering performant
- Simpler implementation without server-side query language
- Consistent with existing command pattern (fetch all, then transform)

**Alternatives Considered**:

- Server-side filtering: Not supported by Prometheus API
- Multiple API calls: Would increase latency and complexity

#### Filter Logic Implementation

**Decision**: Simple array filter with exact matching

**Rationale**:

- Job names require exact match (case-sensitive per Prometheus standard)
- Health state is enum ("up" | "down") - no fuzzy matching needed
- AND logic for combined filters is straightforward
- Array.filter() is idiomatic TypeScript

**Alternatives Considered**:

- Regex matching: Out of scope per spec (exact match only)
- Query DSL: Over-engineering for two simple filters

#### Error Handling Strategy

**Decision**: Reuse existing error handling pattern

**Rationale**:

- Existing commands use `handleError(error, config.serverUrl)` pattern
- Validation errors (invalid state) should use descriptive console.error + exit(1)
- Empty results are not errors (display message, exit 0)
- Consistent with CLI UX principles

**Alternatives Considered**:

- Custom error classes: Not needed for simple validation
- Warning messages: Empty results are expected, not errors

### Best Practices

#### TypeScript Filter Functions

```typescript
// Type-safe filter function with narrow return type
function filterTargets(
  targets: Target[],
  options: { job?: string; state?: "up" | "down" },
): Target[] {
  return targets.filter((target) => {
    if (options.job && target.job !== options.job) return false;
    if (options.state && target.health !== options.state) return false;
    return true;
  });
}
```

#### Commander.js Option Validation

```typescript
// Validate state option before action
.option('-s, --state <state>', 'Filter by health state (up or down)')
.action(async (options: TargetsOptions) => {
  if (options.state && !['up', 'down'].includes(options.state)) {
    console.error('Error: --state must be "up" or "down"');
    process.exit(1);
  }
  // ... rest of action
});
```

#### Test Structure (BDD Pattern)

```typescript
describe("targets command with filters", () => {
  describe("Given targets with multiple jobs", () => {
    it("When user filters by job, Then returns only matching targets", async () => {
      // Arrange, Act, Assert
    });
  });
});
```

## Phase 1: Design

### Data Model

See [data-model.md](data-model.md) for detailed entity definitions.

**Key Changes**:

- Extend `TargetsOptions` interface with `job?: string` and `state?: 'up' | 'down'`
- No changes to `Target` interface (already has job and health fields)

### API Contracts

See [contracts/cli-commands.md](contracts/cli-commands.md) for command specifications.

**Key Changes**:

- Add `--job <name>` option to `prom targets`
- Add `--state <up|down>` option to `prom targets`
- Maintain existing `--json` option compatibility

### Implementation Guide

See [quickstart.md](quickstart.md) for step-by-step implementation instructions.

**Key Steps**:

1. Write failing tests for filter scenarios
2. Add filter options to command definition
3. Implement filterTargets() function
4. Validate state option
5. Apply filters before output formatting
6. Verify tests pass

## Post-Phase 1 Constitution Recheck

_Re-evaluate after data model and contracts are defined_

### Design Artifacts Generated

✅ **research.md**: Technology decisions and best practices documented
✅ **data-model.md**: TargetsOptions extended, filter logic defined
✅ **contracts/cli-commands.md**: CLI interface fully specified
✅ **quickstart.md**: TDD implementation guide with 8 phases

### Re-evaluation Results

✅ **Code Quality**: Filter function has single responsibility (filtering only)

- filterTargets() is a pure function with clear inputs/outputs
- No magic strings (state enum, error messages as constants)
- Reuses existing formatters and error handlers

✅ **Testing Standards**: Test structure follows BDD Given/When/Then pattern

- 8 unit test scenarios for filterTargets()
- Integration tests with mocked Prometheus API
- Manual verification checklist included

✅ **UX Consistency**: Help text and error messages are clear and actionable

- Help text documents both new options
- Error message for invalid state is specific: "must be 'up' or 'down'"
- Empty results message distinguishes "no targets" vs "no matches"

✅ **Performance**: Client-side filtering is efficient for target scale

- O(n) complexity acceptable for n < 1000
- Benchmark expectations documented (< 0.1ms for 1000 targets)
- No performance bottlenecks identified

✅ **MVP First**: Feature delivers independently, no dependencies

- Can be implemented incrementally (P1: job, P2: state, P3: combined)
- Each phase deliverable and testable independently
- No blocking dependencies on other features

✅ **No Overdesign**: Simple filter function, no premature abstractions

- No query DSL or complex pattern matching
- No caching or optimization (not needed for this scale)
- Two options only (no "just in case" configuration)

**Final Status**: ✅ ALL GATES PASSED - Ready for Phase 2 (task generation)

## Next Steps

1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.implement` to execute tasks with TDD workflow
3. Create PR after all tests pass

## Notes

- This feature is purely additive (new options) - zero breaking changes
- Existing tests remain valid (no filters = show all targets)
- Filter logic is isolated and testable independently
- Performance is not a concern for typical target counts (< 1000)
