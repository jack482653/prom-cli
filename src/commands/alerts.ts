import { Command } from "commander";

import { formatCsv } from "../formatters/csv.js";
import { formatJson } from "../formatters/json.js";
import { formatAlertsTable } from "../formatters/table.js";
import { loadConfig } from "../services/config.js";
import { ErrorMessages, createClient, getAlerts, handleError } from "../services/prometheus.js";

interface AlertsOptions {
  json?: boolean;
  csv?: boolean;
}

/**
 * Create alerts command
 */
export function createAlertsCommand(): Command {
  const cmd = new Command("alerts")
    .description("List active alerts")
    .option("-j, --json", "Output as JSON")
    .option("--csv", "Output as CSV")
    .action(async (options: AlertsOptions) => {
      const config = loadConfig();

      if (!config) {
        console.error(ErrorMessages.NO_CONFIG);
        process.exit(1);
      }

      try {
        const client = createClient(config);
        const alerts = await getAlerts(client);

        if (alerts.length === 0) {
          console.log("No active alerts.");
          return;
        }

        if (options.json) {
          const jsonOutput = alerts.map((a) => ({
            name: a.name,
            state: a.state,
            severity: a.severity,
            labels: a.labels,
            annotations: a.annotations,
            activeAt: a.activeAt.toISOString(),
            value: a.value,
          }));
          console.log(formatJson(jsonOutput));
        } else if (options.csv) {
          const csvData = alerts.map((a) => ({
            name: a.name,
            state: a.state,
            severity: a.severity,
            activeAt: a.activeAt.toISOString(),
            value: a.value,
          }));
          console.log(
            formatCsv({
              columns: [
                { header: "name", key: "name" },
                { header: "state", key: "state" },
                { header: "severity", key: "severity" },
                { header: "activeAt", key: "activeAt" },
                { header: "value", key: "value" },
              ],
              data: csvData,
            }),
          );
        } else {
          console.log(formatAlertsTable(alerts));
        }
      } catch (error) {
        handleError(error, config.serverUrl);
      }
    });

  return cmd;
}
