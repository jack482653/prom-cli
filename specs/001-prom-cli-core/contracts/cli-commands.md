# CLI Commands Contract

**Feature Branch**: `001-prom-cli-core`
**Date**: 2024-12-31

## Command Overview

```
prom <command> [options]

Commands:
  config    Configure Prometheus server connection
  targets   List scrape targets
  query     Execute PromQL query
  status    Check server status
```

---

## `prom config`

Configure Prometheus server connection.

### Usage

```bash
prom config <url> [options]
prom config --show
```

### Arguments

| Argument | Required | Description           |
| -------- | -------- | --------------------- |
| `url`    | Yes\*    | Prometheus server URL |

\* Required unless using `--show`

### Options

| Option              | Short | Description                      |
| ------------------- | ----- | -------------------------------- |
| `--username <user>` | `-u`  | Basic auth username              |
| `--password <pass>` | `-p`  | Basic auth password              |
| `--token <token>`   | `-t`  | Bearer token                     |
| `--timeout <ms>`    |       | Request timeout (default: 30000) |
| `--show`            | `-s`  | Show current configuration       |

### Examples

```bash
# Set server URL
prom config http://localhost:9090

# Set with basic auth
prom config http://localhost:9090 -u admin -p secret

# Set with bearer token
prom config http://localhost:9090 -t mytoken123

# Show current config
prom config --show
```

### Exit Codes

| Code | Description          |
| ---- | -------------------- |
| 0    | Configuration saved  |
| 1    | Invalid URL format   |
| 1    | Invalid auth options |

---

## `prom targets`

List all scrape targets and their status.

### Usage

```bash
prom targets [options]
```

### Options

| Option   | Short | Description    |
| -------- | ----- | -------------- |
| `--json` | `-j`  | Output as JSON |

### Output Format (Table)

```
JOB          INSTANCE              STATE   LAST SCRAPE
prometheus   localhost:9090        up      2s ago
node         192.168.1.10:9100     down    5m ago
```

### Output Format (JSON)

```json
[
  {
    "job": "prometheus",
    "instance": "localhost:9090",
    "health": "up",
    "lastScrape": "2024-12-31T12:00:00.000Z",
    "lastScrapeDuration": 0.005
  }
]
```

### Exit Codes

| Code | Description              |
| ---- | ------------------------ |
| 0    | Targets retrieved        |
| 1    | No server configured     |
| 2    | Server connection failed |

---

## `prom query`

Execute an instant PromQL query.

### Usage

```bash
prom query <expression> [options]
```

### Arguments

| Argument     | Required | Description       |
| ------------ | -------- | ----------------- |
| `expression` | Yes      | PromQL expression |

### Options

| Option        | Short | Description                            |
| ------------- | ----- | -------------------------------------- |
| `--json`      | `-j`  | Output as JSON                         |
| `--time <ts>` | `-t`  | Evaluation timestamp (RFC3339 or Unix) |

### Output Format (Vector - Table)

```
METRIC                        LABELS                          VALUE
up                           {instance="localhost:9090"}      1
node_cpu_seconds_total       {cpu="0",mode="idle"}           12345.67
```

### Output Format (Scalar)

```
scalar: 42
```

### Output Format (String)

```
string: "hello world"
```

### Output Format (JSON)

```json
{
  "resultType": "vector",
  "result": [
    {
      "metric": {
        "__name__": "up",
        "instance": "localhost:9090"
      },
      "value": [1640000000, "1"]
    }
  ]
}
```

### Examples

```bash
# Simple query
prom query "up"

# Query with label filter
prom query 'node_cpu_seconds_total{mode="idle"}'

# Query at specific time
prom query "up" --time 2024-12-31T12:00:00Z

# Output as JSON
prom query "up" --json
```

### Exit Codes

| Code | Description               |
| ---- | ------------------------- |
| 0    | Query executed            |
| 1    | No server configured      |
| 1    | Invalid PromQL expression |
| 2    | Server connection failed  |

---

## `prom status`

Check Prometheus server health and build information.

### Usage

```bash
prom status [options]
```

### Options

| Option   | Short | Description    |
| -------- | ----- | -------------- |
| `--json` | `-j`  | Output as JSON |

### Output Format (Default)

```
Server:     http://localhost:9090
Health:     healthy
Ready:      ready
Version:    2.45.0
Build Date: 2024-06-15
Go Version: go1.21.0
```

### Output Format (JSON)

```json
{
  "serverUrl": "http://localhost:9090",
  "healthy": true,
  "ready": true,
  "buildInfo": {
    "version": "2.45.0",
    "revision": "abc123",
    "branch": "HEAD",
    "buildUser": "root@builder",
    "buildDate": "2024-06-15",
    "goVersion": "go1.21.0"
  }
}
```

### Exit Codes

| Code | Description          |
| ---- | -------------------- |
| 0    | Server is healthy    |
| 1    | No server configured |
| 2    | Server unreachable   |
| 2    | Server unhealthy     |

---

## Global Options

These options are available for all commands:

| Option      | Short | Description  |
| ----------- | ----- | ------------ |
| `--help`    | `-h`  | Show help    |
| `--version` | `-V`  | Show version |

---

## Error Message Contracts

### No Server Configured

```
Error: No server configured.
Run 'prom config <url>' to configure your Prometheus server.
```

### Invalid URL

```
Error: Invalid URL format.
URL must start with http:// or https://
Example: prom config http://localhost:9090
```

### Connection Failed

```
Error: Could not connect to Prometheus server.
URL: http://localhost:9090
Reason: ECONNREFUSED

Troubleshooting:
  - Check if Prometheus is running
  - Verify the URL is correct
  - Check network connectivity
```

### Authentication Failed

```
Error: Authentication failed (401 Unauthorized).
Hint: Check your username/password or token.
Run 'prom config --show' to view current settings.
```

### Invalid PromQL

```
Error: Invalid PromQL expression.
Server response: parse error at char 5: unexpected character...
```
