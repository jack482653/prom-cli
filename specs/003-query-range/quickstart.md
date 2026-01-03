# Quickstart: Query Range Command

**Date**: 2025-01-03
**Feature**: 003-query-range

## Prerequisites

1. Prometheus server running and accessible
2. Server configured via `prom config http://localhost:9090`

## Test Scenarios

### Scenario 1: Basic Range Query (P1)

**Goal**: Verify basic range query with absolute timestamps works.

```bash
# Execute range query with explicit parameters
prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z" --step 60

# Expected output (table format):
METRIC   LABELS                              POINTS   RANGE
up       {instance="localhost:9090",job="prometheus"}   60       1.0 - 1.0

Time range: 2024-01-01T00:00:00Z to 2024-01-01T01:00:00Z (step: 60s)
Total: 1 series, 60 data points
```

```bash
# JSON output
prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z" --step 60 --json
```

### Scenario 2: Relative Time Ranges (P2)

**Goal**: Verify relative time expressions work correctly.

```bash
# Query last hour
prom query-range "up" --start "1h" --end "now"

# Query last 30 minutes
prom query-range "up" -s "30m" -e "now"

# Query last 7 days
prom query-range "up" -s "7d" -e "now"
```

### Scenario 3: Default Step Calculation (P3)

**Goal**: Verify auto-calculated step produces reasonable results.

```bash
# No step specified - should auto-calculate
prom query-range "up" --start "1h" --end "now"
# Expected: ~18s step for 1 hour (targeting 200 points)

prom query-range "up" --start "24h" --end "now"
# Expected: ~432s step for 24 hours (targeting 200 points)
```

### Scenario 4: Error Handling

**Goal**: Verify proper error messages for invalid input.

```bash
# Invalid time range (start after end)
prom query-range "up" --start "now" --end "1h"
# Expected: Error about start being after end

# Invalid time format
prom query-range "up" --start "invalid" --end "now"
# Expected: Error with format examples

# Empty results
prom query-range "nonexistent_metric" --start "1h" --end "now"
# Expected: "No data" message
```

## Manual Verification Checklist

- [ ] Table output displays metric names, labels, point count, and value range
- [ ] JSON output matches Prometheus API response format
- [ ] Relative times are correctly converted to timestamps
- [ ] Default step produces ~200 data points for various time ranges
- [ ] Error messages are actionable and include examples
- [ ] Large result sets display warning
- [ ] Help text is clear: `prom query-range --help`

## Integration with Existing Commands

```bash
# Verify instant query still works
prom query "up"

# Verify range query uses same error patterns
prom query-range "invalid{" --start "1h" --end "now"
# Should show same PromQL error format as instant query
```
