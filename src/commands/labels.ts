import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import { loadConfig } from "../services/config.js";
import {
  ErrorMessages,
  createClient,
  getLabels,
  getLabelValues,
  handleError,
} from "../services/prometheus.js";
import { parseTimeExpression } from "../services/time-parser.js";
import type { LabelsOptions } from "../types/index.js";

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
export function parseTimeRange(options: LabelsOptions): { start?: number; end?: number } {
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
 * Create labels command
 */
export function createLabelsCommand(): Command {
  const cmd = new Command("labels")
    .description("List label names or values for a specific label")
    .argument("[label_name]", "Label name to get values for (optional)")
    .option("-j, --json", "Output as JSON")
    .option("-s, --start <time>", "Start time (RFC3339 or relative: 1h, 30m, now)")
    .option("-e, --end <time>", "End time (RFC3339 or relative: 1h, 30m, now)")
    .action(async (labelName: string | undefined, options: LabelsOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        const client = createClient(config);
        const { start, end } = parseTimeRange(options);

        if (labelName) {
          // List values for specific label
          const values = await getLabelValues(client, labelName, start, end);

          if (options.json) {
            console.log(formatJson(values));
            return;
          }

          if (values.length === 0) {
            console.log(`No values found for "${labelName}".`);
            return;
          }

          // Output as simple list
          values.forEach((value) => console.log(value));
          console.log(`\nTotal: ${values.length} values for "${labelName}"`);
        } else {
          // List all label names
          const labels = await getLabels(client, start, end);

          if (options.json) {
            console.log(formatJson(labels));
            return;
          }

          if (labels.length === 0) {
            console.log("No labels found.");
            return;
          }

          // Output as simple list
          labels.forEach((label) => console.log(label));
          console.log(`\nTotal: ${labels.length} labels`);
        }
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
