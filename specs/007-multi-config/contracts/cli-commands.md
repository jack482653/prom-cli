# CLI Command Contracts: Multi-Config Management

**Feature**: 007-multi-config
**Date**: 2025-02-05
**Purpose**: Define command syntax, options, outputs, and behavior for all config management subcommands

## Overview

This document specifies the command-line interface contracts for managing multiple named Prometheus server configurations. All commands extend the existing `prom config` command with new subcommands.

---

## Command: `prom config add`

### Syntax

```bash
prom config add <name> <url> [options]
```

### Arguments

| Argument | Type   | Required | Description                        |
| -------- | ------ | -------- | ---------------------------------- |
| name     | string | Yes      | Unique configuration name          |
| url      | string | Yes      | Prometheus server URL (http/https) |

### Options

| Option            | Short | Type   | Default | Description                     |
| ----------------- | ----- | ------ | ------- | ------------------------------- |
| --username <user> | -u    | string | -       | Basic authentication username   |
| --password <pass> | -p    | string | -       | Basic authentication password   |
| --token <token>   | -t    | string | -       | Bearer token for authentication |
| --help            | -h    | flag   | -       | Show help                       |

### Behavior

**Success Path**:

1. Validate configuration name format (letters, numbers, hyphens, underscores)
2. Validate URL format (must start with http:// or https://)
3. Validate authentication options (username requires password, token is mutually exclusive with username/password)
4. Check for duplicate configuration name
5. If no configurations exist, set this as active configuration
6. If configurations exist, add as inactive configuration
7. Save updated ConfigStore to file
8. Display success message

**Output**:

```
Configuration 'production' added successfully.
Active configuration: production

# Or if not first config:
Configuration 'staging' added successfully.
Run 'prom config use staging' to switch to this configuration.
```

### Examples

```bash
# Add configuration without authentication
prom config add dev http://localhost:9090

# Add configuration with basic auth
prom config add production https://prod.example.com --username admin --password secret

# Add configuration with bearer token
prom config add staging https://staging.example.com --token abc123xyz

# Add configuration with short options
prom config add qa https://qa.example.com -u tester -p pass123
```

### Exit Codes

| Code | Description                         |
| ---- | ----------------------------------- |
| 0    | Success                             |
| 1    | Invalid arguments (name, URL, auth) |
| 1    | Duplicate configuration name        |
| 2    | File system error (write failed)    |

### Error Messages

```
Error: Configuration name 'prod--west' is invalid.
Configuration names must contain only letters, numbers, hyphens, and underscores.

Error: Configuration 'production' already exists.
Use a different name or remove the existing configuration first.

Error: Invalid URL 'prometheus.example.com'.
URL must start with http:// or https://

Error: Password required when username is provided.

Error: Cannot use both username/password and token authentication.
```

---

## Command: `prom config list`

### Syntax

```bash
prom config list [options]
```

### Arguments

None.

### Options

| Option | Short | Type | Default | Description |
| ------ | ----- | ---- | ------- | ----------- |
| --help | -h    | flag | -       | Show help   |

### Behavior

**Success Path**:

1. Load ConfigStore from file
2. If no configurations exist, display guidance message
3. If configurations exist:
   - Sort configurations alphabetically by name
   - Mark active configuration with indicator (\* or arrow)
   - Display table with columns: NAME, URL, AUTH TYPE
   - Mask authentication details (show only auth type)

**Output (with configurations)**:

```
NAME          URL                                 AUTH TYPE
* production  https://prod.example.com            basic auth
  staging     https://staging.example.com         bearer token
  dev         http://localhost:9090               none

Active: production
Total: 3 configurations
```

**Output (no configurations)**:

```
No configurations found.

Add your first configuration:
  prom config add <name> <url>

Example:
  prom config add production https://prometheus.example.com
```

### Examples

```bash
# List all configurations
prom config list
```

### Exit Codes

| Code | Description                     |
| ---- | ------------------------------- |
| 0    | Success (includes empty list)   |
| 2    | File system error (read failed) |

### Error Messages

```
Error: Unable to read configuration file.
Check permissions on ~/.prom-cli/config.json

Error: Configuration file is corrupted.
Restore from backup at ~/.prom-cli/config.json.backup or create new configuration.
```

---

## Command: `prom config use`

### Syntax

```bash
prom config use <name> [options]
```

### Arguments

| Argument | Type   | Required | Description                       |
| -------- | ------ | -------- | --------------------------------- |
| name     | string | Yes      | Name of configuration to activate |

### Options

| Option | Short | Type | Default | Description |
| ------ | ----- | ---- | ------- | ----------- |
| --help | -h    | flag | -       | Show help   |

### Behavior

**Success Path**:

1. Load ConfigStore from file
2. Verify configuration name exists in configs
3. Set activeConfig to specified name
4. Save updated ConfigStore to file
5. Display success message

**Output**:

```
Switched to configuration 'staging'.
Server: https://staging.example.com
```

### Examples

```bash
# Switch to staging configuration
prom config use staging

# Switch to production configuration
prom config use production
```

### Exit Codes

| Code | Description                    |
| ---- | ------------------------------ |
| 0    | Success                        |
| 1    | Configuration name not found   |
| 2    | File system error (read/write) |

### Error Messages

```
Error: Configuration 'qa' not found.
Available configurations: production, staging, dev

Run 'prom config list' to see all configurations.

Error: No configurations found.
Add a configuration first:
  prom config add <name> <url>
```

---

## Command: `prom config current`

### Syntax

```bash
prom config current [options]
```

### Arguments

None.

### Options

| Option | Short | Type | Default | Description |
| ------ | ----- | ---- | ------- | ----------- |
| --help | -h    | flag | -       | Show help   |

### Behavior

**Success Path**:

1. Load ConfigStore from file
2. Get active configuration name
3. Get active configuration details
4. Display configuration details with masked credentials

**Output (with active configuration)**:

```
Current configuration: production

Server URL: https://prod.example.com
Authentication: Basic (username: admin)
```

**Output (bearer token authentication)**:

```
Current configuration: staging

Server URL: https://staging.example.com
Authentication: Bearer token
```

**Output (no authentication)**:

```
Current configuration: dev

Server URL: http://localhost:9090
Authentication: None
```

**Output (no active configuration)**:

```
No active configuration.

Add a configuration:
  prom config add <name> <url>

Example:
  prom config add production https://prometheus.example.com
```

### Examples

```bash
# Show current configuration
prom config current
```

### Exit Codes

| Code | Description                     |
| ---- | ------------------------------- |
| 0    | Success (includes no config)    |
| 2    | File system error (read failed) |

### Error Messages

```
Error: Unable to read configuration file.
Check permissions on ~/.prom-cli/config.json
```

---

## Command: `prom config remove`

### Syntax

```bash
prom config remove <name> [options]
```

### Arguments

| Argument | Type   | Required | Description                     |
| -------- | ------ | -------- | ------------------------------- |
| name     | string | Yes      | Name of configuration to remove |

### Options

| Option  | Short | Type | Default | Description                           |
| ------- | ----- | ---- | ------- | ------------------------------------- |
| --force | -f    | flag | false   | Force removal of active configuration |
| --yes   | -y    | flag | false   | Skip confirmation prompt              |
| --help  | -h    | flag | -       | Show help                             |

### Behavior

**Success Path (inactive configuration)**:

1. Load ConfigStore from file
2. Verify configuration name exists
3. Check if configuration is active
4. If active and no --force flag, display error
5. If inactive or --force provided, prompt for confirmation (unless --yes flag)
6. Remove configuration from configs object
7. If removed config was active, set activeConfig to undefined
8. Save updated ConfigStore to file
9. Display success message

**Confirmation Prompt**:

```
Are you sure you want to remove configuration 'staging'? (y/N):
```

**Output (success)**:

```
Configuration 'staging' removed successfully.

# If removed active config with --force:
Configuration 'production' removed successfully.
No active configuration set.
Run 'prom config use <name>' to activate a configuration.
```

### Examples

```bash
# Remove inactive configuration
prom config remove staging

# Remove configuration without confirmation
prom config remove staging --yes

# Force remove active configuration
prom config remove production --force

# Force remove with auto-confirm
prom config remove production --force --yes
```

### Exit Codes

| Code | Description                                        |
| ---- | -------------------------------------------------- |
| 0    | Success                                            |
| 1    | Configuration not found                            |
| 1    | Attempting to remove active config without --force |
| 1    | User cancelled confirmation                        |
| 2    | File system error (read/write)                     |

### Error Messages

```
Error: Configuration 'qa' not found.
Available configurations: production, staging, dev

Error: Cannot remove active configuration 'production'.
Switch to another configuration first, or use --force to remove anyway:
  prom config remove production --force

Operation cancelled.
```

---

## Breaking Changes from Previous Version

### Command: `prom config` (without arguments)

**Old Behavior**:

```bash
prom config --show
# Displays: Current configuration details
```

**New Behavior**:

```bash
prom config
# Displays: Help message with available subcommands

# To show current config, use:
prom config current
```

**Help Output**:

```
Usage: prom config <subcommand> [options]

Manage Prometheus server configurations

Subcommands:
  add <name> <url>     Add a new configuration
  list                 List all configurations
  use <name>           Switch to a configuration
  current              Show current configuration
  remove <name>        Remove a configuration

Options:
  -h, --help          Show help

Examples:
  prom config add prod https://prometheus.example.com
  prom config list
  prom config use prod
  prom config current
  prom config remove staging

For more help on a subcommand:
  prom config <subcommand> --help
```

### Command: `prom config <url>` (REMOVED)

**Old Behavior**:

```bash
prom config https://prometheus.example.com [--username <user>] [--password <pass>] [--token <token>] [--timeout <ms>]
# Sets server URL and authentication
```

**New Behavior** (Breaking Change):

The old `prom config <url>` command format is no longer supported. Users must use the new subcommand syntax:

```bash
# Old command (no longer works):
prom config https://prometheus.example.com --username admin --password secret

# New command:
prom config add default https://prometheus.example.com --username admin --password secret
```

**Migration Notes**:

- Configuration **file format** is automatically migrated (no data loss)
- CLI interface requires learning new subcommand syntax
- The `--timeout` option is not supported in this version (may be added in future)

---

## Integration with Existing Commands

All existing prom commands continue to work unchanged and automatically use the active configuration:

```bash
# These commands automatically use active configuration
prom query 'up'
prom targets
prom labels
prom series 'up'
prom query-range 'up' --start 1h --end now
prom status
```

**No changes required to existing command implementations** - they all call `loadConfig()` which now returns the active configuration from ConfigStore.

---

## Configuration File Migration

### Automatic Migration Trigger

Migration occurs automatically on **any** prom command execution when old format detected.

**Detection Logic**:

```typescript
// Old format has serverUrl at root level
if (rawConfig.serverUrl && !rawConfig.configs) {
  // Old format detected - migrate
}
```

**Migration Output**:

```
Migrating configuration to multi-config format...
Configuration backed up to: ~/.prom-cli/config.json.backup
Default configuration created from existing settings.
Migration complete.

Run 'prom config list' to see your configurations.
Run 'prom config add <name> <url>' to add more configurations.
```

### Manual Rollback

Users can rollback by restoring backup:

```bash
cp ~/.prom-cli/config.json.backup ~/.prom-cli/config.json
```

---

## Testing Verification

**Test Scenarios**:

1. Add first configuration (becomes active automatically)
2. Add second configuration (remains inactive)
3. List configurations (shows active indicator)
4. Switch active configuration
5. Show current configuration details
6. Remove inactive configuration
7. Attempt to remove active configuration without --force (error)
8. Force remove active configuration
9. Handle duplicate configuration names
10. Handle invalid configuration names
11. Handle invalid URLs
12. Handle invalid authentication combinations
13. Automatic migration from old format
14. All existing commands work with active config

---

## Error Handling Strategy

**Principle**: Fail fast with clear, actionable error messages.

**Error Message Format**:

```
Error: <what went wrong>
<why it's a problem>
<how to fix it>
```

**Examples**:

```
Error: Configuration 'prod--west' is invalid.
Configuration names must contain only letters, numbers, hyphens, and underscores.
Consecutive special characters are not allowed.

Error: URL must start with http:// or https://
Provided: prometheus.example.com
Try: https://prometheus.example.com

Error: Password required when username is provided.
Provide both username and password for basic authentication:
  prom config add prod https://... --username admin --password secret
```

---

## References

- Data model: [../data-model.md](../data-model.md)
- Research decisions: [../research.md](../research.md)
- Feature specification: [../spec.md](../spec.md)
