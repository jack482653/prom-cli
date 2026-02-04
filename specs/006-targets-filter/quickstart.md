# Quickstart: Targets Filter Implementation

**Feature Branch**: `006-targets-filter`
**Date**: 2025-02-03

## Overview

This guide provides step-by-step instructions for implementing the targets filter feature using Test-Driven Development (TDD). Follow the phases in order for best results.

## Prerequisites

- Branch `006-targets-filter` is checked out
- All dependencies installed (`pnpm install`)
- Existing tests pass (`pnpm test`)
- Code formatted (`pnpm format`)

## Implementation Phases

### Phase 1: Type Definitions (5 minutes)

**Objective**: Add filter options to TargetsOptions interface

**Files**: `src/types/index.ts`, `src/commands/targets.ts`

**Steps**:

1. **Locate TargetsOptions interface** in `src/commands/targets.ts`:

   ```typescript
   interface TargetsOptions {
     json?: boolean;
   }
   ```

2. **Add filter fields**:

   ```typescript
   interface TargetsOptions {
     json?: boolean;
     job?: string;
     state?: "up" | "down";
   }
   ```

3. **Verify**: TypeScript compilation succeeds:
   ```bash
   pnpm build
   ```

**Expected Output**: No compilation errors

---

### Phase 2: Filter Function Tests (15 minutes)

**Objective**: Write tests for filterTargets() function (TDD Red phase)

**File**: `tests/targets.test.ts` (new file)

**Steps**:

1. **Create test file**:

   ```bash
   touch tests/targets.test.ts
   ```

2. **Write test structure** using Given/When/Then pattern:

   ```typescript
   import { describe, expect, it } from "vitest";

   import type { Target } from "../src/types/index.js";

   // Mock targets for testing
   const mockTargets: Target[] = [
     {
       job: "prometheus",
       instance: "localhost:9090",
       health: "up",
       lastScrape: new Date("2025-02-03T10:00:00Z"),
       lastScrapeDuration: 0.05,
       labels: { job: "prometheus", instance: "localhost:9090" },
     },
     {
       job: "node_exporter",
       instance: "localhost:9100",
       health: "down",
       lastScrape: new Date("2025-02-03T10:00:05Z"),
       lastScrapeDuration: 0.03,
       labels: { job: "node_exporter", instance: "localhost:9100" },
     },
     {
       job: "node_exporter",
       instance: "localhost:9101",
       health: "up",
       lastScrape: new Date("2025-02-03T10:00:10Z"),
       lastScrapeDuration: 0.04,
       labels: { job: "node_exporter", instance: "localhost:9101" },
     },
   ];

   describe("filterTargets()", () => {
     describe("Given targets with multiple jobs", () => {
       it("When job filter provided, Then returns only matching targets", () => {
         const filtered = filterTargets(mockTargets, { job: "prometheus" });

         expect(filtered).toHaveLength(1);
         expect(filtered[0].job).toBe("prometheus");
       });

       it("When job not found, Then returns empty array", () => {
         const filtered = filterTargets(mockTargets, { job: "nonexistent" });

         expect(filtered).toHaveLength(0);
       });
     });

     describe("Given targets with different health states", () => {
       it("When state filter is up, Then returns only healthy targets", () => {
         const filtered = filterTargets(mockTargets, { state: "up" });

         expect(filtered).toHaveLength(2);
         expect(filtered.every((t) => t.health === "up")).toBe(true);
       });

       it("When state filter is down, Then returns only unhealthy targets", () => {
         const filtered = filterTargets(mockTargets, { state: "down" });

         expect(filtered).toHaveLength(1);
         expect(filtered[0].health).toBe("down");
       });
     });

     describe("Given targets with combined filters", () => {
       it("When both job and state provided, Then returns targets matching both", () => {
         const filtered = filterTargets(mockTargets, {
           job: "node_exporter",
           state: "up",
         });

         expect(filtered).toHaveLength(1);
         expect(filtered[0].job).toBe("node_exporter");
         expect(filtered[0].health).toBe("up");
       });

       it("When no targets match both filters, Then returns empty array", () => {
         const filtered = filterTargets(mockTargets, {
           job: "prometheus",
           state: "down",
         });

         expect(filtered).toHaveLength(0);
       });
     });

     describe("Given targets with no filters", () => {
       it("When no filters provided, Then returns all targets", () => {
         const filtered = filterTargets(mockTargets, {});

         expect(filtered).toHaveLength(3);
       });
     });
   });
   ```

3. **Run tests** (should fail - Red phase):
   ```bash
   pnpm test targets.test.ts
   ```

**Expected Output**: Tests fail with "filterTargets is not defined"

---

### Phase 3: Implement Filter Function (20 minutes)

**Objective**: Implement filterTargets() to make tests pass (TDD Green phase)

**File**: `src/commands/targets.ts`

**Steps**:

1. **Add filterTargets() function** before createTargetsCommand():

   ```typescript
   /**
    * Filter targets based on job name and/or health state
    * @param targets - Full list of targets from API
    * @param options - Filter criteria (job and/or state)
    * @returns Filtered subset of targets
    */
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

2. **Export function** for testing:

   ```typescript
   export { filterTargets }; // Add at end of file
   ```

3. **Update test imports**:

   ```typescript
   import { filterTargets } from "../src/commands/targets.js";
   ```

4. **Run tests** (should pass - Green phase):
   ```bash
   pnpm test targets.test.ts
   ```

**Expected Output**: All filterTargets() tests pass

---

### Phase 4: Add Command Options (10 minutes)

**Objective**: Add --job and --state options to command definition

**File**: `src/commands/targets.ts`

**Steps**:

1. **Locate command definition** in createTargetsCommand():

   ```typescript
   const cmd = new Command("targets")
     .description("List scrape targets")
     .option("-j, --json", "Output as JSON");
   ```

2. **Add filter options**:

   ```typescript
   const cmd = new Command("targets")
     .description("List scrape targets")
     .option("-j, --json", "Output as JSON")
     .option("--job <name>", "Filter by job name")
     .option("--state <state>", "Filter by health state (up or down)");
   ```

3. **Verify help text**:
   ```bash
   pnpm build
   prom targets --help
   ```

**Expected Output**: Help text shows new options

---

### Phase 5: Validate State Option (10 minutes)

**Objective**: Add validation for --state option

**File**: `src/commands/targets.ts`

**Steps**:

1. **Add validation** at start of action handler:

   ```typescript
   .action(async (options: TargetsOptions) => {
     // Validate state option
     if (options.state && !['up', 'down'].includes(options.state)) {
       console.error('Error: --state must be "up" or "down"');
       process.exit(1);
     }

     const config = loadConfig();
     // ... rest of action
   ```

2. **Write validation test**:

   ```typescript
   describe("State validation", () => {
     it("should reject invalid state value", () => {
       // This would be tested in E2E test or by manually running:
       // prom targets --state invalid
       // Expected: Error message and exit(1)
     });
   });
   ```

3. **Test manually**:
   ```bash
   pnpm build
   prom targets --state invalid
   ```

**Expected Output**: Error message "Error: --state must be 'up' or 'down'"

---

### Phase 6: Apply Filters in Command (15 minutes)

**Objective**: Use filterTargets() in command action

**File**: `src/commands/targets.ts`

**Steps**:

1. **Locate target fetching** in action handler:

   ```typescript
   const targets = await getTargets(client);

   if (targets.length === 0) {
     console.log("No targets configured.");
     return;
   }
   ```

2. **Apply filters** after fetching:

   ```typescript
   const targets = await getTargets(client);

   if (targets.length === 0) {
     console.log("No targets configured.");
     return;
   }

   // Apply filters
   const filteredTargets = filterTargets(targets, {
     job: options.job,
     state: options.state
   });

   // Check if filtering resulted in empty list
   if (filteredTargets.length === 0 && (options.job || options.state)) {
     console.log("No targets found matching filters.");
     return;
   }

   if (options.json) {
     // Use filteredTargets instead of targets
     const jsonOutput = filteredTargets.map((t) => ({ ... }));
     // ...
   } else {
     // Use filteredTargets instead of targets
     const tableData = filteredTargets.map((t) => ({ ... }));
     // ...
   }
   ```

3. **Update references** to use `filteredTargets` instead of `targets`

4. **Test filtering**:
   ```bash
   pnpm build
   prom targets --job prometheus
   prom targets --state down
   prom targets --job node_exporter --state up --json
   ```

**Expected Output**: Filtered results displayed correctly

---

### Phase 7: Integration Tests (20 minutes)

**Objective**: Write integration tests for command with filters

**File**: `tests/targets.test.ts`

**Steps**:

1. **Add integration tests** using mocked axios:

   ```typescript
   import type { AxiosInstance } from "axios";
   import { beforeEach, describe, expect, it, vi } from "vitest";

   describe("targets command integration", () => {
     let mockClient: AxiosInstance;

     beforeEach(() => {
       mockClient = {
         get: vi.fn(),
         defaults: { headers: { common: {} } },
       } as unknown as AxiosInstance;
     });

     it("should filter targets by job", async () => {
       vi.mocked(mockClient.get).mockResolvedValue({
         data: {
           status: "success",
           data: {
             activeTargets: [
               {
                 labels: { job: "prometheus", instance: "localhost:9090" },
                 scrapePool: "prometheus",
                 health: "up",
                 lastScrape: "2025-02-03T10:00:00Z",
                 lastScrapeDuration: 0.05,
               },
               {
                 labels: { job: "node_exporter", instance: "localhost:9100" },
                 scrapePool: "node_exporter",
                 health: "up",
                 lastScrape: "2025-02-03T10:00:05Z",
                 lastScrapeDuration: 0.03,
               },
             ],
           },
         },
       });

       // Test getTargets + filterTargets integration
       const targets = await getTargets(mockClient);
       const filtered = filterTargets(targets, { job: "prometheus" });

       expect(filtered).toHaveLength(1);
       expect(filtered[0].job).toBe("prometheus");
     });

     // Add more integration tests...
   });
   ```

2. **Run all tests**:
   ```bash
   pnpm test
   ```

**Expected Output**: All tests pass (including existing tests)

---

### Phase 8: Manual Verification (15 minutes)

**Objective**: Verify feature works with real Prometheus server

**Prerequisites**: Prometheus server running at configured URL

**Steps**:

1. **Test basic filtering**:

   ```bash
   # List all targets
   prom targets

   # Filter by job
   prom targets --job prometheus

   # Filter by state
   prom targets --state up
   prom targets --state down

   # Combined filters
   prom targets --job node_exporter --state down

   # JSON output
   prom targets --job prometheus --json
   ```

2. **Test edge cases**:

   ```bash
   # Nonexistent job
   prom targets --job nonexistent
   # Expected: "No targets found matching filters."

   # Invalid state
   prom targets --state invalid
   # Expected: Error message

   # No targets (if possible)
   # Expected: "No targets configured."
   ```

3. **Verify backward compatibility**:
   ```bash
   # Existing command without filters should work unchanged
   prom targets
   prom targets --json
   ```

**Expected Output**: All commands work as documented in contracts/cli-commands.md

---

## Final Checklist

Before creating PR, verify:

- [ ] All tests pass (`pnpm test`)
- [ ] Code formatted (`pnpm format`)
- [ ] TypeScript compiles (`pnpm build`)
- [ ] Help text shows new options (`prom targets --help`)
- [ ] Manual testing completed (all scenarios)
- [ ] No breaking changes (existing commands work)
- [ ] Git commit follows standards (see constitution)

## Commit Strategy

**Per Constitution**: Commit after each completed task

**Recommended Commits**:

1. `feat(targets): add filter types to TargetsOptions` (Phase 1)
2. `test(targets): add filterTargets() unit tests` (Phase 2)
3. `feat(targets): implement filterTargets() function` (Phase 3)
4. `feat(targets): add --job and --state options` (Phase 4)
5. `feat(targets): add state option validation` (Phase 5)
6. `feat(targets): apply filters in command action` (Phase 6)
7. `test(targets): add integration tests for filtering` (Phase 7)

**Final Commit** (after all phases):

```bash
git add .
git commit -m "feat(targets): add job and state filtering options

- Add --job option to filter targets by job name
- Add --state option to filter by health state (up/down)
- Implement filterTargets() with exact match logic
- Add comprehensive unit and integration tests
- Maintain backward compatibility (no breaking changes)

Closes #<issue-number>"
```

## Troubleshooting

### Tests Failing

**Problem**: filterTargets() tests fail
**Solution**: Check import path and function export in targets.ts

**Problem**: Integration tests fail
**Solution**: Verify mock data structure matches Prometheus API response format

### Command Not Working

**Problem**: Options not recognized
**Solution**: Rebuild project (`pnpm build`) and check help text

**Problem**: Validation not working
**Solution**: Check validation logic runs before API call

### Empty Results

**Problem**: Filter returns empty when targets exist
**Solution**: Check case sensitivity (job names are case-sensitive)

**Problem**: "No targets configured" vs "No targets found"
**Solution**: Check conditional logic - only show "found" message when filters provided

## Performance Verification

**Test**: Filter 1000 targets

**Steps**:

1. Create mock data with 1000 targets
2. Time filterTargets() execution
3. Verify < 2 seconds (should be < 0.1ms)

**Code**:

```typescript
const largeTargetSet = Array.from({ length: 1000 }, (_, i) => ({
  job: `job-${i % 10}`,
  health: i % 2 === 0 ? "up" : "down",
  // ... other fields
}));

console.time("filterTargets");
const filtered = filterTargets(largeTargetSet, { job: "job-0" });
console.timeEnd("filterTargets");
// Expected: < 0.1ms
```

## Next Steps

After implementation:

1. Create PR with descriptive title and body
2. Request code review
3. Address review feedback
4. Merge after approval
5. Update THOUGHTS.md with completion notes
6. Update README.md if needed

## Resources

- [Feature Spec](../spec.md)
- [Data Model](../data-model.md)
- [CLI Contract](../contracts/cli-commands.md)
- [Research](../research.md)
- [Project Constitution](../../.specify/memory/constitution.md)
