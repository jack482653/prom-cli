import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Config } from "../types/index.js";

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
 * Returns null if no config exists
 */
export function loadConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(content) as Config;
  } catch {
    return null;
  }
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
