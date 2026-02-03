import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InvalidTimeExpressionError,
  InvalidTimeRangeError,
  parseTimeRange,
} from "../src/commands/series.js";
import { getSeries } from "../src/services/prometheus.js";

// Mock axios instance
const createMockAxiosInstance = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  }) as unknown as AxiosInstance;

describe("Series Service", () => {
  let mockClient: AxiosInstance;

  beforeEach(() => {
    mockClient = createMockAxiosInstance();
  });

  // =============================================================================
  // T004: Test getSeries() with single matcher
  // =============================================================================
  describe("getSeries()", () => {
    describe("Given single matcher", () => {
      it("should query /api/v1/series with match[] parameter", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: [
              { __name__: "up", job: "prometheus", instance: "localhost:9090" },
              { __name__: "up", job: "node", instance: "localhost:9100" },
            ],
          },
        });

        const series = await getSeries(mockClient, ["up"]);

        expect(series).toEqual([
          { __name__: "up", job: "prometheus", instance: "localhost:9090" },
          { __name__: "up", job: "node", instance: "localhost:9100" },
        ]);
        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/series", {
          params: { "match[]": ["up"] },
        });
      });
    });

    // T005: Test getSeries() with multiple matchers
    describe("Given multiple matchers", () => {
      it("should query with all matchers (logical OR)", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: [
              { __name__: "up", job: "prometheus" },
              { __name__: "node_cpu_seconds_total", job: "node" },
            ],
          },
        });

        const series = await getSeries(mockClient, ["up", '{job="node"}']);

        expect(series).toHaveLength(2);
        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/series", {
          params: { "match[]": ["up", '{job="node"}'] },
        });
      });
    });

    // T006: Test getSeries() handles empty results
    describe("Given no matching series", () => {
      it("should return empty array", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: [],
          },
        });

        const series = await getSeries(mockClient, ['{job="nonexistent"}']);

        expect(series).toEqual([]);
      });
    });

    // T007: Test getSeries() handles Prometheus errors
    describe("Given Prometheus API error", () => {
      it("should throw error with message", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "error",
            error: "parse error at char 1: unexpected character",
            errorType: "bad_data",
          },
        });

        await expect(getSeries(mockClient, ["{invalid"])).rejects.toThrow(
          "parse error at char 1: unexpected character",
        );
      });
    });

    describe("Given error response without error message", () => {
      it("should throw generic error", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "error",
          },
        });

        await expect(getSeries(mockClient, ["up"])).rejects.toThrow("Failed to get series");
      });
    });

    // T018: Test getSeries() accepts start/end parameters
    describe("Given start and end parameters", () => {
      it("should include time range in request", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: [{ __name__: "up", job: "prometheus" }],
          },
        });

        await getSeries(mockClient, ["up"], 1704067200, 1704070800);

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/series", {
          params: {
            "match[]": ["up"],
            start: "1704067200",
            end: "1704070800",
          },
        });
      });
    });
  });
});

// =============================================================================
// Phase 3: User Story 2 - Time Range Filtering Tests
// =============================================================================
describe("Time Range Parsing", () => {
  // T019: Test parseTimeRange() parses RFC3339 format
  describe("parseTimeRange()", () => {
    describe("Given RFC3339 start time", () => {
      it("should parse to Unix timestamp", () => {
        const result = parseTimeRange({ start: "2024-01-01T00:00:00Z" });
        expect(result.start).toBe(1704067200);
        expect(result.end).toBeUndefined();
      });
    });

    describe("Given RFC3339 end time", () => {
      it("should parse to Unix timestamp", () => {
        const result = parseTimeRange({ end: "2024-01-01T01:00:00Z" });
        expect(result.start).toBeUndefined();
        expect(result.end).toBe(1704070800);
      });
    });

    // T020: Test parseTimeRange() parses relative format
    describe("Given relative time format", () => {
      it("should parse '1h' as 1 hour ago", () => {
        const result = parseTimeRange({ start: "1h" });
        const expectedTimestamp = Math.floor(Date.now() / 1000) - 3600;
        expect(result.start).toBeCloseTo(expectedTimestamp, -1);
      });

      it("should parse 'now' as current time", () => {
        const result = parseTimeRange({ end: "now" });
        const expectedTimestamp = Math.floor(Date.now() / 1000);
        expect(result.end).toBeCloseTo(expectedTimestamp, -1);
      });
    });

    // T021: Test parseTimeRange() validates start < end
    describe("Given start time after end time", () => {
      it("should throw InvalidTimeRangeError", () => {
        expect(() =>
          parseTimeRange({
            start: "2024-01-02T00:00:00Z",
            end: "2024-01-01T00:00:00Z",
          }),
        ).toThrow(InvalidTimeRangeError);
      });
    });

    // T022: Test parseTimeRange() throws InvalidTimeExpressionError
    describe("Given invalid time expression", () => {
      it("should throw InvalidTimeExpressionError for invalid start", () => {
        expect(() => parseTimeRange({ start: "invalid" })).toThrow(InvalidTimeExpressionError);
      });

      it("should throw InvalidTimeExpressionError for invalid end", () => {
        expect(() => parseTimeRange({ end: "not-a-time" })).toThrow(InvalidTimeExpressionError);
      });
    });

    // T023: Test parseTimeRange() throws InvalidTimeRangeError (already covered in T021)
    describe("Given valid time range", () => {
      it("should return both timestamps", () => {
        const result = parseTimeRange({
          start: "2024-01-01T00:00:00Z",
          end: "2024-01-01T01:00:00Z",
        });
        expect(result.start).toBe(1704067200);
        expect(result.end).toBe(1704070800);
      });
    });
  });
});
