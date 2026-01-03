/**
 * Table formatter for CLI output
 * Provides column alignment similar to gcloud output
 */

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
}

export interface TableOptions {
  columns: TableColumn[];
  data: Record<string, unknown>[];
}

/**
 * Calculate column widths based on content
 */
function calculateWidths(columns: TableColumn[], data: Record<string, unknown>[]): number[] {
  return columns.map((col) => {
    const headerWidth = col.header.length;
    const maxDataWidth = data.reduce((max, row) => {
      const value = String(row[col.key] ?? "");
      return Math.max(max, value.length);
    }, 0);
    return col.width ?? Math.max(headerWidth, maxDataWidth);
  });
}

/**
 * Pad string to specified width
 */
function padEnd(str: string, width: number): string {
  const value = String(str);
  if (value.length >= width) {
    return value.slice(0, width);
  }
  return value + " ".repeat(width - value.length);
}

/**
 * Format data as aligned table
 */
export function formatTable(options: TableOptions): string {
  const { columns, data } = options;

  if (data.length === 0) {
    return "No data";
  }

  const widths = calculateWidths(columns, data);
  const lines: string[] = [];

  // Header row
  const header = columns.map((col, i) => padEnd(col.header, widths[i])).join("  ");
  lines.push(header);

  // Data rows
  for (const row of data) {
    const line = columns.map((col, i) => padEnd(String(row[col.key] ?? ""), widths[i])).join("  ");
    lines.push(line);
  }

  return lines.join("\n");
}

/**
 * Format targets as table
 */
export function formatTargetsTable(
  targets: Array<{
    job: string;
    instance: string;
    health: string;
    lastScrapeAgo: string;
  }>,
): string {
  return formatTable({
    columns: [
      { header: "JOB", key: "job" },
      { header: "INSTANCE", key: "instance" },
      { header: "STATE", key: "health" },
      { header: "LAST SCRAPE", key: "lastScrapeAgo" },
    ],
    data: targets,
  });
}

/**
 * Format query vector results as table
 */
export function formatQueryTable(
  results: Array<{
    metric: string;
    labels: string;
    value: string;
  }>,
): string {
  return formatTable({
    columns: [
      { header: "METRIC", key: "metric" },
      { header: "LABELS", key: "labels" },
      { header: "VALUE", key: "value" },
    ],
    data: results,
  });
}

/**
 * Format matrix (range query) results as table
 */
export function formatMatrixTable(
  results: Array<{
    metric: string;
    labels: string;
    points: number;
    min: string;
    max: string;
  }>,
): string {
  // Transform data to include range column
  const dataWithRange = results.map((r) => ({
    ...r,
    range: `${r.min} - ${r.max}`,
  }));

  return formatTable({
    columns: [
      { header: "METRIC", key: "metric" },
      { header: "LABELS", key: "labels" },
      { header: "POINTS", key: "points" },
      { header: "RANGE", key: "range" },
    ],
    data: dataWithRange,
  });
}
