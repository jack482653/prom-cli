# Research: Targets Filter

**Feature Branch**: `006-targets-filter`
**Date**: 2025-02-03

## Technology Decisions

### Client-side vs Server-side Filtering

**Decision**: Client-side filtering

**Rationale**:

- The Prometheus `/api/v1/targets` API endpoint does not support query parameters for filtering targets by job or state
- Client-side filtering is performant for typical target counts (< 1000 targets)
- Simpler implementation without requiring custom server-side query language
- Consistent with existing command patterns in prom-cli (fetch all data, then transform locally)
- Filtering 1000 targets in JavaScript is sub-millisecond operation

**Alternatives Considered**:

- **Server-side filtering**: Not supported by Prometheus HTTP API. Would require custom Prometheus build or proxy service.
- **Multiple API calls**: No benefit since API returns all targets in single call. Would only add latency.
- **Streaming/pagination**: API doesn't support pagination. Not needed for typical target counts.

### Filter Logic Implementation

**Decision**: Simple Array.filter() with exact string matching

**Rationale**:

- TypeScript's `Array.filter()` is idiomatic and performant
- Job name matching requires exact match (case-sensitive) per Prometheus conventions
- Health state is enumerated type ("up" | "down" | "unknown") - no fuzzy matching needed
- AND logic for combined filters (`--job X --state Y`) is straightforward with chained conditions
- Filtering operation is O(n) which is acceptable for n < 1000

**Alternatives Considered**:

- **Regex matching**: Out of scope per spec requirement ("exact match only")
- **Query DSL/Builder**: Over-engineering for two simple string comparisons
- **Lodash/fp-ts filters**: Unnecessary dependencies for simple array operations
- **SQL-like query parser**: Extreme over-engineering for two optional parameters

### TypeScript Type Definitions

**Decision**: Extend existing `TargetsOptions` interface

**Rationale**:

- Consistent with existing pattern (query.ts, labels.ts, series.ts all have Options interfaces)
- Optional fields (`job?: string; state?: 'up' | 'down'`) match commander option behavior
- Union type for state provides compile-time validation
- No runtime overhead (erased after compilation)

**Type Definition**:

```typescript
interface TargetsOptions {
  json?: boolean;
  job?: string;
  state?: "up" | "down";
}
```

**Alternatives Considered**:

- **Separate FilterOptions interface**: Unnecessary indirection for two fields
- **String literal type for state**: `'up' | 'down' | 'unknown'` - "unknown" is internal only, not user-facing
- **Enum for state**: TypeScript string unions are preferred for small sets

### Error Handling Strategy

**Decision**: Reuse existing error handling patterns

**Rationale**:

- Invalid state value: Early validation with descriptive error message and exit(1)
- No targets match filter: Display message "No targets found matching filters." and exit(0)
- API errors: Handled by existing `handleError(error, config.serverUrl)` function
- Consistent with UX principle "Error messages MUST be actionable"

**Error Handling Flow**:

1. Validate state option before API call (fail fast)
2. Fetch targets using existing getTargets()
3. Apply filters (may return empty array)
4. Display results or "No targets found" message

**Alternatives Considered**:

- **Custom error classes**: Not needed for simple validation (console.error + exit is sufficient)
- **Warning for empty results**: Empty results are expected behavior, not warnings
- **Try to suggest corrections**: Job names are opaque strings, no auto-correction possible

## Best Practices

### Commander.js Option Patterns

**Pattern**: Use `.option()` with short and long flags, descriptive help text

```typescript
.option('-j, --job <name>', 'Filter by job name')
.option('-s, --state <state>', 'Filter by health state (up or down)')
```

**Validation**: Check option values before action execution

```typescript
.action(async (options: TargetsOptions) => {
  // Validate state enum
  if (options.state && !['up', 'down'].includes(options.state)) {
    console.error('Error: --state must be "up" or "down"');
    process.exit(1);
  }
  // ... rest of action
});
```

### TypeScript Filter Function Design

**Pattern**: Type-safe filter with explicit return type

```typescript
function filterTargets(
  targets: Target[],
  options: { job?: string; state?: "up" | "down" },
): Target[] {
  return targets.filter((target) => {
    // Job filter (exact match, case-sensitive)
    if (options.job && target.job !== options.job) {
      return false;
    }

    // State filter (health state enum)
    if (options.state && target.health !== options.state) {
      return false;
    }

    // No filters or all filters passed
    return true;
  });
}
```

**Rationale**:

- Explicit return type `Target[]` for type safety
- Early return pattern for readability
- Implicit AND logic (all conditions must pass)
- Handles undefined filters naturally (no filter = no filtering)

### Test-Driven Development (TDD) Approach

**Pattern**: Write tests first using BDD Given/When/Then

```typescript
describe('filterTargets()', () => {
  describe('Given targets with multiple jobs', () => {
    it('When job filter provided, Then returns only matching job targets', () => {
      // Arrange
      const targets = [
        { job: 'prometheus', health: 'up', ... },
        { job: 'node_exporter', health: 'up', ... }
      ];

      // Act
      const filtered = filterTargets(targets, { job: 'prometheus' });

      // Assert
      expect(filtered).toHaveLength(1);
      expect(filtered[0].job).toBe('prometheus');
    });
  });
});
```

**Coverage Requirements**:

- Happy path: single filter (job), single filter (state), combined filters
- Edge cases: no matches, empty target list, undefined filters
- Error cases: invalid state value
- Integration: JSON output, table output with filters

### Performance Considerations

**Measurement**: Filtering 1000 targets should complete in under 2 seconds (spec SC-001)

**Implementation Notes**:

- Array.filter() is O(n) - acceptable for n < 1000
- No additional memory allocation (filter returns new array, original unchanged)
- String comparison (`===`) is O(1) for typical job name lengths (< 50 chars)
- No need for memoization or caching (stateless operation)

**Benchmark Estimate**:

- 1000 targets × (2 string comparisons + 1 conditional) ≈ 0.1ms on modern CPU
- Well under 2000ms requirement (20,000x faster)

## Integration Points

### Existing Code Reuse

**What to reuse**:

- `getTargets(client)`: Fetch all targets from Prometheus API
- `formatTargetsTable(data)`: Format filtered results as table
- `formatJson(data)`: Format filtered results as JSON
- `handleError(error, url)`: Handle API errors
- `ErrorMessages.NO_CONFIG`: No config error message

**What NOT to change**:

- API client logic in prometheus.ts
- Table/JSON formatters
- Config loading logic
- Error handling infrastructure

### File Modifications

**src/commands/targets.ts** (MODIFIED):

- Add `job` and `state` to `TargetsOptions` interface
- Add filter options to command definition
- Add `filterTargets()` function
- Validate state option
- Apply filters before formatting output

**src/types/index.ts** (MODIFIED):

- Update `TargetsOptions` interface with filter fields

**tests/targets.test.ts** (NEW FILE):

- Add unit tests for `filterTargets()` function
- Add integration tests for command with filters
- Use existing test patterns (mocked axios, vitest)

## Dependencies

### Existing Dependencies (No Changes)

- **commander**: CLI framework (already in use)
- **axios**: HTTP client (already in use)
- **vitest**: Testing framework (already in use)

### No New Dependencies Required

This feature requires zero new npm packages. All functionality can be implemented using:

- TypeScript standard library (Array.filter)
- Existing prom-cli dependencies
- Native Node.js APIs

## Risk Assessment

### Low Risk Areas

✅ **Performance**: Client-side filtering is trivial for n < 1000
✅ **Compatibility**: New options are optional, existing behavior unchanged
✅ **Testing**: Filter logic is pure function, easy to test
✅ **Deployment**: No runtime dependencies, no configuration changes

### Mitigation Strategies

**Risk**: Large target counts (> 10,000) could slow filtering
**Mitigation**: Not applicable - typical deployments have < 1000 targets. If needed, can add streaming/pagination in future version (out of scope for MVP).

**Risk**: Users expect partial string matching for job names
**Mitigation**: Documentation clearly states "exact match only". Error message shows available jobs if needed in future enhancement.

**Risk**: Case sensitivity confusion for job names
**Mitigation**: Prometheus job names are case-sensitive by standard. Documentation will clarify behavior.

## Implementation Order

Based on feature spec priorities (P1 → P2 → P3):

1. **Phase 1 (P1)**: Implement `--job` filter
   - Add job option to command
   - Implement filterTargets() with job logic
   - Write tests for job filtering

2. **Phase 2 (P2)**: Implement `--state` filter
   - Add state option with validation
   - Extend filterTargets() with state logic
   - Write tests for state filtering

3. **Phase 3 (P3)**: Combined filters
   - Test combined --job and --state
   - Verify AND logic works correctly
   - Update documentation

This order allows for incremental delivery and independent testing of each feature.
