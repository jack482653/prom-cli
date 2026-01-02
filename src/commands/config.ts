import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import {
  getConfigPath,
  loadConfig,
  normalizeUrl,
  saveConfig,
  validateUrl,
} from "../services/config.js";
import { ErrorMessages } from "../services/prometheus.js";
import type { Config } from "../types/index.js";

interface ConfigOptions {
  username?: string;
  password?: string;
  token?: string;
  timeout?: string;
  show?: boolean;
}

/**
 * Show current configuration
 */
function showConfig(): void {
  const config = loadConfig();

  if (!config) {
    console.log("No configuration found.");
    console.log(`Config file: ${getConfigPath()}`);
    return;
  }

  console.log(`Server:   ${config.serverUrl}`);

  if (config.auth) {
    console.log(`Auth:     ${config.auth.type}`);
    if (config.auth.type === "basic" && config.auth.username) {
      console.log(`Username: ${config.auth.username}`);
      console.log(`Password: ${"*".repeat(8)}`);
    } else if (config.auth.type === "bearer") {
      console.log(`Token:    ${"*".repeat(8)}...`);
    }
  } else {
    console.log("Auth:     none");
  }

  if (config.timeout) {
    console.log(`Timeout:  ${config.timeout}ms`);
  }

  console.log(`\nConfig file: ${getConfigPath()}`);
}

/**
 * Save new configuration
 */
function setConfig(url: string, options: ConfigOptions): void {
  // Validate URL
  if (!validateUrl(url)) {
    console.error(ErrorMessages.INVALID_URL);
    process.exit(1);
  }

  // Check for conflicting auth options
  const hasBasicAuth = options.username || options.password;
  const hasBearerAuth = options.token;

  if (hasBasicAuth && hasBearerAuth) {
    console.error("Error: Cannot use both basic auth (-u/-p) and bearer token (-t) together.");
    process.exit(1);
  }

  if ((options.username && !options.password) || (!options.username && options.password)) {
    console.error("Error: Both username (-u) and password (-p) are required for basic auth.");
    process.exit(1);
  }

  const config: Config = {
    serverUrl: normalizeUrl(url),
  };

  // Add auth if provided
  if (options.username && options.password) {
    config.auth = {
      type: "basic",
      username: options.username,
      password: options.password,
    };
  } else if (options.token) {
    config.auth = {
      type: "bearer",
      token: options.token,
    };
  }

  // Add timeout if provided
  if (options.timeout) {
    const timeout = parseInt(options.timeout, 10);
    if (isNaN(timeout) || timeout <= 0) {
      console.error("Error: Timeout must be a positive integer (milliseconds).");
      process.exit(1);
    }
    config.timeout = timeout;
  }

  saveConfig(config);
  console.log("Configuration saved successfully.");
  console.log(`Server: ${config.serverUrl}`);
}

/**
 * Create config command
 */
export function createConfigCommand(): Command {
  const cmd = new Command("config")
    .description("Configure Prometheus server connection")
    .argument("[url]", "Prometheus server URL")
    .option("-u, --username <user>", "Basic auth username")
    .option("-p, --password <pass>", "Basic auth password")
    .option("-t, --token <token>", "Bearer token")
    .option("--timeout <ms>", "Request timeout in milliseconds")
    .option("-s, --show", "Show current configuration")
    .action((url: string | undefined, options: ConfigOptions) => {
      if (options.show) {
        showConfig();
        return;
      }

      if (!url) {
        console.error("Error: URL is required unless using --show flag.");
        console.error("Usage: prom config <url> [options]");
        console.error("       prom config --show");
        process.exit(1);
      }

      setConfig(url, options);
    });

  return cmd;
}
