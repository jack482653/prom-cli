import { Command } from "commander";

import { formatCsv } from "../formatters/csv.js";
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
  csv?: boolean;
  job?: string;
  state?: "up" | "down";
  label?: string[];
}

export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateError";
  }
}

export class InvalidLabelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLabelError";
  }
}

/**
 * Validate state option value
 */
export function validateStateOption(state: string | undefined): void {
  if (state !== undefined && !["up", "down"].includes(state)) {
    throw new InvalidStateError('--state must be "up" or "down"');
  }
}

/**
 * Validate a single --label value (must be "key=value" format with non-empty key)
 */
export function validateLabelOption(label: string): void {
  const eqIndex = label.indexOf("=");
  if (eqIndex <= 0) {
    throw new InvalidLabelError(`--label must be in "key=value" format, got: "${label}"`);
  }
}

/**
 * Filter targets based on job name, health state, and/or labels
 */
export function filterTargets(
  targets: Target[],
  options: { job?: string; state?: "up" | "down"; labels?: { key: string; value: string }[] },
): Target[] {
  return targets.filter((target) => {
    if (options.job && target.job !== options.job) {
      return false;
    }

    if (options.state && target.health !== options.state) {
      return false;
    }

    if (options.labels && options.labels.length > 0) {
      for (const { key, value } of options.labels) {
        if (target.labels[key] !== value) {
          return false;
        }
      }
    }

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
    .option("--csv", "Output as CSV")
    .option("--job <name>", "Filter by job name")
    .option("--state <state>", "Filter by health state (up or down)")
    .option(
      "--label <key=value>",
      "Filter by label (repeatable)",
      (val, prev: string[]) => [...(prev ?? []), val],
      [] as string[],
    )
    .action(async (options: TargetsOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        // Validate state option
        validateStateOption(options.state);

        // Validate and parse label options once
        const parsedLabels = (options.label ?? []).map((label) => {
          validateLabelOption(label);
          const eqIndex = label.indexOf("=");
          return { key: label.slice(0, eqIndex), value: label.slice(eqIndex + 1) };
        });

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
          labels: parsedLabels,
        });

        // Check if filtering resulted in empty list
        const hasFilters =
          options.job || options.state || (options.label && options.label.length > 0);
        if (filteredTargets.length === 0 && hasFilters) {
          console.log("No targets found matching filters.");
          return;
        }

        if (options.json) {
          const jsonOutput = filteredTargets.map((t) => ({
            job: t.job,
            instance: t.instance,
            health: t.health,
            lastScrape: t.lastScrape.toISOString(),
            lastScrapeDuration: t.lastScrapeDuration,
          }));
          console.log(formatJson(jsonOutput));
        } else if (options.csv) {
          const csvData = filteredTargets.map((t) => ({
            job: t.job,
            instance: t.instance,
            health: t.health,
            lastScrape: t.lastScrape.toISOString(),
            lastScrapeDuration: String(t.lastScrapeDuration),
          }));
          console.log(
            formatCsv({
              columns: [
                { header: "job", key: "job" },
                { header: "instance", key: "instance" },
                { header: "health", key: "health" },
                { header: "lastScrape", key: "lastScrape" },
                { header: "lastScrapeDuration", key: "lastScrapeDuration" },
              ],
              data: csvData,
            }),
          );
        } else {
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
