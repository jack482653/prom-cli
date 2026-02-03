# Quickstart: Series Command

**Feature Branch**: `005-series`
**Date**: 2025-01-09

## Overview

This quickstart guide helps developers implement the `prom series` command following TDD/BDD practices and project constitution principles.

## Prerequisites

- Existing prom-cli codebase with query, query-range, and labels commands implemented
- Node.js 18+ and pnpm installed
- vitest configured for testing
- Prometheus server for manual testing (optional)

## Step-by-Step Implementation (TDD)

### Phase 1: Core Functionality (P1)

**Goal**: Implement basic series querying with label matchers

#### Step 1.1: Write Tests First (RED)

Create `tests/series.test.ts`:

```typescript
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSeries } from "../src/services/prometheus.js";

describe("getSeries()", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
    };
  });

  describe("Given single matcher", () => {
    it("should query /api/v1/series with match[] parameter", async () => {
      mockClient.get.mockResolvedValue({
        data: {
          status: "success",
          data: [{ __name__: "up", job: "prometheus" }],
        },
      });

      await getSeries(mockClient, ["up"]);

      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/series", {
        params: { "match[]": ["up"] },
      });
    });
  });

  // Add more test cases...
});
```

Run tests: `pnpm test` → Should FAIL (RED) ✅

#### Step 1.2: Implement Minimal Code (GREEN)

Add to `src/services/prometheus.ts`:

```typescript
export async function getSeries(
  client: AxiosInstance,
  matchers: string[],
  start?: number,
  end?: number,
): Promise<Record<string, string>[]> {
  const params: Record<string, any> = {
    "match[]": matchers,
  };

  if (start !== undefined) {
    params.start = start.toString();
  }
  if (end !== undefined) {
    params.end = end.toString();
  }

  const response = await client.get<SeriesResult>("/api/v1/series", { params });

  if (response.data.status === "error") {
    throw new Error(response.data.error || "Unknown error");
  }

  return response.data.data || [];
}
```

Run tests: `pnpm test` → Should PASS (GREEN) ✅

#### Step 1.3: Refactor (if needed)

Review code for:

- Duplication (check against labels.ts, query-range.ts patterns)
- Naming clarity
- Type safety

Run tests after refactoring: `pnpm test` → Should still PASS ✅

#### Step 1.4: Implement CLI Command

Write tests for `src/commands/series.ts`:

```typescript
describe("seriesCommand()", () => {
  describe("Given no matchers", () => {
    it("should throw error", async () => {
      await expect(seriesCommand([], {})).rejects.toThrow("at least one label matcher");
    });
  });

  // More tests...
});
```

Implement command handler following existing patterns from `labels.ts`.

#### Step 1.5: Register Command

Update `src/index.ts`:

```typescript
import { seriesCommand } from "./commands/series.js";

program
  .command("series")
  .arguments("<matchers...>")
  .description("Query time series matching label selectors")
  .option("--json", "Output in JSON format")
  .option("--start <time>", "Start time (RFC3339 or relative)")
  .option("--end <time>", "End time (RFC3339 or relative)")
  .action(seriesCommand);
```

#### Step 1.6: Manual Verification

```bash
# Build and test locally
pnpm build
node dist/index.js series 'up'

# Expected: List of series with metric name "up"
```

### Phase 2: Time Filtering (P2)

**Goal**: Add --start and --end options

#### Step 2.1: Write Time Parsing Tests

Add tests for time range parsing (reuse patterns from `labels.test.ts`):

```typescript
describe("parseTimeRange()", () => {
  it("should parse RFC3339 start time", () => {
    const result = parseTimeRange({ start: "2024-01-01T00:00:00Z" });
    expect(result.start).toBe(1704067200);
  });

  // More tests...
});
```

#### Step 2.2: Implement Time Parsing

Reuse `parseTimeExpression()` from `time-parser.ts` (same pattern as labels command).

#### Step 2.3: Verify Time Filtering

```bash
prom series 'up' --start 1h --end now
# Expected: Series with data in last hour
```

### Phase 3: JSON Output (P3)

**Goal**: Add --json flag support

#### Step 3.1: Write JSON Output Tests

```typescript
describe("Given --json flag", () => {
  it("should output valid JSON array", async () => {
    const output = await captureOutput(() => seriesCommand(["up"], { json: true }));
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
  });
});
```

#### Step 3.2: Implement JSON Output

Reuse `formatJson()` from `formatters/json.ts`.

#### Step 3.3: Verify JSON Output

```bash
prom series 'up' --json | jq '.'
# Expected: Valid JSON, parseable by jq
```

## Testing Checklist

### Unit Tests

- [ ] getSeries() with single matcher
- [ ] getSeries() with multiple matchers
- [ ] getSeries() with time range parameters
- [ ] getSeries() handles empty results
- [ ] getSeries() handles Prometheus errors
- [ ] parseTimeRange() validates time expressions
- [ ] parseTimeRange() validates start < end
- [ ] seriesCommand() requires at least one matcher
- [ ] seriesCommand() handles --json flag
- [ ] seriesCommand() integrates time parsing

### Manual Tests

- [ ] `prom series 'up'` displays series
- [ ] `prom series '{job="prometheus"}'` filters by label
- [ ] `prom series 'up' '{job="node"}'` combines matchers (OR)
- [ ] `prom series` shows error for missing matcher
- [ ] `prom series '{invalid}'` shows Prometheus error
- [ ] `prom series 'up' --start 1h --end now` filters by time
- [ ] `prom series 'up' --json` outputs valid JSON
- [ ] `prom series --help` displays help text

### Edge Cases

- [ ] Empty result set (no matching series)
- [ ] Large result set (10,000+ series)
- [ ] Invalid matcher syntax (Prometheus error)
- [ ] Server not configured
- [ ] Connection timeout
- [ ] Authentication failure

## Code Quality Checklist

### Constitution Compliance

- [ ] **I. Code Quality**: Functions have single responsibility, descriptive names
- [ ] **II. Testing (TDD)**: All tests written before implementation
- [ ] **III. UX Consistency**: Error messages actionable, --help works, exit codes correct
- [ ] **IV. Performance**: Responds within 2s for typical deployments
- [ ] **V. MVP First**: P1 → P2 → P3 implemented in order
- [ ] **VI. No Overdesign**: Reused existing patterns, no new abstractions

### Code Review Points

- [ ] Follows patterns from labels.ts and query-range.ts
- [ ] No code duplication (DRY)
- [ ] Type safety (no `any` types except mockClient)
- [ ] Error handling consistent with other commands
- [ ] Prettier formatting applied: `pnpm format`
- [ ] All tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`

## Common Pitfalls

### ❌ Don't Do This

```typescript
// Don't validate matcher syntax on client
if (!matcher.match(/^{.*}$/)) {
  throw new Error("Invalid matcher");
}
// Let Prometheus handle validation
```

```typescript
// Don't paginate results on client
if (series.length > 1000) {
  return series.slice(0, 1000);
}
// Display all results
```

```typescript
// Don't create new abstractions
class SeriesQueryBuilder {
  withMatcher() { ... }
  withTimeRange() { ... }
}
// Use simple functions
```

### ✅ Do This Instead

```typescript
// Let Prometheus validate
const response = await client.get("/api/v1/series", { params });
// Handle Prometheus errors in catch block

// Display all results
return series; // No artificial limits

// Reuse existing patterns
const { start, end } = parseTimeRange(options);
await getSeries(client, matchers, start, end);
```

## Debugging Tips

### Test Failures

```bash
# Run single test file
pnpm test series.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose

# Run in watch mode during development
pnpm test -- --watch
```

### API Issues

```bash
# Test Prometheus API directly
curl "http://localhost:9090/api/v1/series?match[]=up"

# Check authentication
curl -u user:pass "http://localhost:9090/api/v1/series?match[]=up"

# Test with time range
curl "http://localhost:9090/api/v1/series?match[]=up&start=2024-01-01T00:00:00Z"
```

### Build Issues

```bash
# Clean and rebuild
rm -rf dist/
pnpm build

# Check TypeScript errors
pnpm build --noEmit
```

## Next Steps

After implementation:

1. Run full test suite: `pnpm test`
2. Manual testing with real Prometheus server
3. Update THOUGHTS.md with implementation notes
4. Create pull request following commit standards
5. Address any code review feedback

## Resources

- [Prometheus API Documentation](https://prometheus.io/docs/prometheus/latest/querying/api/#finding-series-by-label-matchers)
- [Prometheus Label Matcher Syntax](https://prometheus.io/docs/prometheus/latest/querying/basics/#time-series-selectors)
- Project Constitution: `.specify/memory/constitution.md`
- Similar Commands: `src/commands/labels.ts`, `src/commands/query-range.ts`
