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
import type { Target } from "../types/index.js";

interface TargetsOptions {
  json?: boolean;
  job?: string;
  state?: "up" | "down";
}

/**
 * Filter targets based on job name and/or health state
 * @param targets - Full list of targets from API
 * @param options - Filter criteria (job and/or state)
 * @returns Filtered subset of targets
 */
export function filterTargets(
  targets: Target[],
  options: { job?: string; state?: "up" | "down" },
): Target[] {
  return targets.filter((target) => {
    // Job filter (exact match, case-sensitive)
    if (options.job && target.job !== options.job) {
      return false;
    }

    // State filter (health state enum)
    if (options.state && target.health !== options.state) {
      return false;
    }

    // No filters or all filters passed
    return true;
  });
}

/**
 * Create targets command
 */
export function createTargetsCommand(): Command {
  const cmd = new Command("targets")
    .description("List scrape targets")
    .option("-j, --json", "Output as JSON")
    .option("--job <name>", "Filter by job name")
    .option("--state <state>", "Filter by health state (up or down)")
    .action(async (options: TargetsOptions) => {
      // Validate state option
      if (options.state && !["up", "down"].includes(options.state)) {
        console.error('Error: --state must be "up" or "down"');
        process.exit(1);
      }

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

        // Apply filters
        const filteredTargets = filterTargets(targets, {
          job: options.job,
          state: options.state,
        });

        // Check if filtering resulted in empty list
        if (filteredTargets.length === 0 && (options.job || options.state)) {
          console.log("No targets found matching filters.");
          return;
        }

        if (options.json) {
          // JSON output
          const jsonOutput = filteredTargets.map((t) => ({
            job: t.job,
            instance: t.instance,
            health: t.health,
            lastScrape: t.lastScrape.toISOString(),
            lastScrapeDuration: t.lastScrapeDuration,
          }));
          console.log(formatJson(jsonOutput));
        } else {
          // Table output
          const tableData = filteredTargets.map((t) => ({
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
