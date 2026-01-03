import type { TimeParseResult } from "../types/index.js";

/**
 * Parse a time expression to Unix timestamp
 * Supports:
 * - "now" - current timestamp
 * - Relative durations: "30s", "5m", "1h", "7d"
 * - RFC3339 absolute timestamps: "2024-01-01T00:00:00Z"
 */
export function parseTimeExpression(expression: string): TimeParseResult {
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new Error("Empty time expression");
  }

  // Handle "now" keyword
  if (trimmed.toLowerCase() === "now") {
    return {
      timestamp: Math.floor(Date.now() / 1000),
      isRelative: true,
    };
  }

  // Try to parse relative duration (e.g., "1h", "30m", "7d")
  const relativeResult = parseRelativeDuration(trimmed);
  if (relativeResult !== null) {
    return relativeResult;
  }

  // Try to parse RFC3339 timestamp
  const absoluteResult = parseRFC3339(trimmed);
  if (absoluteResult !== null) {
    return absoluteResult;
  }

  throw new Error(
    `Invalid time format: "${expression}". Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)`,
  );
}

/**
 * Parse relative duration expression
 * Supports: Ns (seconds), Nm (minutes), Nh (hours), Nd (days)
 * Returns null if not a valid relative expression
 */
function parseRelativeDuration(expression: string): TimeParseResult | null {
  const match = expression.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (value <= 0) {
    throw new Error("Duration value must be positive");
  }

  let seconds: number;
  switch (unit) {
    case "s":
      seconds = value;
      break;
    case "m":
      seconds = value * 60;
      break;
    case "h":
      seconds = value * 3600;
      break;
    case "d":
      seconds = value * 86400;
      break;
    default:
      return null;
  }

  const now = Math.floor(Date.now() / 1000);
  return {
    timestamp: now - seconds,
    isRelative: true,
  };
}

/**
 * Parse RFC3339 timestamp
 * Returns null if not a valid RFC3339 format
 */
function parseRFC3339(expression: string): TimeParseResult | null {
  // Validate RFC3339 format strictly to avoid ambiguous date parsing
  const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-])\d{2}:\d{2})$/;
  if (!rfc3339Regex.test(expression)) {
    return null;
  }

  const date = new Date(expression);

  if (isNaN(date.getTime())) {
    return null;
  }

  return {
    timestamp: Math.floor(date.getTime() / 1000),
    isRelative: false,
  };
}

/**
 * Calculate a sensible default step for range queries
 * Targets approximately 200 data points for readability
 */
export function calculateDefaultStep(start: number, end: number): number {
  const range = end - start;
  return Math.max(1, Math.floor(range / 200));
}
