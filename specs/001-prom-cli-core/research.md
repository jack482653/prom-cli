# Research: prom-cli Core

**Feature Branch**: `001-prom-cli-core`
**Date**: 2024-12-31

## Technology Decisions

### Runtime & Language

**Decision**: Node.js with TypeScript

**Rationale**:

- TypeScript provides type safety for better maintainability
- Node.js has excellent CLI tooling ecosystem
- ES Modules (ESM) for modern import/export syntax

**Alternatives Considered**:

- Go: Better for standalone binaries, but user specified Node.js
- Python: Slower startup time for CLI tools

### HTTP Client

**Decision**: axios

**Rationale**:

- User-specified requirement
- Mature, well-documented library
- Built-in request/response interceptors for auth handling
- Automatic JSON parsing

**Alternatives Considered**:

- fetch (native): Less convenient for complex scenarios
- got: Similar capabilities, less widespread adoption

### CLI Framework

**Decision**: commander

**Rationale**:

- Most widely used Node.js CLI framework
- Excellent TypeScript support
- Built-in help generation
- Subcommand support for multi-command CLI

**Alternatives Considered**:

- yargs: More complex API
- oclif: Heavier, better for large CLI suites

### Package Manager

**Decision**: pnpm

**Rationale**:

- User-specified requirement
- Faster than npm/yarn
- Disk space efficient (symlinked node_modules)
- Node version management via `pnpm env`

### Code Formatting

**Decision**: prettier with @trivago/prettier-plugin-sort-imports

**Rationale**:

- User-specified requirement
- Consistent code style
- Automatic import sorting reduces merge conflicts

**Configuration**:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "plugins": ["@trivago/prettier-plugin-sort-imports"],
  "importOrder": ["^node:", "<THIRD_PARTY_MODULES>", "^[./]"],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
```

### Configuration Storage

**Decision**: JSON file in user's home directory (`~/.prom-cli/config.json`)

**Rationale**:

- Standard practice for CLI tools
- Human-readable format
- Easy to backup/transfer
- No additional dependencies needed

**Alternatives Considered**:

- YAML: Requires additional parser
- SQLite: Overkill for simple config
- Environment variables only: Less user-friendly

### Table Output

**Decision**: Custom table formatter (simple implementation)

**Rationale**:

- Constitution principle: No Overdesign
- Table formatting is straightforward for fixed columns
- Avoid adding npm dependency for simple feature

**Alternatives Considered**:

- cli-table3: Adds dependency for simple use case
- console-table: Less customizable

## Prometheus API Research

### Relevant Endpoints

| Endpoint                   | Method   | Purpose              |
| -------------------------- | -------- | -------------------- |
| `/api/v1/query`            | GET/POST | Instant PromQL query |
| `/api/v1/targets`          | GET      | List scrape targets  |
| `/-/healthy`               | GET      | Health check         |
| `/-/ready`                 | GET      | Readiness check      |
| `/api/v1/status/buildinfo` | GET      | Build information    |

### Response Formats

**Query Response (vector)**:

```json
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": { "__name__": "up", "instance": "localhost:9090" },
        "value": [1640000000, "1"]
      }
    ]
  }
}
```

**Targets Response**:

```json
{
  "status": "success",
  "data": {
    "activeTargets": [
      {
        "labels": { "job": "prometheus", "instance": "localhost:9090" },
        "health": "up",
        "lastScrape": "2024-12-31T00:00:00.000Z",
        "lastScrapeDuration": 0.005
      }
    ]
  }
}
```

## Architecture Decisions

### Single Responsibility Modules

Following Constitution Principle I (Code Quality):

```
src/
├── commands/          # CLI command handlers
│   ├── config.ts
│   ├── targets.ts
│   ├── query.ts
│   └── status.ts
├── services/          # Business logic
│   ├── prometheus.ts  # API client
│   └── config.ts      # Config management
├── formatters/        # Output formatting
│   ├── table.ts
│   └── json.ts
├── types/             # TypeScript interfaces
│   └── index.ts
└── index.ts           # CLI entry point
```

### Error Handling Strategy

Following Constitution Principle III (UX Consistency):

- Wrap axios errors with user-friendly messages
- Include actionable suggestions in error output
- Exit codes: 0 success, 1 user error, 2 server error

## Open Questions (Resolved)

All technology decisions have been made by user input. No outstanding questions.
