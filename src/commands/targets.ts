import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import { formatTargetsTable } from "../formatters/table.js";
import { loadConfig } from "../services/config.js";
import {
  ErrorMessages,
  createClient,
  formatRelativeTime,
  getTargets,
  handleError,
} from "../services/prometheus.js";

interface TargetsOptions {
  json?: boolean;
}

/**
 * Create targets command
 */
export function createTargetsCommand(): Command {
  const cmd = new Command("targets")
    .description("List scrape targets")
    .option("-j, --json", "Output as JSON")
    .action(async (options: TargetsOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        const client = createClient(config);
        const targets = await getTargets(client);

        if (targets.length === 0) {
          console.log("No targets configured.");
          return;
        }

        if (options.json) {
          // JSON output
          const jsonOutput = targets.map((t) => ({
            job: t.job,
            instance: t.instance,
            health: t.health,
            lastScrape: t.lastScrape.toISOString(),
            lastScrapeDuration: t.lastScrapeDuration,
          }));
          console.log(formatJson(jsonOutput));
        } else {
          // Table output
          const tableData = targets.map((t) => ({
            job: t.job,
            instance: t.instance,
            health: t.health,
            lastScrapeAgo: formatRelativeTime(t.lastScrape),
          }));
          console.log(formatTargetsTable(tableData));
        }
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
