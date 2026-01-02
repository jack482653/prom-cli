import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import { loadConfig } from "../services/config.js";
import { ErrorMessages, createClient, getStatus, handleError } from "../services/prometheus.js";

interface StatusOptions {
  json?: boolean;
}

/**
 * Create status command
 */
export function createStatusCommand(): Command {
  const cmd = new Command("status")
    .description("Check server status")
    .option("-j, --json", "Output as JSON")
    .action(async (options: StatusOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        const client = createClient(config);
        const status = await getStatus(client);

        if (options.json) {
          const jsonOutput = {
            serverUrl: config.serverUrl,
            healthy: status.healthy,
            ready: status.ready,
            buildInfo: status.buildInfo,
          };
          console.log(formatJson(jsonOutput));
          return;
        }

        // Key-value output
        console.log(`Server:     ${config.serverUrl}`);
        console.log(`Health:     ${status.healthy ? "healthy" : "unhealthy"}`);
        console.log(`Ready:      ${status.ready ? "ready" : "not ready"}`);

        if (status.buildInfo) {
          console.log(`Version:    ${status.buildInfo.version}`);
          console.log(`Build Date: ${status.buildInfo.buildDate}`);
          console.log(`Go Version: ${status.buildInfo.goVersion}`);
        }

        // Exit with error code if unhealthy
        if (!status.healthy || !status.ready) {
          process.exit(2);
        }
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
