# prom-cli

A command-line tool for querying Prometheus from your terminal.

## Features

- Configure Prometheus server connection with authentication support
- Execute PromQL instant queries
- Execute PromQL range queries with relative time support (1h, 30m, now)
- List scrape targets and their health status
- Check server health and version information
- Table and JSON output formats

## Prerequisites

- Node.js 18 or higher

## Installation

### From GitHub

```bash
# Using npm
npm install -g github:jack482653/prom-cli

# Using pnpm
pnpm add -g github:jack482653/prom-cli
```

### Using npx (no install)

```bash
npx github:jack482653/prom-cli status
npx github:jack482653/prom-cli query "up"
```

### From Source

```bash
git clone https://github.com/jack482653/prom-cli.git
cd prom-cli
pnpm install
pnpm link --global
```

## Quick Start

1. Configure your Prometheus server:

```bash
prom config http://localhost:9090
```

2. Check the server status:

```bash
prom status
```

3. Run your first query:

```bash
prom query "up"
```

## Commands

### prom config

Configure Prometheus server connection.

```bash
prom config <url> [options]
prom config --show
```

**Options:**

| Option                  | Description                     |
| ----------------------- | ------------------------------- |
| `-u, --username <user>` | Basic auth username             |
| `-p, --password <pass>` | Basic auth password             |
| `-t, --token <token>`   | Bearer token                    |
| `--timeout <ms>`        | Request timeout in milliseconds |
| `-s, --show`            | Show current configuration      |

**Examples:**

```bash
# Configure server URL
prom config http://localhost:9090

# Configure with basic auth
prom config http://localhost:9090 -u admin -p secret

# Configure with bearer token
prom config http://localhost:9090 -t my-api-token

# Configure with custom timeout (60 seconds)
prom config http://localhost:9090 --timeout 60000

# Show current configuration
prom config --show
```

### prom targets

List scrape targets.

```bash
prom targets [options]
```

**Options:**

| Option       | Description    |
| ------------ | -------------- |
| `-j, --json` | Output as JSON |

**Example:**

```bash
$ prom targets
JOB              INSTANCE                    HEALTH   LAST SCRAPE
prometheus       localhost:9090              up       5s ago
node-exporter    localhost:9100              up       12s ago
```

### prom query

Execute PromQL instant query.

```bash
prom query <expression> [options]
```

**Options:**

| Option            | Description                            |
| ----------------- | -------------------------------------- |
| `-j, --json`      | Output as JSON                         |
| `-t, --time <ts>` | Evaluation timestamp (RFC3339 or Unix) |

**Examples:**

```bash
# Query all up metrics
$ prom query "up"
METRIC   LABELS                              VALUE
up       {instance="localhost:9090",job="prometheus"}   1
up       {instance="localhost:9100",job="node"}         1

# Query with label filter
prom query 'up{job="prometheus"}'

# Query with rate function
prom query 'rate(http_requests_total[5m])'

# Query at specific time
prom query "up" --time "2024-01-01T00:00:00Z"

# Output as JSON
prom query "up" --json
```

### prom query-range

Execute PromQL range query over a time period.

```bash
prom query-range <expression> --start <time> --end <time> [options]
```

**Options:**

| Option                 | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `-s, --start <time>`   | Start time (RFC3339 or relative: 1h, 30m, now)     |
| `-e, --end <time>`     | End time (RFC3339 or relative: 1h, 30m, now)       |
| `-p, --step <seconds>` | Resolution step in seconds (auto-calculated if omitted) |
| `-j, --json`           | Output as JSON (includes all timestamps and values) |

**Output Formats:**

- **Table (default)**: Shows a summary per time series with metric name, labels, data point count, and min/max value range
- **JSON (`--json`)**: Returns all timestamps and values for each time series

**Examples:**

```bash
# Query last hour with relative time
$ prom query-range "up" --start "1h" --end "now"
METRIC  LABELS                                      POINTS  RANGE
up      {instance="localhost:9090",job="prometheus"}  201     1 - 1
up      {instance="localhost:9100",job="node"}        201     0 - 1

Time range: 1h to now (step: 18s)
Total: 2 series, 402 data points

# Query with absolute timestamps
prom query-range "up" --start "2024-01-01T00:00:00Z" --end "2024-01-01T01:00:00Z"

# Query with custom step (60 seconds)
prom query-range "rate(http_requests_total[5m])" --start "1h" --end "now" --step 60

# Get full data with all timestamps (JSON output)
prom query-range "up" --start "5m" --end "now" --json
```

**Relative Time Formats:**

| Format | Meaning           |
| ------ | ----------------- |
| `now`  | Current time      |
| `30s`  | 30 seconds ago    |
| `5m`   | 5 minutes ago     |
| `1h`   | 1 hour ago        |
| `7d`   | 7 days ago        |

### prom status

Check server health and version information.

```bash
prom status [options]
```

**Options:**

| Option       | Description    |
| ------------ | -------------- |
| `-j, --json` | Output as JSON |

**Example:**

```bash
$ prom status
Server:     http://localhost:9090
Health:     healthy
Ready:      ready
Version:    2.45.0
Build Date: 20230623-15:09:38
Go Version: go1.20.5
```

## Authentication

### Basic Auth

```bash
prom config http://localhost:9090 -u admin -p secret
```

### Bearer Token

```bash
prom config http://localhost:9090 -t your-api-token
```

## Output Formats

### Table (default)

Commands display results in a readable table format by default:

```bash
prom targets
prom query "up"
```

### JSON

Use the `--json` or `-j` flag for JSON output, useful for scripting:

```bash
prom targets --json
prom query "up" --json
prom status --json
```

## Configuration

Configuration is stored in `~/.prom-cli/config.json`.

## License

ISC
