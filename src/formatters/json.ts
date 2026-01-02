/**
 * JSON formatter for CLI output
 * Provides consistent JSON output formatting
 */

/**
 * Format data as pretty-printed JSON
 */
export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format data as compact JSON (single line)
 */
export function formatJsonCompact(data: unknown): string {
  return JSON.stringify(data);
}
