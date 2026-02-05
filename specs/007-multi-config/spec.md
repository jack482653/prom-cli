# Feature Specification: Multi-Config Management

**Feature Branch**: `007-multi-config`
**Created**: 2025-02-05
**Status**: Draft
**Input**: User description: "Support multiple named Prometheus server configurations and switch between them. Users can manage multiple Prometheus servers (e.g., production, staging, development) with separate configurations. Each configuration should have a name, server URL, and optional authentication settings."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Add Named Configuration (Priority: P1)

As a user, I want to add a new named Prometheus server configuration so that I can manage multiple servers without overwriting my existing configuration.

**Why this priority**: This is the foundational capability that enables all other multi-config features. Without the ability to add named configurations, users cannot leverage any multi-config functionality. It's also the first step in migrating from single-config to multi-config.

**Independent Test**: Can be fully tested by running `prom config add <name> <url>` and verifying the configuration is stored and can be activated.

**Acceptance Scenarios**:

1. **Given** no existing configurations, **When** user runs `prom config add production https://prod.example.com`, **Then** system creates a new configuration named "production" and sets it as active
2. **Given** one existing configuration "production", **When** user runs `prom config add staging https://staging.example.com --username admin --password secret`, **Then** system creates a second configuration with authentication settings
3. **Given** existing configurations, **When** user runs `prom config add dev https://dev.example.com --token abc123`, **Then** system creates a configuration with bearer token authentication
4. **Given** a configuration named "prod" already exists, **When** user tries to add another "prod" configuration, **Then** system displays error message and does not overwrite existing config
5. **Given** user provides invalid URL format, **When** adding configuration, **Then** system validates URL and displays helpful error message

---

### User Story 2 - List All Configurations (Priority: P1)

As a user, I want to list all my saved configurations so that I can see which Prometheus servers I have configured and which one is currently active.

**Why this priority**: Essential for discoverability and orientation. Users need to know what configurations exist before they can switch between them. This is critical for preventing user confusion about which server they're currently querying.

**Independent Test**: Can be fully tested by running `prom config list` and verifying all configurations are displayed with an indicator showing the active one.

**Acceptance Scenarios**:

1. **Given** no configurations exist, **When** user runs `prom config list`, **Then** system displays message "No configurations found. Add one with: prom config add <name> <url>"
2. **Given** three configurations ("production", "staging", "dev") with "production" active, **When** user runs `prom config list`, **Then** system displays all three configurations with an indicator (e.g., asterisk or arrow) next to "production"
3. **Given** configurations with different authentication types, **When** listing, **Then** system shows masked authentication info (e.g., "Auth: username/password" or "Auth: bearer token")
4. **Given** multiple configurations, **When** listing, **Then** configurations are sorted alphabetically for easy scanning

---

### User Story 3 - Switch Active Configuration (Priority: P1)

As a user, I want to switch between my saved configurations so that I can query different Prometheus servers without re-entering connection details.

**Why this priority**: This is the core value proposition of multi-config support. Users need quick switching between environments (prod/staging/dev) for effective troubleshooting and monitoring workflows.

**Independent Test**: Can be fully tested by running `prom config use <name>` and verifying subsequent commands use the switched configuration.

**Acceptance Scenarios**:

1. **Given** configurations "production" and "staging" exist with "production" active, **When** user runs `prom config use staging`, **Then** system switches active config to "staging" and confirms with message
2. **Given** active configuration is "staging", **When** user runs `prom targets`, **Then** system queries the staging Prometheus server
3. **Given** user tries to switch to non-existent configuration, **When** running `prom config use nonexistent`, **Then** system displays error listing available configurations
4. **Given** configuration switch succeeds, **When** user runs any query command, **Then** commands use the newly active configuration without additional flags

---

### User Story 4 - Show Current Configuration (Priority: P2)

As a user, I want to see which configuration is currently active and its details so that I know which Prometheus server I'm querying.

**Why this priority**: Provides situational awareness and prevents accidental operations on wrong servers. Less critical than switching capabilities but important for safety and user confidence.

**Independent Test**: Can be fully tested by running `prom config current` and verifying it displays the active configuration with full details.

**Acceptance Scenarios**:

1. **Given** "production" configuration is active, **When** user runs `prom config current`, **Then** system displays configuration name, URL, and authentication type (masked)
2. **Given** no configurations exist, **When** user runs `prom config current`, **Then** system displays message "No active configuration. Add one with: prom config add <name> <url>"
3. **Given** active configuration exists, **When** displaying current config, **Then** sensitive data (passwords, tokens) are masked but presence is indicated

---

### User Story 5 - Remove Configuration (Priority: P2)

As a user, I want to remove configurations I no longer need so that my configuration list stays clean and manageable.

**Why this priority**: Important for housekeeping but not essential for core workflow. Users can work effectively even with unused configurations present.

**Independent Test**: Can be fully tested by running `prom config remove <name>` and verifying the configuration is deleted and list is updated.

**Acceptance Scenarios**:

1. **Given** configurations "production" and "staging" exist with "production" active, **When** user runs `prom config remove staging`, **Then** system removes "staging" configuration and "production" remains active
2. **Given** only one configuration "production" exists and is active, **When** user tries to remove it, **Then** system displays error "Cannot remove active configuration. Switch to another config first or use --force flag"
3. **Given** configuration "dev" is active and user removes it with `--force`, **When** removal completes, **Then** system removes config and leaves no active configuration (user must add or switch to another)
4. **Given** user tries to remove non-existent configuration, **When** running `prom config remove nonexistent`, **Then** system displays error listing available configurations
5. **Given** user runs remove command, **When** prompted for confirmation, **Then** system asks "Are you sure you want to remove configuration 'name'? (y/N)" and only proceeds if confirmed

---

### User Story 6 - Backward Compatibility Migration (Priority: P1)

As an existing user with a single config.json file, I want my configuration to automatically migrate to the new multi-config structure so that I don't lose my settings or experience breaking changes.

**Why this priority**: Critical for ensuring zero breaking changes for existing users. Without automatic migration, updating prom-cli would break existing installations. This is a P1 requirement for user trust and smooth upgrades.

**Independent Test**: Can be fully tested by placing an old-format config.json file, running any prom command, and verifying it migrates to multi-config format with a default configuration name.

**Acceptance Scenarios**:

1. **Given** old single-config config.json exists at `~/.prom-cli/config.json`, **When** user runs any prom command (e.g., `prom targets`), **Then** system automatically migrates config to new format with name "default" and sets it as active
2. **Given** migration has occurred, **When** checking configuration structure, **Then** old config.json is either renamed to config.json.backup or remains for rollback capability
3. **Given** old config had authentication settings, **When** migrating, **Then** all authentication settings are preserved in the "default" configuration
4. **Given** migration completes, **When** user runs commands, **Then** all existing commands continue to work without any user intervention or configuration changes

---

### Edge Cases

- What happens when a configuration name contains special characters or spaces?
- How does the system handle extremely long configuration names (e.g., 200+ characters)?
- What happens if the config file is corrupted or has invalid JSON?
- How does the system behave if filesystem permissions prevent reading/writing config files?
- What happens when two terminal sessions try to switch configurations simultaneously?
- How are existing commands affected if someone manually deletes the active configuration from the file while a command is running?
- What happens if the user has both old config.json and new multi-config format files present?
- How does the system handle migration if old config.json has unexpected fields or structure?
- What happens when trying to add a configuration with an invalid URL scheme (e.g., ftp://, file://)?
- How are conflicts resolved if two configurations point to the same URL but have different names?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support adding named configurations via `prom config add <name> <url>` command with name and URL as required parameters
- **FR-002**: System MUST support optional authentication parameters `--username`, `--password`, and `--token` when adding configurations
- **FR-003**: System MUST prevent duplicate configuration names and display clear error messages when attempting to add duplicates
- **FR-004**: System MUST validate URL format when adding configurations and reject invalid URLs with helpful error messages
- **FR-005**: System MUST list all saved configurations via `prom config list` command showing configuration names and active status
- **FR-006**: System MUST indicate which configuration is currently active in the list output (e.g., with asterisk or special marker)
- **FR-007**: System MUST support switching active configuration via `prom config use <name>` command
- **FR-008**: System MUST display helpful error when user attempts to switch to non-existent configuration, listing available options
- **FR-009**: System MUST display current active configuration details via `prom config current` command
- **FR-010**: System MUST mask sensitive authentication data (passwords, tokens) in list and current commands while indicating presence
- **FR-011**: System MUST support removing configurations via `prom config remove <name>` command
- **FR-012**: System MUST prevent removing the currently active configuration without explicit confirmation (--force flag)
- **FR-013**: System MUST prompt for confirmation before removing any configuration
- **FR-014**: System MUST automatically detect and migrate old single-config format to new multi-config format on first command execution
- **FR-015**: System MUST preserve all settings from old config during migration, including authentication credentials
- **FR-016**: System MUST create a default configuration named "default" when migrating old single-config
- **FR-017**: System MUST backup or preserve old config.json file during migration for rollback capability
- **FR-018**: All existing commands (query, targets, labels, series, status, query-range) MUST use the currently active configuration
- **FR-019**: System MUST handle concurrent access to configuration file safely (prevent corruption from simultaneous edits)
- **FR-020**: System MUST validate configuration file integrity on load and provide recovery options for corrupted files
- **FR-021**: Configuration names MUST be unique, case-sensitive, and support alphanumeric characters, hyphens, and underscores
- **FR-022**: System MUST persist configuration changes immediately after successful add/remove/switch operations
- **FR-023**: System MUST provide clear feedback messages for all configuration operations (add, list, use, current, remove)
- **FR-024**: System MUST handle missing or empty configuration file gracefully with clear instructions for adding first config

### Key Entities

- **Configuration**: Represents a named Prometheus server connection with attributes: name (unique identifier), serverUrl (Prometheus endpoint), authentication (optional credentials - username/password OR bearer token), and active status (boolean indicating if currently in use)
- **ConfigStore**: Manages persistence of multiple configurations with attributes: configurations (collection of Configuration entities), activeConfigName (identifier of currently active config), and file version (for future migration compatibility)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can add a new configuration in under 10 seconds, including entering command and receiving confirmation
- **SC-002**: Users can switch between configurations in under 3 seconds without re-entering connection details
- **SC-003**: Configuration listing displays all configs clearly with active indicator visible within 2 seconds
- **SC-004**: Existing users experience zero breaking changes - all commands continue working after upgrade without manual intervention
- **SC-005**: Migration from single-config to multi-config completes automatically within 1 second on first command execution
- **SC-006**: Users can manage up to 20 named configurations without performance degradation (list/switch operations remain under 3 seconds)
- **SC-007**: 100% of authentication settings are preserved during migration (no data loss)
- **SC-008**: Configuration operations provide immediate feedback with success/error messages within 1 second
- **SC-009**: Users can identify their current configuration context within 2 seconds using list or current command
- **SC-010**: Configuration removal operations complete safely with confirmation prompt, preventing accidental deletions

## Scope _(mandatory)_

### In Scope

- Adding, listing, switching, displaying, and removing named configurations
- Support for multiple authentication methods (username/password, bearer token) per configuration
- Automatic migration from existing single-config format to multi-config format
- Backward compatibility ensuring existing commands work with multi-config system
- Safe concurrent access to configuration file
- Configuration name validation and uniqueness enforcement
- Clear user feedback for all configuration operations
- Masking sensitive data in configuration display commands

### Out of Scope

- Importing/exporting configurations to share between machines or users
- Configuration synchronization across multiple machines
- Configuration profiles or groups (all configs are at same level)
- Encryption at rest for stored credentials (relies on filesystem permissions)
- Remote configuration storage or cloud sync
- Configuration versioning or change history
- Automatic configuration selection based on context (e.g., current directory)
- Configuration templates or defaults for common setups
- Bulk operations on multiple configurations simultaneously
- Configuration aliases or shortcuts beyond the name itself

## Assumptions _(mandatory)_

- Users have filesystem write permissions to `~/.prom-cli/` directory for storing configurations
- Configuration file size remains reasonable (< 100 configs, < 1MB file size) for typical use cases
- Users understand the concept of named configurations and active configuration selection
- Existing single-config users are running commands from a terminal where migration can occur seamlessly
- Configuration names are primarily ASCII alphanumeric for cross-platform compatibility
- Users manage their own credential security (prom-cli stores credentials in plaintext, protected by filesystem permissions)
- Migration from old config format will occur during a time when the config is not corrupted
- Multiple terminal sessions accessing configuration simultaneously is an edge case, not common usage pattern
- Users prefer explicit switching commands over automatic context detection (simpler, more predictable)
- "default" is an acceptable name for migrated configurations (no user has critical attachment to custom names on first use)
