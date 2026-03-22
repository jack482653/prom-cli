# Quickstart: Alerts, Rules, CSV Output & Target Label Filter

**Feature**: 008-alerts-rules-enhancements
**Date**: 2026-03-21

## AI Agent Incident Investigation Workflow

```bash
# Step 1: Check what's firing
prom alerts --json

# Step 2: Understand why it fired — get the rule definition
prom rules --type alerting --json

# Step 3: Find the affected targets
prom targets --label job=node_exporter --state down --json

# Step 4: Deep-dive with a query
prom query 'node_cpu_seconds_total{job="node_exporter"}' --json

# Step 5: Look at the trend
prom query-range 'node_cpu_seconds_total' --start 1h --step 5m --json
```

## New Commands

### View Active Alerts

```bash
# Table output (human-readable)
prom alerts

# JSON (for agents/scripts)
prom alerts --json

# CSV (for further processing)
prom alerts --csv
```

### View Rules

```bash
# All rules
prom rules

# Only alerting rules
prom rules --type alerting

# Only recording rules
prom rules --type recording

# JSON output
prom rules --json
```

## Enhanced Commands

### Filter Targets by Label

```bash
# Single label filter
prom targets --label env=production

# Multiple labels (AND logic)
prom targets --label env=production --label region=us-east

# Combine with existing filters
prom targets --state up --label job=api

# CSV output
prom targets --label job=node_exporter --csv
```

### CSV Output on Query Commands

```bash
prom query 'up' --csv
prom query-range 'node_memory_MemFree_bytes' --start 1h --step 5m --csv
```
