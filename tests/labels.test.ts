import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/labels");
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

        expect(mockClient.get).toHaveBeenCalledWith(
          "/api/v1/labels?start=1704067200&end=1704070800",
        );
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

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/labels?start=1704067200");
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
        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/job/values");
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

        expect(mockClient.get).toHaveBeenCalledWith(
          "/api/v1/label/job/values?start=1704067200&end=1704070800",
        );
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

        await getLabelValues(mockClient, "__name__");

        expect(mockClient.get).toHaveBeenCalledWith("/api/v1/label/__name__/values");
      });
    });
  });
});
