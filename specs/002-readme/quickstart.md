# README Quickstart Guide

This document outlines the README.md structure and content requirements for prom-cli.

## README Structure

```markdown
# prom-cli

[One-line description]

## Features

- List of 4-5 key features

## Prerequisites

- Node.js 18+

## Installation

### pnpm (recommended)

pnpm add -g prom-cli

### npm

npm install -g prom-cli

## Quick Start

1. Configure server
2. Run first command
3. See output

## Commands

### prom config

[Usage, options, example]

### prom targets

[Usage, options, example with output]

### prom query

[Usage, options, example with output]

### prom status

[Usage, options, example with output]

## Authentication

### Basic Auth

[Example]

### Bearer Token

[Example]

## Output Formats

### Table (default)

[Example]

### JSON

[Example with --json flag]

## License

MIT
```

## Content Requirements Checklist

- [ ] Project description is clear and concise
- [ ] All four commands documented with examples
- [ ] Installation works for both pnpm and npm
- [ ] Authentication examples cover both methods
- [ ] --json flag documented for applicable commands
- [ ] Examples use localhost:9090 (adaptable)
- [ ] Node.js version requirement stated
- [ ] License information included

## Sample Output to Include

Commands that should show sample output:

- `prom targets` - table format showing targets
- `prom query "up"` - vector result display
- `prom status` - server health and version info
