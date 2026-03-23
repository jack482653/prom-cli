/**
 * RFC 4180 compliant CSV formatter
 */

export interface CsvColumn {
  header: string;
  key: string;
}

export interface CsvOptions {
  columns: CsvColumn[];
  data: Record<string, unknown>[];
}

/**
 * Escape a single CSV field per RFC 4180:
 * - Wrap in double-quotes if value contains comma, double-quote, or newline
 * - Escape embedded double-quotes by doubling them
 */
export function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format data as RFC 4180 CSV with header row
 */
export function formatCsv(options: CsvOptions): string {
  const { columns, data } = options;

  const header = columns.map((col) => escapeCsvField(col.header)).join(",");

  if (data.length === 0) {
    return header;
  }

  const rows = data.map((row) =>
    columns.map((col) => escapeCsvField(String(row[col.key] ?? ""))).join(","),
  );

  return [header, ...rows].join("\n");
}
