import { Command } from "commander";

import { formatCsv } from "../formatters/csv.js";
import { formatJson } from "../formatters/json.js";
import { formatRulesTable } from "../formatters/table.js";
import { loadConfig } from "../services/config.js";
import { ErrorMessages, createClient, getRules, handleError } from "../services/prometheus.js";
import type { Rule } from "../types/index.js";

interface RulesOptions {
  type?: string;
  json?: boolean;
  csv?: boolean;
}

export class InvalidRuleTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRuleTypeError";
  }
}

/**
 * Validate --type option value
 */
export function validateRuleType(type: string | undefined): void {
  if (type !== undefined && !["alerting", "recording"].includes(type)) {
    throw new InvalidRuleTypeError('--type must be "alerting" or "recording"');
  }
}

/**
 * Filter rules by type
 */
export function filterRules(rules: Rule[], type?: string): Rule[] {
  if (!type) return rules;
  return rules.filter((r) => r.type === type);
}

/**
 * Create rules command
 */
export function createRulesCommand(): Command {
  const cmd = new Command("rules")
    .description("List alerting and recording rules")
    .option("--type <type>", "Filter by rule type (alerting or recording)")
    .option("-j, --json", "Output as JSON")
    .option("--csv", "Output as CSV")
    .action(async (options: RulesOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        validateRuleType(options.type);

        const client = createClient(config);
        const rules = await getRules(client);
        const filtered = filterRules(rules, options.type);

        if (filtered.length === 0) {
          console.log("No rules configured.");
          return;
        }

        if (options.json) {
          const jsonOutput = filtered.map((r) => ({
            name: r.name,
            type: r.type,
            query: r.query,
            health: r.health,
            group: r.group,
            duration: r.duration,
            labels: r.labels,
            annotations: r.annotations,
          }));
          console.log(formatJson(jsonOutput));
        } else if (options.csv) {
          const csvData = filtered.map((r) => ({
            name: r.name,
            type: r.type,
            group: r.group,
            health: r.health,
            query: r.query,
          }));
          console.log(
            formatCsv({
              columns: [
                { header: "name", key: "name" },
                { header: "type", key: "type" },
                { header: "group", key: "group" },
                { header: "health", key: "health" },
                { header: "query", key: "query" },
              ],
              data: csvData,
            }),
          );
        } else {
          console.log(formatRulesTable(filtered));
        }
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
