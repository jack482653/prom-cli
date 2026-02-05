import { Command } from "commander";
import readline from "readline";

import { formatJson } from "../formatters/json.js";
import {
  addConfiguration,
  getActiveConfig,
  loadConfigStore,
  removeConfiguration,
  saveConfigStore,
  setActiveConfig,
  validateAuthentication,
  validateConfigName,
  validateServerUrl,
} from "../services/config-store.js";
import {
  getConfigPath,
  loadConfig,
  normalizeUrl,
  saveConfig,
  validateUrl,
} from "../services/config.js";
import { ErrorMessages } from "../services/prometheus.js";
import type { Config, Configuration } from "../types/index.js";

interface ConfigOptions {
  username?: string;
  password?: string;
  token?: string;
  timeout?: string;
  show?: boolean;
}

interface AddConfigOptions {
  username?: string;
  password?: string;
  token?: string;
}

interface RemoveConfigOptions {
  force?: boolean;
  yes?: boolean;
}

// Table formatting constants for list command
const TABLE_NAME_WIDTH = 14; // Width for name column (includes active indicator)
const TABLE_URL_WIDTH = 36; // Width for URL column
const TABLE_URL_MAX_LENGTH = 35; // Max URL length before truncation
const TABLE_URL_TRUNCATE_AT = 32; // Truncation point for long URLs

/**
 * Prompt user for confirmation
 */
async function confirmAction(message: string, autoConfirm: boolean): Promise<boolean> {
  if (autoConfirm) {
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

/**
 * Remove a configuration
 */
async function removeConfigCommand(name: string, options: RemoveConfigOptions): Promise<void> {
  try {
    // Load config store
    let store = loadConfigStore();

    // Check if configuration exists
    if (!store.configs[name]) {
      const availableConfigs = Object.keys(store.configs).sort().join(", ");
      console.error(`Error: Configuration '${name}' not found.`);
      if (availableConfigs) {
        console.error(`Available configurations: ${availableConfigs}`);
      }
      process.exit(1);
    }

    // Check if trying to remove active configuration without force
    if (store.activeConfig === name && !options.force) {
      console.error(`Error: Cannot remove active configuration '${name}'.`);
      console.error("Switch to another configuration first, or use --force to remove anyway:");
      console.error(`  prom config remove ${name} --force`);
      process.exit(1);
    }

    // Prompt for confirmation
    const confirmed = await confirmAction(
      `Are you sure you want to remove configuration '${name}'?`,
      options.yes || false,
    );

    if (!confirmed) {
      console.log("Operation cancelled.");
      process.exit(1);
    }

    // Remove configuration
    store = removeConfiguration(store, name);

    // Save updated store
    saveConfigStore(store);

    // Display success message
    console.log(`Configuration '${name}' removed successfully.`);

    // If removed config was active, remind user to set a new active config
    if (!store.activeConfig && Object.keys(store.configs).length > 0) {
      console.log("No active configuration set.");
      console.log("Run 'prom config use <name>' to activate a configuration.");
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show current configuration (old behavior)
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
 * Save new configuration (old behavior)
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
 * Show current active configuration
 */
function currentConfigCommand(): void {
  try {
    const store = loadConfigStore();

    // Check if any configurations exist
    if (Object.keys(store.configs).length === 0) {
      console.log("No active configuration.");
      console.log("");
      console.log("Add a configuration:");
      console.log("  prom config add <name> <url>");
      console.log("");
      console.log("Example:");
      console.log("  prom config add production https://prometheus.example.com");
      return;
    }

    // Check if there's an active config
    if (!store.activeConfig) {
      console.log("No active configuration.");
      console.log("");
      console.log("Switch to a configuration:");
      console.log("  prom config use <name>");
      return;
    }

    const config = store.configs[store.activeConfig];

    // Display configuration details
    console.log(`Current configuration: ${store.activeConfig}`);
    console.log("");
    console.log(`Server URL: ${config.serverUrl}`);

    // Display authentication info
    if (config.token) {
      console.log("Authentication: Bearer token");
    } else if (config.username && config.password) {
      console.log(`Authentication: Basic (username: ${config.username})`);
    } else {
      console.log("Authentication: None");
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Switch to a different configuration
 */
function useConfigCommand(name: string): void {
  try {
    // Load config store
    let store = loadConfigStore();

    // Check if any configurations exist
    if (Object.keys(store.configs).length === 0) {
      console.error("Error: No configurations found.");
      console.error("Add a configuration first:");
      console.error("  prom config add <name> <url>");
      process.exit(1);
    }

    // Check if configuration exists
    if (!store.configs[name]) {
      const availableConfigs = Object.keys(store.configs).sort().join(", ");
      console.error(`Error: Configuration '${name}' not found.`);
      console.error(`Available configurations: ${availableConfigs}`);
      console.error("");
      console.error("Run 'prom config list' to see all configurations.");
      process.exit(1);
    }

    // Set active config
    store = setActiveConfig(store, name);

    // Save updated store
    saveConfigStore(store);

    // Display success message
    const config = store.configs[name];
    console.log(`Switched to configuration '${name}'.`);
    console.log(`Server: ${config.serverUrl}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List all configurations
 */
function listConfigCommand(): void {
  try {
    const store = loadConfigStore();

    // Check if any configurations exist
    if (Object.keys(store.configs).length === 0) {
      console.log("No configurations found.");
      console.log("");
      console.log("Add your first configuration:");
      console.log("  prom config add <name> <url>");
      console.log("");
      console.log("Example:");
      console.log("  prom config add production https://prometheus.example.com");
      return;
    }

    // Display table header
    console.log("NAME          URL                                 AUTH TYPE");

    // Get sorted configuration names
    const names = Object.keys(store.configs).sort();

    // Display each configuration
    for (const name of names) {
      const config = store.configs[name];
      const isActive = store.activeConfig === name;
      const activeIndicator = isActive ? "*" : " ";

      // Determine auth type
      let authType = "none";
      if (config.token) {
        authType = "bearer token";
      } else if (config.username && config.password) {
        authType = "basic auth";
      }

      // Format URL (truncate if too long)
      const url =
        config.serverUrl.length > TABLE_URL_MAX_LENGTH
          ? config.serverUrl.substring(0, TABLE_URL_TRUNCATE_AT) + "..."
          : config.serverUrl;

      // Format name (pad to width including indicator)
      const namePadded = (activeIndicator + " " + name).padEnd(TABLE_NAME_WIDTH);

      // Format URL (pad to width)
      const urlPadded = url.padEnd(TABLE_URL_WIDTH);

      console.log(`${namePadded}${urlPadded}${authType}`);
    }

    console.log("");
    console.log(`Active: ${store.activeConfig || "none"}`);
    console.log(`Total: ${names.length} configuration${names.length === 1 ? "" : "s"}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Add a new named configuration
 */
function addConfigCommand(name: string, url: string, options: AddConfigOptions): void {
  try {
    // Validate inputs
    validateConfigName(name);
    validateServerUrl(url);

    // Create configuration object
    const config: Configuration = {
      serverUrl: url.endsWith("/") ? url.slice(0, -1) : url, // Remove trailing slash
    };

    // Add authentication if provided
    if (options.username) {
      config.username = options.username;
    }
    if (options.password) {
      config.password = options.password;
    }
    if (options.token) {
      config.token = options.token;
    }

    // Validate authentication
    validateAuthentication(config);

    // Load existing config store
    let store = loadConfigStore();

    // Add configuration (will set as active if first config)
    store = addConfiguration(store, name, config);

    // Save updated store
    saveConfigStore(store);

    // Display success message
    if (store.activeConfig === name) {
      console.log(`Configuration '${name}' added successfully.`);
      console.log(`Active configuration: ${name}`);
    } else {
      console.log(`Configuration '${name}' added successfully.`);
      console.log(`Run 'prom config use ${name}' to switch to this configuration.`);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create config command
 */
export function createConfigCommand(): Command {
  const cmd = new Command("config").description("Manage Prometheus server configurations");

  // Add subcommand
  cmd
    .command("add <name> <url>")
    .description("Add a new configuration")
    .option("-u, --username <username>", "Basic auth username")
    .option("-p, --password <password>", "Basic auth password")
    .option("-t, --token <token>", "Bearer token")
    .action(addConfigCommand);

  // List subcommand
  cmd.command("list").description("List all configurations").action(listConfigCommand);

  // Use subcommand
  cmd.command("use <name>").description("Switch to a configuration").action(useConfigCommand);

  // Current subcommand
  cmd.command("current").description("Show current configuration").action(currentConfigCommand);

  // Remove subcommand
  cmd
    .command("remove <name>")
    .description("Remove a configuration")
    .option("-f, --force", "Force removal of active configuration")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(removeConfigCommand);

  return cmd;
}
