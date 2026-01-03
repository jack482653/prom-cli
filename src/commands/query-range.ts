import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import { formatMatrixTable } from "../formatters/table.js";
import { loadConfig } from "../services/config.js";
import { ErrorMessages, createClient, handleError, queryRange } from "../services/prometheus.js";
import { calculateDefaultStep, parseTimeExpression } from "../services/time-parser.js";
import type { MatrixResult, QueryRangeOptions } from "../types/index.js";

/** Threshold for warning about large result sets */
const LARGE_RESULT_SET_THRESHOLD = 1500;

/**
 * Format labels for display
 */
function formatLabels(metric: Record<string, string>): string {
  const entries = Object.entries(metric).filter(([k]) => k !== "__name__");
  if (entries.length === 0) return "{}";
  const pairs = entries.map(([k, v]) => `${k}="${v}"`);
  return `{${pairs.join(",")}}`;
}

/**
 * Calculate min/max values from matrix result
 */
function getValueRange(values: [number, string][]): { min: string; max: string } {
  if (values.length === 0) {
    return { min: "N/A", max: "N/A" };
  }

  const numericValues = values.map(([, v]) => parseFloat(v)).filter((v) => !isNaN(v));

  if (numericValues.length === 0) {
    return { min: "N/A", max: "N/A" };
  }

  const min = numericValues.reduce((a, b) => Math.min(a, b));
  const max = numericValues.reduce((a, b) => Math.max(a, b));

  return {
    min: min.toString(),
    max: max.toString(),
  };
}

/**
 * Create query-range command
 */
export function createQueryRangeCommand(): Command {
  const cmd = new Command("query-range")
    .description("Execute PromQL range query (table shows summary, use --json for all data points)")
    .argument("<expression>", "PromQL expression")
    .requiredOption("-s, --start <time>", "Start time (RFC3339 or relative: 1h, 30m, now)")
    .requiredOption("-e, --end <time>", "End time (RFC3339 or relative: 1h, 30m, now)")
    .option("-p, --step <seconds>", "Resolution step in seconds", parseInt)
    .option("-j, --json", "Output as JSON (includes all timestamps and values)")
    .action(async (expression: string, options: QueryRangeOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      // Parse start time (supports RFC3339 and relative expressions)
      let startTs: number;
      try {
        const startResult = parseTimeExpression(options.start);
        startTs = startResult.timestamp;
      } catch (error) {
        console.error(`Error: Invalid start time.
Reason: ${error instanceof Error ? error.message : "Unknown error"}
Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)`);
        process.exit(1);
      }

      // Parse end time (supports RFC3339 and relative expressions)
      let endTs: number;
      try {
        const endResult = parseTimeExpression(options.end);
        endTs = endResult.timestamp;
      } catch (error) {
        console.error(`Error: Invalid end time.
Reason: ${error instanceof Error ? error.message : "Unknown error"}
Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)`);
        process.exit(1);
      }

      // Validate time range
      if (startTs >= endTs) {
        console.error(`Error: Invalid time range.
Start time must be before end time.
Start: ${options.start}
End:   ${options.end}`);
        process.exit(1);
      }

      // Calculate step if not provided
      const range = endTs - startTs;
      const step = options.step ?? calculateDefaultStep(startTs, endTs);

      // Warn if step is larger than range
      if (step > range) {
        console.warn(
          `Warning: Step (${step}s) is larger than time range (${range}s). Only 1 data point will be returned.`,
        );
      }

      try {
        const client = createClient(config);
        const result = await queryRange(client, {
          query: expression,
          start: startTs,
          end: endTs,
          step,
        });

        if (options.json) {
          console.log(formatJson(result));
          return;
        }

        // Handle empty results
        if (result.result.length === 0) {
          console.log(`No data found for the specified time range.
Query: ${expression}
Time range: ${options.start} to ${options.end}`);
          return;
        }

        // Warn for large result sets
        const totalDataPoints = result.result.reduce((sum, r) => sum + r.values.length, 0);
        if (totalDataPoints > LARGE_RESULT_SET_THRESHOLD) {
          console.warn(
            `Warning: Large result set (${totalDataPoints} data points). Consider using a larger step or shorter time range.`,
          );
        }

        // Format matrix results for table
        const tableData = result.result.map((r: MatrixResult) => {
          const valueRange = getValueRange(r.values);
          return {
            metric: r.metric.__name__ || "",
            labels: formatLabels(r.metric),
            points: r.values.length,
            min: valueRange.min,
            max: valueRange.max,
          };
        });

        console.log(formatMatrixTable(tableData));

        // Summary line
        console.log(
          `\nTime range: ${options.start} to ${options.end} (step: ${step}s)\nTotal: ${result.result.length} series, ${totalDataPoints} data points`,
        );
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
