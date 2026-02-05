# Quickstart: Multi-Config Management Implementation

**Feature**: 007-multi-config
**Date**: 2025-02-05
**Purpose**: Step-by-step implementation guide for developers

## Overview

This guide provides a concrete implementation roadmap for adding multi-config management to prom-cli. Follow the phases sequentially to build the feature incrementally with TDD approach.

## Prerequisites

Before starting implementation:

1. Read [spec.md](spec.md) - understand user requirements
2. Read [research.md](research.md) - understand technology decisions
3. Read [data-model.md](data-model.md) - understand data structures
4. Read [contracts/cli-commands.md](contracts/cli-commands.md) - understand CLI behavior

## Implementation Phases

### Phase 1: Setup & Types

**Objective**: Define TypeScript types for multi-config structure

**File**: `src/types/index.ts`

**Steps**:

1. **Add Configuration interface** (if not exists, extend existing):

   ```typescript
   export interface Configuration {
     serverUrl: string;
     username?: string;
     password?: string;
     token?: string;
   }
   ```

2. **Add ConfigStore interface**:

   ```typescript
   export interface ConfigStore {
     activeConfig?: string;
     configs: Record<string, Configuration>;
   }
   ```

3. **Verify TypeScript compilation**:
   ```bash
   pnpm build
   ```

**Expected Outcome**: Types compile successfully, no errors

---

### Phase 2: ConfigStore Module (TDD)

**Objective**: Implement core config storage operations with TDD

**File**: `src/services/config-store.ts` (new file)

**Steps**:

1. **Create test file first** (TDD Red phase):

   **File**: `tests/config-store.test.ts`

   ```typescript
   import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
   import { tmpdir } from "os";
   import { join } from "path";
   import { afterEach, beforeEach, describe, expect, it } from "vitest";

   import {
     addConfiguration,
     getActiveConfig,
     listConfigurations,
     loadConfigStore,
     removeConfiguration,
     saveConfigStore,
     setActiveConfig,
   } from "../src/services/config-store.js";
   import type { ConfigStore, Configuration } from "../src/types/index.js";

   describe("ConfigStore Operations", () => {
     let testConfigDir: string;
     let testConfigPath: string;

     beforeEach(() => {
       // Create temp directory for testing
       testConfigDir = join(tmpdir(), `prom-cli-test-${Date.now()}`);
       mkdirSync(testConfigDir, { recursive: true });
       testConfigPath = join(testConfigDir, "config.json");

       // Override config path for testing (implementation detail)
       process.env.PROM_CLI_CONFIG_PATH = testConfigPath;
     });

     afterEach(() => {
       // Clean up test directory
       if (existsSync(testConfigDir)) {
         rmSync(testConfigDir, { recursive: true, force: true });
       }
       delete process.env.PROM_CLI_CONFIG_PATH;
     });

     describe("Given no config file exists", () => {
       it("When loading config store, Then returns empty store", () => {
         const store = loadConfigStore();

         expect(store).toEqual({
           configs: {},
           activeConfig: undefined,
         });
       });
     });

     describe("Given empty config store", () => {
       it("When adding first configuration, Then becomes active automatically", () => {
         let store = loadConfigStore();

         const config: Configuration = {
           serverUrl: "http://localhost:9090",
         };

         store = addConfiguration(store, "dev", config);

         expect(store.configs["dev"]).toEqual(config);
         expect(store.activeConfig).toBe("dev");
       });
     });

     describe("Given one config exists", () => {
       it("When adding second configuration, Then remains inactive", () => {
         let store = loadConfigStore();

         store = addConfiguration(store, "dev", {
           serverUrl: "http://localhost:9090",
         });

         store = addConfiguration(store, "prod", {
           serverUrl: "https://prod.example.com",
         });

         expect(store.configs["prod"]).toBeDefined();
         expect(store.activeConfig).toBe("dev"); // Still dev
       });
     });

     describe("Given multiple configurations", () => {
       it("When switching active config, Then updates activeConfig field", () => {
         let store = loadConfigStore();

         store = addConfiguration(store, "dev", {
           serverUrl: "http://localhost:9090",
         });
         store = addConfiguration(store, "prod", {
           serverUrl: "https://prod.example.com",
         });

         store = setActiveConfig(store, "prod");

         expect(store.activeConfig).toBe("prod");
       });

       it("When removing inactive config, Then active remains unchanged", () => {
         let store = loadConfigStore();

         store = addConfiguration(store, "dev", {
           serverUrl: "http://localhost:9090",
         });
         store = addConfiguration(store, "prod", {
           serverUrl: "https://prod.example.com",
         });

         store = removeConfiguration(store, "prod");

         expect(store.configs["prod"]).toBeUndefined();
         expect(store.activeConfig).toBe("dev");
       });
     });
   });
   ```

2. **Run tests** (should fail - Red phase):

   ```bash
   pnpm test config-store.test.ts
   ```

3. **Implement ConfigStore functions** (Green phase):

   **File**: `src/services/config-store.ts`

   ```typescript
   import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
   import { homedir } from "os";
   import { join } from "path";

   import type { ConfigStore, Configuration } from "../types/index.js";

   const CONFIG_DIR = join(homedir(), ".prom-cli");
   const CONFIG_FILE = join(CONFIG_DIR, "config.json");

   function getConfigPath(): string {
     // Allow override for testing
     return process.env.PROM_CLI_CONFIG_PATH || CONFIG_FILE;
   }

   export function loadConfigStore(): ConfigStore {
     const configPath = getConfigPath();

     if (!existsSync(configPath)) {
       return {
         configs: {},
         activeConfig: undefined,
       };
     }

     try {
       const rawData = readFileSync(configPath, "utf-8");
       const data = JSON.parse(rawData);

       // Validate structure
       if (!data.configs || typeof data.configs !== "object") {
         throw new Error("Invalid config structure");
       }

       return data as ConfigStore;
     } catch (error) {
       throw new Error(`Failed to load config: ${error.message}`);
     }
   }

   export function saveConfigStore(store: ConfigStore): void {
     const configPath = getConfigPath();
     const configDir = join(configPath, "..");

     // Ensure directory exists
     if (!existsSync(configDir)) {
       mkdirSync(configDir, { recursive: true });
     }

     // Atomic write using temp file
     const tempPath = `${configPath}.tmp`;
     writeFileSync(tempPath, JSON.stringify(store, null, 2), "utf-8");

     // Atomic rename
     renameSync(tempPath, configPath);
   }

   export function addConfiguration(
     store: ConfigStore,
     name: string,
     config: Configuration,
   ): ConfigStore {
     const newStore = { ...store };

     // Check for duplicates
     if (newStore.configs[name]) {
       throw new Error(`Configuration '${name}' already exists`);
     }

     newStore.configs[name] = config;

     // Set as active if first config
     if (Object.keys(newStore.configs).length === 1) {
       newStore.activeConfig = name;
     }

     return newStore;
   }

   export function removeConfiguration(store: ConfigStore, name: string): ConfigStore {
     const newStore = { ...store };

     // Check if exists
     if (!newStore.configs[name]) {
       throw new Error(`Configuration '${name}' not found`);
     }

     delete newStore.configs[name];

     // Clear active if removed config was active
     if (newStore.activeConfig === name) {
       newStore.activeConfig = undefined;
     }

     return newStore;
   }

   export function setActiveConfig(store: ConfigStore, name: string): ConfigStore {
     if (!store.configs[name]) {
       throw new Error(`Configuration '${name}' not found`);
     }

     return {
       ...store,
       activeConfig: name,
     };
   }

   export function getActiveConfig(store: ConfigStore): Configuration | null {
     if (!store.activeConfig) {
       return null;
     }

     return store.configs[store.activeConfig] || null;
   }

   export function listConfigurations(store: ConfigStore): string[] {
     return Object.keys(store.configs).sort();
   }
   ```

4. **Run tests again** (should pass - Green phase):

   ```bash
   pnpm test config-store.test.ts
   ```

5. **Refactor if needed** (Refactor phase):
   - Extract validation to separate functions
   - Add JSDoc comments
   - Ensure code quality per constitution

**Expected Outcome**: All ConfigStore tests pass (Green), code is clean (Refactor)

---

### Phase 3: Migration Logic (TDD)

**Objective**: Implement automatic migration from old format

**File**: `src/services/config-migration.ts` (new file)

**Steps**:

1. **Create test file first** (TDD Red):

   **File**: `tests/config-migration.test.ts`

   ```typescript
   import { describe, expect, it } from "vitest";

   import { detectOldFormat, migrateOldConfig } from "../src/services/config-migration.js";
   import type { Configuration } from "../src/types/index.js";

   describe("Config Migration", () => {
     describe("Given old format config", () => {
       it("When detecting format, Then identifies as old format", () => {
         const oldConfig = {
           serverUrl: "https://prometheus.example.com",
           username: "admin",
           password: "secret",
         };

         expect(detectOldFormat(oldConfig)).toBe(true);
       });

       it("When migrating, Then creates default config", () => {
         const oldConfig = {
           serverUrl: "https://prometheus.example.com",
           username: "admin",
           password: "secret",
         };

         const newStore = migrateOldConfig(oldConfig);

         expect(newStore.activeConfig).toBe("default");
         expect(newStore.configs["default"]).toEqual({
           serverUrl: "https://prometheus.example.com",
           username: "admin",
           password: "secret",
         });
       });
     });

     describe("Given new format config", () => {
       it("When detecting format, Then identifies as new format", () => {
         const newConfig = {
           activeConfig: "production",
           configs: {
             production: {
               serverUrl: "https://prod.example.com",
             },
           },
         };

         expect(detectOldFormat(newConfig)).toBe(false);
       });
     });
   });
   ```

2. **Implement migration functions** (TDD Green):

   **File**: `src/services/config-migration.ts`

   ```typescript
   import { copyFileSync, existsSync } from "fs";
   import { join } from "path";

   import type { ConfigStore, Configuration } from "../types/index.js";

   export function detectOldFormat(data: any): boolean {
     return (
       typeof data === "object" && data !== null && "serverUrl" in data && !("configs" in data)
     );
   }

   export function migrateOldConfig(oldConfig: any): ConfigStore {
     // Extract old config fields
     const config: Configuration = {
       serverUrl: oldConfig.serverUrl,
     };

     if (oldConfig.username) {
       config.username = oldConfig.username;
     }
     if (oldConfig.password) {
       config.password = oldConfig.password;
     }
     if (oldConfig.token) {
       config.token = oldConfig.token;
     }

     // Create new store with "default" config
     return {
       activeConfig: "default",
       configs: {
         default: config,
       },
     };
   }

   export function backupOldConfig(configPath: string): void {
     if (existsSync(configPath)) {
       const backupPath = `${configPath}.backup`;
       copyFileSync(configPath, backupPath);
       console.log(`Configuration backed up to: ${backupPath}`);
     }
   }
   ```

3. **Run tests**:
   ```bash
   pnpm test config-migration.test.ts
   ```

**Expected Outcome**: Migration tests pass

---

### Phase 4: Update Existing loadConfig() (TDD)

**Objective**: Refactor existing loadConfig() to support multi-config and migration

**File**: `src/services/config.ts` (existing file)

**Steps**:

1. **Add tests for new loadConfig behavior**:

   **File**: `tests/config.test.ts` (extend existing tests)

   ```typescript
   describe("Given old format config exists", () => {
     it("When loading config, Then automatically migrates", () => {
       // Setup: Write old format config
       const oldConfig = {
         serverUrl: "https://prometheus.example.com",
         username: "admin",
         password: "secret",
       };
       fs.writeFileSync(testConfigPath, JSON.stringify(oldConfig), "utf-8");

       // Act: Load config (should trigger migration)
       const config = loadConfig();

       // Assert: Returns migrated config
       expect(config).toEqual({
         serverUrl: "https://prometheus.example.com",
         username: "admin",
         password: "secret",
       });

       // Verify: New format written
       const rawConfig = JSON.parse(fs.readFileSync(testConfigPath, "utf-8"));
       expect(rawConfig.configs).toBeDefined();
       expect(rawConfig.activeConfig).toBe("default");
     });
   });
   ```

2. **Refactor loadConfig()** to integrate migration:

   **File**: `src/services/config.ts`

   ```typescript
   import { backupOldConfig, detectOldFormat, migrateOldConfig } from "./config-migration.js";
   import { getActiveConfig, loadConfigStore, saveConfigStore } from "./config-store.js";

   export function loadConfig(): Configuration | null {
     const configPath = getConfigPath();

     if (!existsSync(configPath)) {
       return null;
     }

     // Load raw config
     const rawData = readFileSync(configPath, "utf-8");
     const rawConfig = JSON.parse(rawData);

     // Check if old format
     if (detectOldFormat(rawConfig)) {
       console.log("Migrating configuration to multi-config format...");
       backupOldConfig(configPath);

       const newStore = migrateOldConfig(rawConfig);
       saveConfigStore(newStore);

       console.log("Migration complete. Default configuration created.");
       console.log("Run 'prom config list' to see your configurations.");

       // Return default config
       return getActiveConfig(newStore);
     }

     // New format - load active config
     const store = rawConfig as ConfigStore;
     return getActiveConfig(store);
   }
   ```

3. **Run tests**:
   ```bash
   pnpm test config.test.ts
   ```

**Expected Outcome**: Existing commands work, migration happens transparently

---

### Phase 5: CLI Command Implementation (TDD)

**Objective**: Implement config subcommands (add, list, use, current, remove)

**File**: `src/commands/config.ts` (extend existing)

**Steps**:

1. **Extend existing config command** with subcommands:

   ```typescript
   import { Command } from "commander";

   import {
     addConfiguration,
     listConfigurations,
     loadConfigStore,
     removeConfiguration,
     saveConfigStore,
     setActiveConfig,
   } from "../services/config-store.js";

   export function createConfigCommand(): Command {
     const cmd = new Command("config").description("Manage Prometheus server configurations");

     // Add subcommand
     cmd
       .command("add <name> <url>")
       .description("Add a new configuration")
       .option("-u, --username <username>", "Basic auth username")
       .option("-p, --password <password>", "Basic auth password")
       .option("-t, --token <token>", "Bearer token")
       .action(async (name: string, url: string, options) => {
         // Implementation here (see contracts/cli-commands.md)
       });

     // List subcommand
     cmd
       .command("list")
       .description("List all configurations")
       .action(async () => {
         // Implementation here
       });

     // Use subcommand
     cmd
       .command("use <name>")
       .description("Switch to a configuration")
       .action(async (name: string) => {
         // Implementation here
       });

     // Current subcommand
     cmd
       .command("current")
       .description("Show current configuration")
       .action(async () => {
         // Implementation here
       });

     // Remove subcommand
     cmd
       .command("remove <name>")
       .description("Remove a configuration")
       .option("-f, --force", "Force remove active configuration")
       .option("-y, --yes", "Skip confirmation")
       .action(async (name: string, options) => {
         // Implementation here
       });

     return cmd;
   }
   ```

2. **Implement each subcommand following contracts**:
   - See [contracts/cli-commands.md](contracts/cli-commands.md) for detailed behavior
   - Write tests for each subcommand before implementing
   - Follow TDD Red-Green-Refactor cycle

3. **Validation functions**:

   ```typescript
   function validateConfigName(name: string): void {
     if (!name || name.length === 0 || name.length > 64) {
       throw new Error("Configuration name must be 1-64 characters");
     }
     if (!/^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(name)) {
       throw new Error(
         "Configuration name must contain only letters, numbers, hyphens, underscores",
       );
     }
   }

   function validateServerUrl(url: string): void {
     try {
       const parsed = new URL(url);
       if (!["http:", "https:"].includes(parsed.protocol)) {
         throw new Error("URL must use http:// or https://");
       }
     } catch (e) {
       throw new Error(`Invalid URL: ${e.message}`);
     }
   }

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

**Expected Outcome**: All config subcommands functional and tested

---

### Phase 6: Integration Testing

**Objective**: Verify all commands work together

**Steps**:

1. **Manual testing**:

   ```bash
   # Test add
   prom config add dev http://localhost:9090
   prom config add prod https://prod.example.com -u admin -p secret

   # Test list
   prom config list

   # Test use
   prom config use prod

   # Test current
   prom config current

   # Test existing commands still work
   prom targets
   prom query 'up'

   # Test remove
   prom config remove dev
   ```

2. **Integration tests**:
   - Test migration flow end-to-end
   - Test switching configs and running queries
   - Test backward compatibility

3. **Format and build**:
   ```bash
   pnpm format
   pnpm build
   pnpm test
   ```

**Expected Outcome**: All tests pass, feature fully functional

---

## Common Patterns

### Error Handling

```typescript
try {
  const store = loadConfigStore();
  // ... operations
  saveConfigStore(store);
  console.log("Success message");
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("An unexpected error occurred");
  }
  process.exit(1);
}
```

### Confirmation Prompts

```typescript
import readline from "readline";

async function confirmAction(message: string): Promise<boolean> {
  if (options.yes) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}
```

### Masked Output

```typescript
function maskCredentials(config: Configuration): string {
  if (config.token) {
    return "Bearer token";
  }
  if (config.username) {
    return `Basic (username: ${config.username})`;
  }
  return "None";
}
```

## Troubleshooting

**Issue**: Tests failing with "config file not found"
**Solution**: Ensure test setup creates temp directory and cleans up properly

**Issue**: Migration not triggering
**Solution**: Check detectOldFormat() logic, verify old config has serverUrl field

**Issue**: Concurrent access corruption
**Solution**: Verify atomic write with temp file + rename is implemented

## Next Steps

After completing implementation:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Follow task-based implementation with commits per task
3. Create PR following constitution quality gates
4. Manual testing with real Prometheus server

## References

- Spec: [spec.md](spec.md)
- Research: [research.md](research.md)
- Data Model: [data-model.md](data-model.md)
- CLI Contracts: [contracts/cli-commands.md](contracts/cli-commands.md)
- Constitution: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)
