import { Command } from "commander";

import { formatJson } from "../formatters/json.js";
import { formatQueryTable } from "../formatters/table.js";
import { loadConfig } from "../services/config.js";
import { ErrorMessages, createClient, handleError, query } from "../services/prometheus.js";
import type { VectorResult } from "../types/index.js";

interface QueryOptions {
  json?: boolean;
  time?: string;
}

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
 * Create query command
 */
export function createQueryCommand(): Command {
  const cmd = new Command("query")
    .description("Execute PromQL query")
    .argument("<expression>", "PromQL expression")
    .option("-j, --json", "Output as JSON")
    .option("-t, --time <ts>", "Evaluation timestamp (RFC3339 or Unix)")
    .action(async (expression: string, options: QueryOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        const client = createClient(config);
        const result = await query(client, expression, options.time);

        if (options.json) {
          console.log(formatJson(result));
          return;
        }

        // Handle different result types
        switch (result.resultType) {
          case "vector": {
            const vectorResults = result.result as VectorResult[];
            if (vectorResults.length === 0) {
              console.log("No data");
              return;
            }
            const tableData = vectorResults.map((r) => ({
              metric: r.metric.__name__ || "",
              labels: formatLabels(r.metric),
              value: r.value[1],
            }));
            console.log(formatQueryTable(tableData));
            break;
          }

          case "scalar": {
            const scalarResult = result.result as { value: [number, string] };
            console.log(`scalar: ${scalarResult.value[1]}`);
            break;
          }

          case "string": {
            const stringResult = result.result as { value: [number, string] };
            console.log(`string: "${stringResult.value[1]}"`);
            break;
          }

          case "matrix": {
            // Matrix results are complex, show as JSON for clarity
            console.log("Matrix result (use --json for full output):");
            console.log(formatJson(result));
            break;
          }

          default:
            console.log(formatJson(result));
        }
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
