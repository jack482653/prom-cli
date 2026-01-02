# Quickstart: prom-cli

## Prerequisites

- Node.js 18+ (managed via pnpm)
- Access to a Prometheus server

## Installation

```bash
# Clone and install
git clone <repo-url>
cd prom-cli
pnpm install

# Build
pnpm build

# Link globally (optional)
pnpm link --global
```

## Development

```bash
# Run in development mode
pnpm dev [command]

# Example
pnpm dev config http://localhost:9090
pnpm dev targets
```

## Quick Usage

### 1. Configure Server

```bash
# Basic configuration
prom config http://localhost:9090

# With authentication
prom config http://prometheus.example.com -u admin -p secret

# View current config
prom config --show
```

### 2. List Targets

```bash
# Table output (default)
prom targets

# JSON output
prom targets --json
```

Expected output:

```
JOB          INSTANCE              STATE   LAST SCRAPE
prometheus   localhost:9090        up      2s ago
node         192.168.1.10:9100     up      5s ago
```

### 3. Query Metrics

```bash
# Simple query
prom query "up"

# With label selector
prom query 'node_cpu_seconds_total{mode="idle"}'

# JSON output
prom query "up" --json
```

Expected output:

```
METRIC   LABELS                          VALUE
up       {instance="localhost:9090"}     1
up       {instance="192.168.1.10:9100"}  1
```

### 4. Check Status

```bash
prom status
```

Expected output:

```
Server:     http://localhost:9090
Health:     healthy
Ready:      ready
Version:    2.45.0
```

## Validation Checklist

After implementation, verify:

- [ ] `prom config <url>` saves configuration to `~/.prom-cli/config.json`
- [ ] `prom config --show` displays current configuration
- [ ] `prom targets` displays aligned table with JOB, INSTANCE, STATE, LAST SCRAPE
- [ ] `prom targets --json` outputs valid JSON array
- [ ] `prom query "up"` displays vector results as table
- [ ] `prom query "1+1"` displays scalar result
- [ ] `prom query --json` outputs valid JSON
- [ ] `prom status` shows health, ready, and version info
- [ ] All commands show helpful error when no config exists
- [ ] All commands handle server connection errors gracefully
- [ ] `--help` works for all commands
- [ ] Exit codes follow conventions (0=success, 1=user error, 2=server error)

## Project Structure

```
prom-cli/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/          # Command handlers
│   │   ├── config.ts
│   │   ├── targets.ts
│   │   ├── query.ts
│   │   └── status.ts
│   ├── services/          # Business logic
│   │   ├── prometheus.ts  # API client
│   │   └── config.ts      # Config management
│   ├── formatters/        # Output formatting
│   │   ├── table.ts
│   │   └── json.ts
│   └── types/             # TypeScript interfaces
│       └── index.ts
├── package.json
├── tsconfig.json
└── .prettierrc
```

## Common Issues

### "No server configured"

Run `prom config <url>` first.

### "ECONNREFUSED"

Check if Prometheus is running at the configured URL.

### "401 Unauthorized"

Verify authentication credentials with `prom config --show`.
