import { copyFileSync, existsSync } from "fs";

import type { ConfigStore, Configuration } from "../types/index.js";

/**
 * Detect if config data is in old format (pre-multi-config)
 * Old format: { serverUrl, username?, password?, token? }
 * New format: { activeConfig?, configs: { ... } }
 * @param data Raw config data from JSON
 * @returns true if old format, false if new format
 */
export function detectOldFormat(data: any): boolean {
  return typeof data === "object" && data !== null && "serverUrl" in data && !("configs" in data);
}

/**
 * Migrate old format configuration to new multi-config format
 * Creates a "default" configuration from old config
 * Preserves all authentication fields
 * @param oldConfig Old format config data
 * @returns New ConfigStore with "default" configuration
 */
export function migrateOldConfig(oldConfig: any): ConfigStore {
  // Extract old config fields
  const config: Configuration = {
    serverUrl: oldConfig.serverUrl,
  };

  // Preserve authentication fields if present
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

/**
 * Create a backup of the old configuration file
 * Backup file: <configPath>.backup
 * @param configPath Path to the configuration file
 */
export function backupOldConfig(configPath: string): void {
  if (existsSync(configPath)) {
    const backupPath = `${configPath}.backup`;
    copyFileSync(configPath, backupPath);
    console.log(`Configuration backed up to: ${backupPath}`);
  }
}
