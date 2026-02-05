import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname } from "path";
import { join } from "path";

import type { ConfigStore, Configuration } from "../types/index.js";

const CONFIG_DIR = join(homedir(), ".prom-cli");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

/**
 * Get the configuration file path
 * Supports override via PROM_CLI_CONFIG_PATH environment variable for testing
 */
function getConfigPath(): string {
  return process.env.PROM_CLI_CONFIG_PATH || CONFIG_FILE;
}

/**
 * Load the ConfigStore from disk
 * Returns empty store if file doesn't exist
 * @throws Error if file is corrupted or invalid JSON
 */
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
      throw new Error("Invalid config structure: missing or invalid 'configs' field");
    }

    return data as ConfigStore;
  } catch (error: any) {
    if (error.name === "SyntaxError") {
      throw new Error("Configuration file is corrupted (invalid JSON)");
    }
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

/**
 * Save the ConfigStore to disk using atomic write
 * Creates directory if it doesn't exist
 * Uses temp file + rename for atomicity
 * @param store The ConfigStore to save
 * @throws Error if write fails
 */
export function saveConfigStore(store: ConfigStore): void {
  const configPath = getConfigPath();
  const configDir = dirname(configPath);

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

/**
 * Add a new configuration to the store
 * First configuration automatically becomes active
 * @param store Current ConfigStore
 * @param name Configuration name
 * @param config Configuration details
 * @returns Updated ConfigStore
 * @throws Error if configuration name already exists
 */
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

  newStore.configs = { ...newStore.configs, [name]: config };

  // Set as active if first config
  if (Object.keys(newStore.configs).length === 1) {
    newStore.activeConfig = name;
  }

  return newStore;
}

/**
 * Remove a configuration from the store
 * Clears activeConfig if removed config was active
 * @param store Current ConfigStore
 * @param name Configuration name to remove
 * @returns Updated ConfigStore
 * @throws Error if configuration doesn't exist
 */
export function removeConfiguration(store: ConfigStore, name: string): ConfigStore {
  const newStore = { ...store };

  // Check if exists
  if (!newStore.configs[name]) {
    throw new Error(`Configuration '${name}' not found`);
  }

  // Create new configs object without the removed config
  const { [name]: removed, ...remainingConfigs } = newStore.configs;
  newStore.configs = remainingConfigs;

  // Clear active if removed config was active
  if (newStore.activeConfig === name) {
    newStore.activeConfig = undefined;
  }

  return newStore;
}

/**
 * Set the active configuration
 * @param store Current ConfigStore
 * @param name Configuration name to activate
 * @returns Updated ConfigStore
 * @throws Error if configuration doesn't exist
 */
export function setActiveConfig(store: ConfigStore, name: string): ConfigStore {
  if (!store.configs[name]) {
    throw new Error(`Configuration '${name}' not found`);
  }

  return {
    ...store,
    activeConfig: name,
  };
}

/**
 * Get the active configuration
 * @param store Current ConfigStore
 * @returns Active Configuration or null if no active config
 */
export function getActiveConfig(store: ConfigStore): Configuration | null {
  if (!store.activeConfig) {
    return null;
  }

  return store.configs[store.activeConfig] || null;
}

/**
 * List all configuration names in alphabetical order
 * @param store Current ConfigStore
 * @returns Sorted array of configuration names
 */
export function listConfigurations(store: ConfigStore): string[] {
  return Object.keys(store.configs).sort();
}

/**
 * Validate configuration name
 * Rules:
 * - 1-64 characters long
 * - Only letters, numbers, hyphens, underscores
 * - Must start and end with alphanumeric character
 * - No consecutive special characters
 * @param name Configuration name to validate
 * @throws Error if name is invalid
 */
export function validateConfigName(name: string): void {
  if (!name || name.length === 0 || name.length > 64) {
    throw new Error("Configuration name must be 1-64 characters");
  }

  // Check for valid characters and start/end with alphanumeric
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(name)) {
    throw new Error(
      "Configuration name must contain only letters, numbers, hyphens, and underscores, and must start and end with alphanumeric characters",
    );
  }

  // Check for consecutive special characters
  if (name.includes("--") || name.includes("__") || name.includes("-_") || name.includes("_-")) {
    throw new Error("Configuration name cannot contain consecutive special characters");
  }
}

/**
 * Validate server URL
 * Rules:
 * - Must start with http:// or https://
 * - Must have a valid hostname
 * - No query parameters or fragments
 * @param url Server URL to validate
 * @throws Error if URL is invalid
 */
export function validateServerUrl(url: string): void {
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
  } catch (e: any) {
    if (e.message.includes("Invalid URL")) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    throw e;
  }
}

/**
 * Validate authentication configuration
 * Rules:
 * - If username provided, password must also be provided
 * - If password provided, username must also be provided
 * - If token provided, username and password must NOT be provided
 * @param config Configuration to validate
 * @throws Error if authentication is invalid
 */
export function validateAuthentication(config: Configuration): void {
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
