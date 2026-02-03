import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import { loadConfig } from "../services/config.js";
import { ErrorMessages, createClient, getSeries, handleError } from "../services/prometheus.js";
import { parseTimeExpression } from "../services/time-parser.js";
import type { LabelSet, SeriesOptions } from "../types/index.js";

export class InvalidTimeExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTimeExpressionError";
  }
}

export class InvalidTimeRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTimeRangeError";
  }
}

/**
 * Parse and validate time range options
 * Returns { start, end } as Unix timestamps or undefined if not specified
 * Throws InvalidTimeExpressionError or InvalidTimeRangeError on validation failure
 */
export function parseTimeRange(options: SeriesOptions): { start?: number; end?: number } {
  let start: number | undefined;
  let end: number | undefined;

  if (options.start) {
    try {
      const parsed = parseTimeExpression(options.start);
      start = parsed.timestamp;
    } catch (error) {
      throw new InvalidTimeExpressionError(
        "Invalid start time. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)",
      );
    }
  }

  if (options.end) {
    try {
      const parsed = parseTimeExpression(options.end);
      end = parsed.timestamp;
    } catch (error) {
      throw new InvalidTimeExpressionError(
        "Invalid end time. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)",
      );
    }
  }

  // Validate time range
  if (start !== undefined && end !== undefined && start >= end) {
    throw new InvalidTimeRangeError("Start time must be before end time.");
  }

  return { start, end };
}

/**
 * Format a label set as a human-readable string
 * Example: {__name__="up", job="prometheus", instance="localhost:9090"}
 */
function formatLabelSet(labelSet: LabelSet): string {
  const pairs = Object.entries(labelSet)
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");
  return `{${pairs}}`;
}

/**
 * Create series command
 */
export function createSeriesCommand(): Command {
  const cmd = new Command("series")
    .description("Query time series matching label selectors")
    .argument("<matchers...>", "Label matchers (e.g., 'up', '{job=\"prometheus\"}')")
    .option("-j, --json", "Output as JSON")
    .option("-s, --start <time>", "Start time (RFC3339 or relative: 1h, 30m, now)")
    .option("-e, --end <time>", "End time (RFC3339 or relative: 1h, 30m, now)")
    .action(async (matchers: string[], options: SeriesOptions) => {
      // Validate that at least one matcher is provided
      if (!matchers || matchers.length === 0) {
        console.error(`Error: At least one label matcher is required.

Usage: prom series <matchers...> [options]
Example: prom series 'up'
Example: prom series '{job="prometheus"}'`);
        process.exit(1);
      }

      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        const client = createClient(config);
        const { start, end } = parseTimeRange(options);

        // Query series from Prometheus
        const series = await getSeries(client, matchers, start, end);

        // Output as JSON if requested
        if (options.json) {
          console.log(formatJson(series));
          return;
        }

        // Handle empty results
        if (series.length === 0) {
          console.log("No matching series found.");
          return;
        }

        // Output as human-readable list
        series.forEach((labelSet) => {
          console.log(formatLabelSet(labelSet));
        });

        console.log(`\nTotal: ${series.length} series`);
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
