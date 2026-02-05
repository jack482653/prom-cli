import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Config, Configuration } from "../types/index.js";
import { backupOldConfig, detectOldFormat, migrateOldConfig } from "./config-migration.js";
import {
  getActiveConfig as getActiveConfiguration,
  loadConfigStore,
  saveConfigStore,
} from "./config-store.js";

const CONFIG_DIR = path.join(os.homedir(), ".prom-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize URL (remove trailing slash)
 */
export function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from file
 * Handles automatic migration from old format to new format
 * Returns null if no config exists
 * Returns old Config format for backward compatibility with existing commands
 */
export function loadConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CONFIG_FILE, "utf-8");
    const rawConfig = JSON.parse(content);

    // Check if old format and migrate
    if (detectOldFormat(rawConfig)) {
      console.log("Migrating configuration to multi-config format...");
      backupOldConfig(CONFIG_FILE);

      const newStore = migrateOldConfig(rawConfig);
      saveConfigStore(newStore);

      console.log("Configuration backed up to: ~/.prom-cli/config.json.backup");
      console.log("Migration complete. Default configuration created.");
      console.log("");
      console.log("Run 'prom config list' to see your configurations.");
      console.log("Run 'prom config add <name> <url>' to add more configurations.");
      console.log("");

      // Return the active config in old format for compatibility
      const activeConfig = getActiveConfiguration(newStore);
      if (activeConfig) {
        return convertConfigurationToConfig(activeConfig);
      }
      return null;
    }

    // New format - load active config
    const store = loadConfigStore();
    const activeConfig = getActiveConfiguration(store);

    if (!activeConfig) {
      return null;
    }

    return convertConfigurationToConfig(activeConfig);
  } catch {
    return null;
  }
}

/**
 * Convert new Configuration format to old Config format
 * For backward compatibility with existing commands
 */
function convertConfigurationToConfig(config: Configuration): Config {
  const result: Config = {
    serverUrl: config.serverUrl,
  };

  // Convert auth fields
  if (config.token) {
    result.auth = {
      type: "bearer",
      token: config.token,
    };
  } else if (config.username && config.password) {
    result.auth = {
      type: "basic",
      username: config.username,
      password: config.password,
    };
  }

  return result;
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();
  const content = JSON.stringify(config, null, 2);
  fs.writeFileSync(CONFIG_FILE, content, "utf-8");
}

/**
 * Check if configuration exists
 */
export function hasConfig(): boolean {
  return fs.existsSync(CONFIG_FILE);
}

/**
 * Get config file path (for display)
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
