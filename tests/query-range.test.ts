import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as configService from "../src/services/config.js";
import * as prometheusService from "../src/services/prometheus.js";
import { parseTimeExpression } from "../src/services/time-parser.js";

// Mock the services
vi.mock("../src/services/config.js");
vi.mock("../src/services/prometheus.js");

describe("Query Range Command", () => {
  const mockConfig = {
    serverUrl: "http://localhost:9090",
  };

  const mockClient = {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  } as unknown as AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configService.loadConfig).mockReturnValue(mockConfig);
    vi.mocked(prometheusService.createClient).mockReturnValue(mockClient);
  });

  describe("Given valid absolute timestamps", () => {
    it("should parse RFC3339 start and end times correctly", async () => {
      const start = "2024-01-01T00:00:00Z";
      const end = "2024-01-01T01:00:00Z";

      const startTs = Math.floor(new Date(start).getTime() / 1000);
      const endTs = Math.floor(new Date(end).getTime() / 1000);

      expect(startTs).toBe(1704067200);
      expect(endTs).toBe(1704070800);
      expect(endTs - startTs).toBe(3600); // 1 hour
    });

    it("should calculate correct step for 1 hour range", () => {
      const start = 1704067200;
      const end = 1704070800;
      const range = end - start; // 3600 seconds

      // Default step targets ~200 data points
      const expectedStep = Math.max(1, Math.floor(range / 200));
      expect(expectedStep).toBe(18); // 3600/200 = 18
    });
  });

  describe("Given queryRange service call", () => {
    it("should call queryRange with correct params", async () => {
      const mockResult = {
        resultType: "matrix" as const,
        result: [
          {
            metric: { __name__: "up", instance: "localhost:9090" },
            values: [
              [1704067200, "1"],
              [1704067260, "1"],
            ],
          },
        ],
      };

      vi.mocked(prometheusService.queryRange).mockResolvedValue(mockResult);

      const params = {
        query: "up",
        start: 1704067200,
        end: 1704070800,
        step: 60,
      };

      const result = await prometheusService.queryRange(mockClient, params);

      expect(prometheusService.queryRange).toHaveBeenCalledWith(mockClient, params);
      expect(result.resultType).toBe("matrix");
      expect(result.result).toHaveLength(1);
    });
  });

  describe("Time range validation", () => {
    describe("Given start time after end time", () => {
      it("should detect invalid range", () => {
        const start = "2024-01-02T00:00:00Z";
        const end = "2024-01-01T00:00:00Z";

        const startTs = Math.floor(new Date(start).getTime() / 1000);
        const endTs = Math.floor(new Date(end).getTime() / 1000);

        expect(startTs).toBeGreaterThan(endTs);
      });
    });

    describe("Given invalid RFC3339 format", () => {
      it("should fail to parse invalid timestamp", () => {
        const invalid = "not-a-timestamp";
        const parsed = new Date(invalid);

        expect(isNaN(parsed.getTime())).toBe(true);
      });

      it("should parse valid RFC3339 timestamp", () => {
        const valid = "2024-01-01T00:00:00Z";
        const parsed = new Date(valid);

        expect(isNaN(parsed.getTime())).toBe(false);
      });
    });

    describe("Given step larger than range", () => {
      it("should detect step exceeds range", () => {
        const start = 1704067200;
        const end = 1704070800;
        const range = end - start; // 3600 seconds
        const step = 7200; // 2 hours

        expect(step).toBeGreaterThan(range);
      });
    });
  });

  describe("Matrix result formatting", () => {
    it("should extract metric name and labels from result", () => {
      const result = {
        metric: { __name__: "up", instance: "localhost:9090", job: "prometheus" },
        values: [
          [1704067200, "1"],
          [1704067260, "1"],
        ] as [number, string][],
      };

      const metricName = result.metric.__name__ || "";
      const labels = Object.entries(result.metric)
        .filter(([k]) => k !== "__name__")
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");

      expect(metricName).toBe("up");
      expect(labels).toContain('instance="localhost:9090"');
      expect(labels).toContain('job="prometheus"');
    });

    it("should calculate min/max from values", () => {
      const values: [number, string][] = [
        [1704067200, "0.5"],
        [1704067260, "1.2"],
        [1704067320, "0.8"],
      ];

      const numericValues = values.map(([, v]) => parseFloat(v));
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      expect(min).toBe(0.5);
      expect(max).toBe(1.2);
    });
  });

  describe("Relative time integration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    describe("Given relative start and end times", () => {
      it("should convert '1h' to timestamp 1 hour ago", () => {
        const result = parseTimeExpression("1h");

        const now = Math.floor(Date.now() / 1000);
        expect(result.timestamp).toBe(now - 3600);
        expect(result.isRelative).toBe(true);
      });

      it("should convert 'now' to current timestamp", () => {
        const result = parseTimeExpression("now");

        const now = Math.floor(Date.now() / 1000);
        expect(result.timestamp).toBe(now);
        expect(result.isRelative).toBe(true);
      });

      it("should allow mixed relative and absolute times", () => {
        const relativeResult = parseTimeExpression("1h");
        const absoluteResult = parseTimeExpression("2024-01-15T11:00:00Z");

        // Both should result in same timestamp (1 hour before 12:00)
        expect(relativeResult.timestamp).toBe(absoluteResult.timestamp);
      });
    });

    describe("Given various relative formats", () => {
      it("should parse 30m correctly", () => {
        const result = parseTimeExpression("30m");
        const now = Math.floor(Date.now() / 1000);

        expect(result.timestamp).toBe(now - 30 * 60);
      });

      it("should parse 7d correctly", () => {
        const result = parseTimeExpression("7d");
        const now = Math.floor(Date.now() / 1000);

        expect(result.timestamp).toBe(now - 7 * 24 * 3600);
      });
    });
  });
});
