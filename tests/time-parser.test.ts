import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateDefaultStep, parseTimeExpression } from "../src/services/time-parser.js";

describe("Time Parser", () => {
  describe("parseTimeExpression()", () => {
    describe("Given 'now' keyword", () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
      });

      it("should return current timestamp", () => {
        const result = parseTimeExpression("now");

        expect(result.timestamp).toBe(1705320000); // 2024-01-15T12:00:00Z
        expect(result.isRelative).toBe(true);
      });

      it("should be case insensitive", () => {
        const result = parseTimeExpression("NOW");

        expect(result.timestamp).toBe(1705320000);
        expect(result.isRelative).toBe(true);
      });
    });

    describe("Given relative duration expressions", () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
      });

      it("should parse seconds (30s)", () => {
        const result = parseTimeExpression("30s");

        expect(result.timestamp).toBe(1705320000 - 30);
        expect(result.isRelative).toBe(true);
      });

      it("should parse minutes (5m)", () => {
        const result = parseTimeExpression("5m");

        expect(result.timestamp).toBe(1705320000 - 5 * 60);
        expect(result.isRelative).toBe(true);
      });

      it("should parse hours (1h)", () => {
        const result = parseTimeExpression("1h");

        expect(result.timestamp).toBe(1705320000 - 3600);
        expect(result.isRelative).toBe(true);
      });

      it("should parse days (7d)", () => {
        const result = parseTimeExpression("7d");

        expect(result.timestamp).toBe(1705320000 - 7 * 24 * 3600);
        expect(result.isRelative).toBe(true);
      });

      it("should handle large values (24h)", () => {
        const result = parseTimeExpression("24h");

        expect(result.timestamp).toBe(1705320000 - 24 * 3600);
        expect(result.isRelative).toBe(true);
      });
    });

    describe("Given RFC3339 absolute timestamps", () => {
      it("should parse valid RFC3339 format", () => {
        const result = parseTimeExpression("2024-01-01T00:00:00Z");

        expect(result.timestamp).toBe(1704067200);
        expect(result.isRelative).toBe(false);
      });

      it("should parse RFC3339 with timezone offset", () => {
        const result = parseTimeExpression("2024-01-01T08:00:00+08:00");

        expect(result.timestamp).toBe(1704067200); // Same as midnight UTC
        expect(result.isRelative).toBe(false);
      });

      it("should pass through valid timestamps", () => {
        const result = parseTimeExpression("2024-06-15T15:30:00Z");

        expect(result.isRelative).toBe(false);
        expect(result.timestamp).toBe(1718465400); // 2024-06-15T15:30:00Z
      });
    });

    describe("Given invalid expressions", () => {
      it("should throw for invalid format", () => {
        expect(() => parseTimeExpression("invalid")).toThrow();
      });

      it("should throw for empty string", () => {
        expect(() => parseTimeExpression("")).toThrow();
      });

      it("should throw for malformed relative time", () => {
        expect(() => parseTimeExpression("5x")).toThrow();
      });

      it("should throw for negative values", () => {
        expect(() => parseTimeExpression("-5m")).toThrow();
      });
    });
  });

  describe("calculateDefaultStep()", () => {
    describe("Given various time ranges", () => {
      it("should return ~200 data points for 1 hour range", () => {
        const start = 1704067200;
        const end = 1704070800; // 1 hour = 3600 seconds
        const step = calculateDefaultStep(start, end);

        expect(step).toBe(18); // 3600 / 200 = 18
      });

      it("should return ~200 data points for 6 hour range", () => {
        const start = 1704067200;
        const end = 1704088800; // 6 hours = 21600 seconds
        const step = calculateDefaultStep(start, end);

        expect(step).toBe(108); // 21600 / 200 = 108
      });

      it("should return ~200 data points for 24 hour range", () => {
        const start = 1704067200;
        const end = 1704153600; // 24 hours = 86400 seconds
        const step = calculateDefaultStep(start, end);

        expect(step).toBe(432); // 86400 / 200 = 432
      });

      it("should return ~200 data points for 7 day range", () => {
        const start = 1704067200;
        const end = 1704672000; // 7 days = 604800 seconds
        const step = calculateDefaultStep(start, end);

        expect(step).toBe(3024); // 604800 / 200 = 3024
      });
    });

    describe("Given very short time ranges", () => {
      it("should return minimum step of 1 for very short ranges", () => {
        const start = 1704067200;
        const end = 1704067210; // 10 seconds
        const step = calculateDefaultStep(start, end);

        expect(step).toBe(1); // Min step is 1
      });

      it("should handle ranges under 200 seconds", () => {
        const start = 1704067200;
        const end = 1704067300; // 100 seconds
        const step = calculateDefaultStep(start, end);

        expect(step).toBe(1); // 100 / 200 = 0.5, rounded up to 1
      });
    });

    describe("Given step produces reasonable data points", () => {
      it("should produce 50-500 data points for typical ranges", () => {
        const testCases = [
          { start: 0, end: 3600 }, // 1 hour
          { start: 0, end: 21600 }, // 6 hours
          { start: 0, end: 86400 }, // 24 hours
          { start: 0, end: 604800 }, // 7 days
        ];

        for (const { start, end } of testCases) {
          const step = calculateDefaultStep(start, end);
          const dataPoints = Math.ceil((end - start) / step);

          expect(dataPoints).toBeGreaterThanOrEqual(50);
          expect(dataPoints).toBeLessThanOrEqual(500);
        }
      });
    });
  });
});
