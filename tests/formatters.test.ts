import { describe, expect, it } from "vitest";

import { formatJson, formatJsonCompact } from "../src/formatters/json.js";
import {
  formatMatrixTable,
  formatQueryTable,
  formatTable,
  formatTargetsTable,
} from "../src/formatters/table.js";

describe("JSON Formatter", () => {
  describe("formatJson()", () => {
    describe("Given a simple object", () => {
      it("should return pretty-printed JSON", () => {
        const data = { name: "test", value: 123 };
        const result = formatJson(data);

        expect(result).toContain('"name": "test"');
        expect(result).toContain('"value": 123');
        expect(result).toContain("\n"); // Pretty printed has newlines
      });
    });

    describe("Given an array", () => {
      it("should return pretty-printed JSON array", () => {
        const data = [{ a: 1 }, { a: 2 }];
        const result = formatJson(data);

        expect(result).toContain("[");
        expect(result).toContain("]");
        expect(result.split("\n").length).toBeGreaterThan(1);
      });
    });

    describe("Given null or undefined", () => {
      it("should handle null", () => {
        expect(formatJson(null)).toBe("null");
      });
    });
  });

  describe("formatJsonCompact()", () => {
    describe("Given an object", () => {
      it("should return single-line JSON", () => {
        const data = { name: "test", value: 123 };
        const result = formatJsonCompact(data);

        expect(result).toBe('{"name":"test","value":123}');
        expect(result).not.toContain("\n");
      });
    });
  });
});

describe("Table Formatter", () => {
  describe("formatTable()", () => {
    describe("Given data with multiple rows", () => {
      it("should align columns properly", () => {
        const result = formatTable({
          columns: [
            { header: "NAME", key: "name" },
            { header: "VALUE", key: "value" },
          ],
          data: [
            { name: "short", value: "1" },
            { name: "longer name", value: "2" },
          ],
        });

        const lines = result.split("\n");
        expect(lines[0]).toContain("NAME");
        expect(lines[0]).toContain("VALUE");
        expect(lines.length).toBe(3); // Header + 2 data rows
      });
    });

    describe("Given empty data", () => {
      it("should return 'No data'", () => {
        const result = formatTable({
          columns: [{ header: "NAME", key: "name" }],
          data: [],
        });

        expect(result).toBe("No data");
      });
    });

    describe("Given data with missing keys", () => {
      it("should handle undefined values gracefully", () => {
        const result = formatTable({
          columns: [
            { header: "NAME", key: "name" },
            { header: "VALUE", key: "value" },
          ],
          data: [{ name: "test" }], // missing 'value'
        });

        expect(result).toContain("test");
        // Should not throw
      });
    });
  });

  describe("formatTargetsTable()", () => {
    describe("Given target data", () => {
      it("should format with correct columns: JOB, INSTANCE, STATE, LAST SCRAPE", () => {
        const result = formatTargetsTable([
          {
            job: "prometheus",
            instance: "localhost:9090",
            health: "up",
            lastScrapeAgo: "2s ago",
          },
        ]);

        expect(result).toContain("JOB");
        expect(result).toContain("INSTANCE");
        expect(result).toContain("STATE");
        expect(result).toContain("LAST SCRAPE");
        expect(result).toContain("prometheus");
        expect(result).toContain("localhost:9090");
        expect(result).toContain("up");
        expect(result).toContain("2s ago");
      });
    });

    describe("Given multiple targets with different states", () => {
      it("should display all targets", () => {
        const result = formatTargetsTable([
          {
            job: "prometheus",
            instance: "localhost:9090",
            health: "up",
            lastScrapeAgo: "2s ago",
          },
          {
            job: "node",
            instance: "192.168.1.10:9100",
            health: "down",
            lastScrapeAgo: "5m ago",
          },
        ]);

        const lines = result.split("\n");
        expect(lines.length).toBe(3); // Header + 2 rows
        expect(result).toContain("up");
        expect(result).toContain("down");
      });
    });
  });

  describe("formatQueryTable()", () => {
    describe("Given vector query results", () => {
      it("should format with correct columns: METRIC, LABELS, VALUE", () => {
        const result = formatQueryTable([
          {
            metric: "up",
            labels: '{instance="localhost:9090"}',
            value: "1",
          },
        ]);

        expect(result).toContain("METRIC");
        expect(result).toContain("LABELS");
        expect(result).toContain("VALUE");
        expect(result).toContain("up");
        expect(result).toContain("localhost:9090");
        expect(result).toContain("1");
      });
    });

    describe("Given multiple metrics", () => {
      it("should align all values properly", () => {
        const result = formatQueryTable([
          {
            metric: "up",
            labels: '{instance="localhost:9090"}',
            value: "1",
          },
          {
            metric: "node_cpu_seconds_total",
            labels: '{cpu="0",mode="idle"}',
            value: "12345.67",
          },
        ]);

        const lines = result.split("\n");
        expect(lines.length).toBe(3); // Header + 2 rows
      });
    });
  });

  describe("formatMatrixTable()", () => {
    describe("Given matrix results with single series", () => {
      it("should format with correct columns: METRIC, LABELS, POINTS, RANGE", () => {
        const result = formatMatrixTable([
          {
            metric: "up",
            labels: '{instance="localhost:9090",job="prometheus"}',
            points: 60,
            min: "1",
            max: "1",
          },
        ]);

        expect(result).toContain("METRIC");
        expect(result).toContain("LABELS");
        expect(result).toContain("POINTS");
        expect(result).toContain("RANGE");
        expect(result).toContain("up");
        expect(result).toContain("60");
        expect(result).toContain("1 - 1");
      });
    });

    describe("Given matrix results with multiple series", () => {
      it("should display all series", () => {
        const result = formatMatrixTable([
          {
            metric: "up",
            labels: '{instance="localhost:9090"}',
            points: 60,
            min: "1",
            max: "1",
          },
          {
            metric: "up",
            labels: '{instance="localhost:9100"}',
            points: 60,
            min: "0",
            max: "1",
          },
        ]);

        const lines = result.split("\n");
        expect(lines.length).toBe(3); // Header + 2 rows
        expect(result).toContain("localhost:9090");
        expect(result).toContain("localhost:9100");
      });
    });

    describe("Given empty matrix results", () => {
      it("should return 'No data'", () => {
        const result = formatMatrixTable([]);

        expect(result).toBe("No data");
      });
    });

    describe("Given varying value ranges", () => {
      it("should display min - max range", () => {
        const result = formatMatrixTable([
          {
            metric: "cpu_usage",
            labels: '{host="server1"}',
            points: 100,
            min: "0.15",
            max: "0.98",
          },
        ]);

        expect(result).toContain("0.15 - 0.98");
      });
    });
  });
});
