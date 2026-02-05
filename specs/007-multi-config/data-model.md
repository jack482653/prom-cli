# Data Model: Multi-Config Management

**Feature**: 007-multi-config
**Date**: 2025-02-05
**Purpose**: Define data structures and validation rules for multi-configuration storage

## Overview

This document defines the data entities, relationships, and validation rules for storing and managing multiple named Prometheus server configurations. The data model supports the storage structure decided in research.md (flat JSON with activeConfig field).

## Core Entities

### Configuration

Represents a single named Prometheus server connection configuration.

**Attributes**:

- `name` (string, implicit): Configuration identifier (used as object key in storage)
- `serverUrl` (string, required): Prometheus server endpoint URL
- `username` (string, optional): Basic authentication username
- `password` (string, optional): Basic authentication password
- `token` (string, optional): Bearer token for authentication

**Validation Rules**:

- `serverUrl` MUST be a valid URL with http:// or https:// scheme
- `serverUrl` MUST NOT be empty or whitespace-only
- `serverUrl` MUST NOT end with trailing slash (normalized during save)
- Authentication fields are mutually exclusive groups:
  - If `username` is provided, `password` MUST be provided
  - If `token` is provided, `username` and `password` MUST NOT be provided
  - If no auth fields provided, configuration allows anonymous access

**TypeScript Interface**:

```typescript
interface Configuration {
  serverUrl: string;
  username?: string;
  password?: string;
  token?: string;
}
```

**Invariants**:

- At least `serverUrl` must be present
- Cannot have both basic auth (username/password) AND bearer token
- Configuration is immutable once created (use remove + add to modify)

**Examples**:

Basic authentication:

```json
{
  "serverUrl": "https://prod.example.com",
  "username": "admin",
  "password": "secret123"
}
```

Bearer token authentication:

```json
{
  "serverUrl": "https://staging.example.com",
  "token": "abc123xyz"
}
```

No authentication:

```json
{
  "serverUrl": "http://localhost:9090"
}
```

---

### ConfigStore

Manages the collection of all configurations and tracks the active configuration.

**Attributes**:

- `activeConfig` (string, optional): Name of currently active configuration
- `configs` (object, required): Map of configuration names to Configuration entities

**Validation Rules**:

- `configs` object MUST NOT be null or undefined (can be empty {})
- `activeConfig` MUST reference a key that exists in `configs` object (referential integrity)
- `activeConfig` can be null/undefined only if `configs` is empty
- Configuration names (keys in `configs`) MUST follow naming rules (see below)
- ConfigStore file size MUST NOT exceed 1MB (enforced via max 100 configs limit)

**TypeScript Interface**:

```typescript
interface ConfigStore {
  activeConfig?: string;
  configs: Record<string, Configuration>;
}
```

**Invariants**:

- If `activeConfig` is set, it must point to existing configuration
- Configuration names are unique by definition (object keys are unique)
- ConfigStore is the single source of truth for all configuration data

**Example**:

```json
{
  "activeConfig": "production",
  "configs": {
    "production": {
      "serverUrl": "https://prod.example.com",
      "username": "admin",
      "password": "secret123"
    },
    "staging": {
      "serverUrl": "https://staging.example.com",
      "token": "staging-token-xyz"
    },
    "dev": {
      "serverUrl": "http://localhost:9090"
    }
  }
}
```

---

## Validation Rules

### Configuration Name Validation

**Rules**:

- Name MUST be 1-64 characters long
- Name MUST contain only: lowercase/uppercase letters (a-z, A-Z), digits (0-9), hyphens (-), underscores (\_)
- Name MUST NOT start or end with hyphen or underscore
- Name MUST NOT contain consecutive special characters (e.g., "--", "\_\_")
- Name MUST be case-sensitive ("Prod" and "prod" are different configurations)
- Reserved names NOT allowed: "default" is allowed, but "**temp", "**backup" are reserved

**Valid Names**:

- `production`, `staging`, `dev`
- `prod-us-west`, `staging_eu`
- `team-1`, `service2`

**Invalid Names**:

- `-production` (starts with hyphen)
- `staging_` (ends with underscore)
- `prod--west` (consecutive hyphens)
- `my config` (contains space)
- `test@prod` (contains @)
- `a` followed by 64 characters (exceeds length)

**Validation Function Signature**:

```typescript
function validateConfigName(name: string): void {
  if (!name || name.length === 0 || name.length > 64) {
    throw new Error("Configuration name must be 1-64 characters");
  }
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(name)) {
    throw new Error("Configuration name must contain only letters, numbers, hyphens, underscores");
  }
  if (name.includes("--") || name.includes("__")) {
    throw new Error("Configuration name cannot contain consecutive special characters");
  }
}
```

### URL Validation

**Rules**:

- URL MUST start with `http://` or `https://`
- URL MUST have a valid hostname or IP address
- URL MAY include port number (e.g., `:9090`)
- URL MAY include path prefix (e.g., `/prometheus`)
- URL MUST NOT include query parameters or fragments
- URL trailing slash is removed during normalization

**Valid URLs**:

- `http://localhost:9090`
- `https://prometheus.example.com`
- `https://10.0.0.1:9090`
- `https://prom.example.com/monitoring`

**Invalid URLs**:

- `prometheus.example.com` (missing scheme)
- `ftp://prometheus.example.com` (wrong scheme)
- `https://prom.example.com?foo=bar` (contains query params)
- `https://` (missing hostname)

**Validation Function Signature**:

```typescript
function validateServerUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL must use http:// or https://");
    }
    if (!parsed.hostname) {
      throw new Error("URL must include hostname");
    }
    if (parsed.search || parsed.hash) {
      throw new Error("URL cannot contain query parameters or fragments");
    }
  } catch (e) {
    throw new Error(`Invalid URL: ${e.message}`);
  }
}
```

### Authentication Validation

**Rules**:

- If `username` provided, `password` MUST also be provided
- If `password` provided, `username` MUST also be provided
- If `token` provided, `username` and `password` MUST NOT be provided
- All three authentication fields being empty is valid (anonymous access)

**Validation Function Signature**:

```typescript
function validateAuthentication(config: Configuration): void {
  const hasBasicAuth = config.username || config.password;
  const hasToken = !!config.token;

  if (hasBasicAuth && hasToken) {
    throw new Error("Cannot use both username/password and token authentication");
  }

  if (config.username && !config.password) {
    throw new Error("Password required when username is provided");
  }

  if (config.password && !config.username) {
    throw new Error("Username required when password is provided");
  }
}
```

## State Transitions

### Configuration Lifecycle

```
         ┌─────────────┐
         │  Non-existent│
         └──────┬───────┘
                │ add
                ▼
         ┌──────────────┐
    ┌───│   Inactive    │◄──┐
    │   └──────┬───────┘   │
    │          │ use        │ use (switch to different)
    │          ▼            │
    │   ┌──────────────┐   │
    │   │    Active    ├───┘
    │   └──────┬───────┘
    │          │ remove (with --force)
    │          ▼
    │   ┌──────────────┐
    └──►│  Removed     │
        └──────────────┘
```

**State Definitions**:

- **Non-existent**: Configuration name not in ConfigStore
- **Inactive**: Configuration exists in ConfigStore but not set as activeConfig
- **Active**: Configuration exists and activeConfig points to its name
- **Removed**: Configuration deleted from ConfigStore

**Transition Rules**:

- `add`: Non-existent → Inactive (if configs exist) or Active (if first config)
- `use`: Inactive → Active (sets activeConfig to this name)
- `use`: Active → Active (switch from current active to different active)
- `remove`: Inactive → Removed (direct removal allowed)
- `remove --force`: Active → Removed (requires explicit confirmation)

## File Format

### Storage Location

**Path**: `~/.prom-cli/config.json`

**Permissions**:

- File MUST be readable/writable only by owner (0600 on Unix systems)
- Directory MUST exist before first write (create if missing)

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "activeConfig": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64
    },
    "configs": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$": {
          "type": "object",
          "required": ["serverUrl"],
          "properties": {
            "serverUrl": {
              "type": "string",
              "pattern": "^https?://.+"
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "token": {
              "type": "string"
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  },
  "required": ["configs"],
  "additionalProperties": false
}
```

### Old Format (Pre-Migration)

**Path**: `~/.prom-cli/config.json` (before migration)

```json
{
  "serverUrl": "https://prometheus.example.com",
  "username": "admin",
  "password": "secret"
}
```

**Backup Path**: `~/.prom-cli/config.json.backup` (after migration)

### Migration Mapping

Old format field → New format location:

- `serverUrl` → `configs.default.serverUrl`
- `username` → `configs.default.username`
- `password` → `configs.default.password`
- `token` → `configs.default.token`
- (new) `activeConfig` → `"default"`

## Error Handling

### Error Categories

**User Errors** (exit code 1):

- Invalid configuration name format
- Invalid URL format
- Duplicate configuration name
- Non-existent configuration referenced
- Missing required authentication fields
- Conflicting authentication methods

**System Errors** (exit code 2):

- Config file read/write permission denied
- Config file corrupted (invalid JSON)
- Disk full during write
- Config directory creation failed

### Error Messages

Examples of user-friendly error messages:

```
Error: Configuration name 'prod--west' is invalid.
Configuration names must contain only letters, numbers, hyphens, and underscores.
Consecutive special characters are not allowed.

Error: Configuration 'staging' already exists.
Use a different name or remove the existing configuration first.

Error: Configuration 'production' not found.
Available configurations: staging, dev

Error: Invalid URL 'prometheus.example.com'.
URL must start with http:// or https://

Error: Username provided without password.
Both username and password are required for basic authentication.
```

## Performance Constraints

**Size Limits**:

- Max configurations: 100
- Max config file size: 1MB
- Max configuration name length: 64 characters
- Max URL length: 2048 characters
- Max username/password length: 256 characters
- Max token length: 512 characters

**Performance Targets**:

- Load config: < 5ms (typical)
- Save config: < 10ms (atomic write)
- Validate config: < 1ms (in-memory validation)

## Security Considerations

**Credential Storage**:

- Credentials stored in plaintext in config.json
- File permissions restrict access to owner only (0600)
- No encryption at rest (per research decision)
- Users responsible for securing ~/.prom-cli/ directory

**Sensitive Data Masking**:

- List command: Show "Auth: username/password" (mask actual values)
- Current command: Show "Username: \***\*", "Password: \*\***", "Token: \*\*\*\*"
- Never log or display actual credentials in terminal output

## References

- Research decisions: [research.md](research.md)
- Feature specification: [spec.md](spec.md)
- CLI contracts: [contracts/cli-commands.md](contracts/cli-commands.md)
