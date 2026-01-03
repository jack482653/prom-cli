<!--
=== Sync Impact Report ===
Version change: 1.1.0 → 1.2.0 (Minor - added Git Commit Standards)
Modified principles: None
Added sections:
  - Git Commit Standards (under Development Workflow)
Removed sections: None
Templates requiring updates:
  ✅ plan-template.md - No changes needed
  ✅ spec-template.md - No changes needed
  ✅ tasks-template.md - Compatible (task-based commits align with task structure)
Follow-up TODOs: None
========================
-->

# prom-cli Constitution

## Core Principles

### I. Code Quality

Code MUST be readable, maintainable, and follow established patterns.

- All code MUST pass linting and formatting checks (prettier) before commit
- Functions MUST have single responsibility - one function, one purpose
- Variable and function names MUST be descriptive and self-documenting
- Magic numbers and strings MUST be extracted to named constants
- Code duplication MUST be eliminated when pattern appears 3+ times

**Rationale**: High code quality reduces bugs, eases maintenance, and enables confident refactoring.

### II. Testing Standards (TDD/BDD)

Testing MUST follow Test-Driven Development and Behavior-Driven Development principles.

**TDD Workflow (Red → Green → Refactor)**:

- Tests MUST be written before implementation code
- Tests MUST fail initially (Red) to verify they test the right thing
- Implementation MUST be minimal to make tests pass (Green)
- Code SHOULD be refactored only after tests pass (Refactor)

**BDD Approach**:

- Acceptance scenarios from spec.md MUST drive test design
- Test names MUST describe behavior using Given/When/Then or describe/it patterns
- Tests MUST validate user-observable behavior, not implementation details

**Test Quality**:

- Public API contracts MUST have corresponding tests
- Error paths MUST be tested alongside happy paths
- Tests MUST be deterministic - no flaky tests allowed
- Mocking SHOULD be limited to external dependencies only

**Rationale**: TDD ensures testable design and prevents untested code. BDD aligns tests with user requirements and serves as living documentation.

### III. User Experience Consistency

CLI output MUST be predictable and user-friendly.

- All commands MUST provide `--help` with clear usage instructions
- Error messages MUST be actionable - tell users how to fix the problem
- Output format MUST be consistent across all commands (JSON option available)
- Exit codes MUST follow conventions: 0 for success, non-zero for errors
- Progress feedback MUST be provided for operations exceeding 1 second

**Rationale**: Consistent UX reduces learning curve and enables scripting/automation.

### IV. Performance Requirements

CLI MUST respond quickly and use resources efficiently.

- Command initialization MUST complete within 100ms
- API timeout MUST be configurable with sensible defaults (30s)
- Memory usage MUST remain stable regardless of result set size (streaming)
- Network errors MUST be handled gracefully with retry logic where appropriate

**Rationale**: CLI tools are often used in scripts and pipelines where performance matters.

### V. MVP First

Deliver working functionality incrementally, starting with minimum viable features.

- Each feature MUST be usable independently after completion
- Implementation MUST prioritize P1 (core) features before P2/P3
- A feature is "done" when it delivers user value, not when it's perfect
- Shipping beats perfection - iterate based on real usage feedback
- Each PR SHOULD deliver a complete, testable slice of functionality

**Rationale**: Early delivery enables faster feedback loops and reduces wasted effort.

### VI. No Overdesign (NON-NEGOTIABLE)

Code MUST solve current problems only, not hypothetical future ones.

- Abstractions MUST NOT be created until pattern appears 3+ times
- Configuration options MUST NOT be added "just in case"
- Three lines of similar code is acceptable; premature abstraction is not
- YAGNI (You Aren't Gonna Need It) - delete speculative code immediately
- Complexity MUST be justified in PR description if unavoidable

**Rationale**: Overdesign creates maintenance burden without delivering value. Simple code is easier to change when real requirements emerge.

## Development Workflow

- Feature branches MUST be created from main
- Code MUST be formatted with `pnpm format` before commit
- Commits SHOULD be atomic and focused on single logical change
- PR descriptions MUST explain what and why, not just how
- Tests MUST be written before implementation (TDD)

### Git Commit Standards

**Commit Frequency** - Every completed task (T001, T002, etc.) MUST have its own commit:

- After completing each individual task
- When transitioning between task categories (Infrastructure → API → CLI, etc.)
- When abandoning a plan (commit with immediate reasoning)

**Commit Message Format**:

```
<type>(<scope>): <message title>

- Bullet points summarizing what was updated
```

**Allowed Types**:

| Type     | Description                           |
| -------- | ------------------------------------- |
| feat     | New feature                           |
| fix      | Bug fix                               |
| chore    | Maintenance (e.g., tooling, deps)     |
| docs     | Documentation changes                 |
| refactor | Code restructure (no behavior change) |
| test     | Adding or refactoring tests           |
| style    | Code formatting (no logic change)     |
| perf     | Performance improvements              |

**Rules**:

- Title MUST be lowercase, no period at the end
- Title MUST be a clear summary, max 50 characters
- Body (optional) SHOULD explain _why_, not just _what_
- Bullet points MUST be concise and high-level
- Vague titles like "update", "fix stuff" are NOT allowed

## Quality Gates

Before merging, all PRs MUST pass:

1. **Lint/Format**: `pnpm format:check` passes
2. **Type Check**: `pnpm build` compiles without errors
3. **Tests**: All tests pass with `pnpm test`
4. **Coverage**: New code MUST have corresponding tests
5. **Manual Verification**: Feature works as described

## Governance

This constitution defines non-negotiable standards for the prom-cli project.

- Constitution MUST be consulted before adding new features or patterns
- Violations MUST be documented and justified if unavoidable
- Amendments require updating this document with rationale
- When in doubt, choose the simpler solution

**Version**: 1.2.0 | **Ratified**: 2024-12-31 | **Last Amended**: 2025-01-03
