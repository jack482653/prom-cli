# Feature Specification: README Documentation

**Feature Branch**: `002-readme`
**Created**: 2025-01-02
**Status**: Draft
**Input**: User description: "我們需要有一份 README 文件"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Quick Start (Priority: P1)

A developer discovers prom-cli and wants to quickly understand what it does and how to get started. They should be able to install and run their first command within 5 minutes of reading the README.

**Why this priority**: First impressions determine adoption. If users can't quickly understand and use the tool, they'll abandon it.

**Independent Test**: A new user can follow the README to install prom-cli and successfully run `prom status` against their Prometheus server.

**Acceptance Scenarios**:

1. **Given** a developer reading the README, **When** they follow the installation steps, **Then** they can install prom-cli successfully using pnpm/npm.
2. **Given** an installed prom-cli, **When** the user follows the configuration example, **Then** they can configure their Prometheus server URL.
3. **Given** a configured prom-cli, **When** the user runs a sample command from the README, **Then** they see expected output.

---

### User Story 2 - Command Reference (Priority: P2)

A user who has installed prom-cli needs to understand all available commands and their options. They should find clear documentation for each command with practical examples.

**Why this priority**: After installation, users need reference material to use all features effectively.

**Independent Test**: User can find documentation for any command (config, query, targets, status) and understand its usage without external help.

**Acceptance Scenarios**:

1. **Given** a user looking for command help, **When** they read the command reference section, **Then** they find all four commands documented (config, query, targets, status).
2. **Given** a user wanting to use a specific command, **When** they read that command's section, **Then** they find usage syntax, options, and at least one example.
3. **Given** a user wanting JSON output, **When** they read the documentation, **Then** they understand how to use the `--json` flag.

---

### User Story 3 - Authentication Setup (Priority: P3)

A user needs to connect to a Prometheus server that requires authentication. They should find clear instructions for both basic auth and bearer token methods.

**Why this priority**: Many production Prometheus servers require authentication; users need to know how to configure credentials.

**Independent Test**: User can successfully configure authentication (basic or bearer) by following the README instructions.

**Acceptance Scenarios**:

1. **Given** a user with a basic auth protected server, **When** they follow the authentication section, **Then** they can configure username and password.
2. **Given** a user with a bearer token protected server, **When** they follow the authentication section, **Then** they can configure the token.

---

### Edge Cases

- What happens when a user has an older Node.js version? README should specify minimum Node.js version requirement.
- What happens when a user is on Windows? Installation steps should work cross-platform.
- What happens when examples don't match user's environment? Examples should use generic/localhost URLs that users can adapt.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: README MUST include a project description explaining what prom-cli does
- **FR-002**: README MUST include installation instructions for pnpm and npm
- **FR-003**: README MUST specify minimum Node.js version requirement (18+)
- **FR-004**: README MUST include quick start section with first-run example
- **FR-005**: README MUST document all four commands: config, query, targets, status
- **FR-006**: README MUST include usage examples with expected output for each command
- **FR-007**: README MUST document authentication options (basic auth, bearer token)
- **FR-008**: README MUST include the `--json` output option documentation
- **FR-009**: README MUST include license information

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: New users can complete installation and first command within 5 minutes
- **SC-002**: All four CLI commands are documented with at least one example each
- **SC-003**: README contains all sections: description, installation, configuration, usage, authentication, license
- **SC-004**: README accurately reflects current CLI functionality and options

## Assumptions

- Users have Node.js 18+ installed or know how to install it
- Users have pnpm or npm available as package manager
- Users have basic terminal/command-line familiarity
- README will be in English (standard for open source projects)
- README follows standard GitHub README conventions
- Examples will use localhost:9090 as the default Prometheus URL
