import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InvalidTimeExpressionError,
  InvalidTimeRangeError,
  parseTimeRange,
} from "../src/commands/labels.js";
import { getLabels, getLabelValues } from "../src/services/prometheus.js";

// Mock axios instance
const createMockAxiosInstance = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  }) as unknown as AxiosInstance;

describe("Labels Service", () => {
  let mockClient: AxiosInstance;

  beforeEach(() => {
    mockClient = createMockAxiosInstance();
  });

  // =============================================================================
  // T005: Test getLabels() returns label names array
  // =============================================================================
  describe("getLabels()", () => {
    describe("Given successful API response with labels", () => {
      it("should return array of label names", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: ["__name__", "instance", "job", "method", "status_code"],
          },
        });

        const labels = await getLabels(mockClient);

        expect(labels).toEqual(["__name__", "instance", "job", "method", "status_code"]);
        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/labels", { params: {} });
      });
    });

    describe("Given empty labels response", () => {
      it("should return empty array", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: [],
          },
        });

        const labels = await getLabels(mockClient);

        expect(labels).toEqual([]);
      });
    });

    describe("Given error response", () => {
      it("should throw an error", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "error",
            error: "something went wrong",
          },
        });

        await expect(getLabels(mockClient)).rejects.toThrow("something went wrong");
      });
    });

    // T022: Test getLabels() accepts start/end parameters
    describe("Given start and end parameters", () => {
      it("should include time range in request", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: ["job", "instance"],
          },
        });

        await getLabels(mockClient, 1704067200, 1704070800);

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/labels", {
          params: { start: "1704067200", end: "1704070800" },
        });
      });
    });

    describe("Given only start parameter", () => {
      it("should include only start in request", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: ["job"],
          },
        });

        await getLabels(mockClient, 1704067200);

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/labels", {
          params: { start: "1704067200" },
        });
      });
    });
  });

  // =============================================================================
  // T014: Test getLabelValues() returns values array
  // =============================================================================
  describe("getLabelValues()", () => {
    describe("Given successful API response with values", () => {
      it("should return array of label values", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: ["prometheus", "node_exporter", "alertmanager"],
          },
        });

        const values = await getLabelValues(mockClient, "job");

        expect(values).toEqual(["prometheus", "node_exporter", "alertmanager"]);
        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/job/values", { params: {} });
      });
    });

    describe("Given empty values response", () => {
      it("should return empty array for nonexistent label", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: [],
          },
        });

        const values = await getLabelValues(mockClient, "nonexistent");

        expect(values).toEqual([]);
      });
    });

    describe("Given error response", () => {
      it("should throw an error", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "error",
            error: "label not found",
          },
        });

        await expect(getLabelValues(mockClient, "invalid")).rejects.toThrow("label not found");
      });
    });

    // T023: Test getLabelValues() accepts start/end parameters
    describe("Given start and end parameters", () => {
      it("should include time range in request", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: ["value1", "value2"],
          },
        });

        await getLabelValues(mockClient, "job", 1704067200, 1704070800);

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/job/values", {
          params: { start: "1704067200", end: "1704070800" },
        });
      });
    });

    describe("Given label name with special characters", () => {
      it("should URL-encode the label name", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: ["value"],
          },
        });

        await getLabelValues(mockClient, "foo/bar");

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/foo%2Fbar/values", {
          params: {},
        });
      });
    });
  });
});

// =============================================================================
// parseTimeRange() tests
// =============================================================================
describe("parseTimeRange()", () => {
  describe("Given invalid start time", () => {
    it("should throw InvalidTimeExpressionError", () => {
      expect(() => parseTimeRange({ start: "invalid" })).toThrow(InvalidTimeExpressionError);
      expect(() => parseTimeRange({ start: "invalid" })).toThrow(
        "Invalid start time. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)",
      );
    });
  });

  describe("Given invalid end time", () => {
    it("should throw InvalidTimeExpressionError", () => {
      expect(() => parseTimeRange({ end: "invalid" })).toThrow(InvalidTimeExpressionError);
      expect(() => parseTimeRange({ end: "invalid" })).toThrow(
        "Invalid end time. Use RFC3339 (2024-01-01T00:00:00Z) or relative (1h, 30m, now)",
      );
    });
  });

  describe("Given start time after end time", () => {
    it("should throw InvalidTimeRangeError", () => {
      const start = "2024-01-02T00:00:00Z";
      const end = "2024-01-01T00:00:00Z";

      expect(() => parseTimeRange({ start, end })).toThrow(InvalidTimeRangeError);
      expect(() => parseTimeRange({ start, end })).toThrow("Start time must be before end time.");
    });
  });

  describe("Given valid time range", () => {
    it("should return parsed timestamps", () => {
      const start = "2024-01-01T00:00:00Z";
      const end = "2024-01-02T00:00:00Z";

      const result = parseTimeRange({ start, end });

      expect(result.start).toBeDefined();
      expect(result.end).toBeDefined();
      expect(result.start).toBeLessThan(result.end!);
    });
  });

  describe("Given no time options", () => {
    it("should return empty object", () => {
      const result = parseTimeRange({});

      expect(result.start).toBeUndefined();
      expect(result.end).toBeUndefined();
    });
  });
});
