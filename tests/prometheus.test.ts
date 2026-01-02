import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient, formatRelativeTime, getTargets, query } from "../src/services/prometheus.js";
import type { Config } from "../src/types/index.js";

// Mock axios instance
const createMockAxiosInstance = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  }) as unknown as AxiosInstance;

describe("Prometheus Service", () => {
  describe("formatRelativeTime()", () => {
    describe("Given a time in the past", () => {
      it("should return seconds ago for < 60 seconds", () => {
        const date = new Date(Date.now() - 30 * 1000);
        const result = formatRelativeTime(date);
        expect(result).toMatch(/^\d+s ago$/);
      });

      it("should return minutes ago for 60-3599 seconds", () => {
        const date = new Date(Date.now() - 5 * 60 * 1000);
        const result = formatRelativeTime(date);
        expect(result).toMatch(/^\d+m ago$/);
      });

      it("should return hours ago for 1-23 hours", () => {
        const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const result = formatRelativeTime(date);
        expect(result).toMatch(/^\d+h ago$/);
      });

      it("should return days ago for >= 24 hours", () => {
        const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = formatRelativeTime(date);
        expect(result).toMatch(/^\d+d ago$/);
      });
    });

    describe("Given a very recent time", () => {
      it("should return 0s ago for current time", () => {
        const date = new Date();
        const result = formatRelativeTime(date);
        expect(result).toBe("0s ago");
      });
    });
  });

  describe("getTargets()", () => {
    let mockClient: AxiosInstance;

    beforeEach(() => {
      mockClient = createMockAxiosInstance();
    });

    describe("Given successful API response", () => {
      it("should parse active targets correctly", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: {
              activeTargets: [
                {
                  labels: {
                    job: "prometheus",
                    instance: "localhost:9090",
                  },
                  health: "up",
                  lastScrape: "2024-12-31T12:00:00.000Z",
                  lastScrapeDuration: 0.005,
                },
                {
                  labels: {
                    job: "node",
                    instance: "192.168.1.10:9100",
                  },
                  health: "down",
                  lastScrape: "2024-12-31T11:55:00.000Z",
                  lastScrapeDuration: 0.01,
                },
              ],
            },
          },
        });

        const targets = await getTargets(mockClient);

        expect(targets).toHaveLength(2);
        expect(targets[0].job).toBe("prometheus");
        expect(targets[0].instance).toBe("localhost:9090");
        expect(targets[0].health).toBe("up");
        expect(targets[1].job).toBe("node");
        expect(targets[1].health).toBe("down");
      });
    });

    describe("Given empty targets response", () => {
      it("should return empty array", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "success",
            data: {
              activeTargets: [],
            },
          },
        });

        const targets = await getTargets(mockClient);

        expect(targets).toEqual([]);
      });
    });

    describe("Given error response", () => {
      it("should return empty array on status error", async () => {
        vi.mocked(mockClient.get).mockResolvedValue({
          data: {
            status: "error",
            error: "something went wrong",
          },
        });

        const targets = await getTargets(mockClient);

        expect(targets).toEqual([]);
      });
    });
  });

  describe("query()", () => {
    let mockClient: AxiosInstance;

    beforeEach(() => {
      mockClient = createMockAxiosInstance();
    });

    describe("Given a vector result", () => {
      it("should return parsed vector data", async () => {
        vi.mocked(mockClient.post).mockResolvedValue({
          data: {
            status: "success",
            data: {
              resultType: "vector",
              result: [
                {
                  metric: { __name__: "up", instance: "localhost:9090" },
                  value: [1640000000, "1"],
                },
              ],
            },
          },
        });

        const result = await query(mockClient, "up");

        expect(result.resultType).toBe("vector");
        expect(result.result).toHaveLength(1);
      });
    });

    describe("Given a scalar result", () => {
      it("should return parsed scalar data", async () => {
        vi.mocked(mockClient.post).mockResolvedValue({
          data: {
            status: "success",
            data: {
              resultType: "scalar",
              result: [1640000000, "42"],
            },
          },
        });

        const result = await query(mockClient, "1+1");

        expect(result.resultType).toBe("scalar");
      });
    });

    describe("Given a time parameter", () => {
      it("should include time in request params", async () => {
        vi.mocked(mockClient.post).mockResolvedValue({
          data: {
            status: "success",
            data: {
              resultType: "vector",
              result: [],
            },
          },
        });

        await query(mockClient, "up", "2024-12-31T12:00:00Z");

        expect(mockClient.post).toHaveBeenCalledWith("/api/v1/query", expect.any(URLSearchParams));

        const params = vi.mocked(mockClient.post).mock.calls[0][1] as URLSearchParams;
        expect(params.get("query")).toBe("up");
        expect(params.get("time")).toBe("2024-12-31T12:00:00Z");
      });
    });

    describe("Given an error response", () => {
      it("should throw an error", async () => {
        vi.mocked(mockClient.post).mockResolvedValue({
          data: {
            status: "error",
            error: "parse error",
          },
        });

        await expect(query(mockClient, "invalid{")).rejects.toThrow("parse error");
      });
    });
  });

  describe("createClient()", () => {
    describe("Given config without auth", () => {
      it("should create client with default timeout", () => {
        const config: Config = {
          serverUrl: "http://localhost:9090",
        };

        // Just verify it doesn't throw
        expect(() => createClient(config)).not.toThrow();
      });
    });

    describe("Given config with basic auth", () => {
      it("should create client with Authorization header", () => {
        const config: Config = {
          serverUrl: "http://localhost:9090",
          auth: {
            type: "basic",
            username: "admin",
            password: "secret",
          },
        };

        const client = createClient(config);

        expect(client.defaults.headers.common["Authorization"]).toMatch(/^Basic /);
      });
    });

    describe("Given config with bearer token", () => {
      it("should create client with Bearer token header", () => {
        const config: Config = {
          serverUrl: "http://localhost:9090",
          auth: {
            type: "bearer",
            token: "my-token",
          },
        };

        const client = createClient(config);

        expect(client.defaults.headers.common["Authorization"]).toBe("Bearer my-token");
      });
    });

    describe("Given config with custom timeout", () => {
      it("should use the specified timeout", () => {
        const config: Config = {
          serverUrl: "http://localhost:9090",
          timeout: 60000,
        };

        const client = createClient(config);

        expect(client.defaults.timeout).toBe(60000);
      });
    });
  });
});
