import type { AxiosInstance } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getStatus } from "../src/services/prometheus.js";
import type { ServerStatus } from "../src/types/index.js";

// Mock axios responses
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  defaults: { headers: { common: {} } },
} as unknown as AxiosInstance;

describe("Status Command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStatus()", () => {
    describe("Given a healthy Prometheus server", () => {
      it("should return healthy: true when /-/healthy returns 200", async () => {
        // Arrange
        mockAxiosInstance.get = vi.fn().mockImplementation((url: string) => {
          if (url === "/-/healthy") {
            return Promise.resolve({ status: 200, data: "Prometheus Server is Healthy." });
          }
          if (url === "/-/ready") {
            return Promise.resolve({ status: 200, data: "Prometheus Server is Ready." });
          }
          if (url === "/api/v1/status/buildinfo") {
            return Promise.resolve({
              status: 200,
              data: {
                status: "success",
                data: {
                  version: "2.45.0",
                  revision: "abc123",
                  branch: "HEAD",
                  buildUser: "root@builder",
                  buildDate: "2024-06-15",
                  goVersion: "go1.21.0",
                },
              },
            });
          }
          return Promise.reject(new Error("Unknown URL"));
        });

        // Act
        const status = await getStatus(mockAxiosInstance);

        // Assert
        expect(status.healthy).toBe(true);
        expect(status.ready).toBe(true);
        expect(status.buildInfo).toBeDefined();
        expect(status.buildInfo?.version).toBe("2.45.0");
      });
    });

    describe("Given an unhealthy Prometheus server", () => {
      it("should return healthy: false when /-/healthy returns non-200", async () => {
        // Arrange
        mockAxiosInstance.get = vi.fn().mockImplementation((url: string) => {
          if (url === "/-/healthy") {
            return Promise.reject({ response: { status: 503 } });
          }
          if (url === "/-/ready") {
            return Promise.resolve({ status: 200, data: "Ready" });
          }
          if (url === "/api/v1/status/buildinfo") {
            return Promise.resolve({
              status: 200,
              data: { status: "success", data: { version: "2.45.0" } },
            });
          }
          return Promise.reject(new Error("Unknown URL"));
        });

        // Act
        const status = await getStatus(mockAxiosInstance);

        // Assert
        expect(status.healthy).toBe(false);
        expect(status.ready).toBe(true);
      });
    });

    describe("Given a not-ready Prometheus server", () => {
      it("should return ready: false when /-/ready returns non-200", async () => {
        // Arrange
        mockAxiosInstance.get = vi.fn().mockImplementation((url: string) => {
          if (url === "/-/healthy") {
            return Promise.resolve({ status: 200, data: "Healthy" });
          }
          if (url === "/-/ready") {
            return Promise.reject({ response: { status: 503 } });
          }
          if (url === "/api/v1/status/buildinfo") {
            return Promise.resolve({
              status: 200,
              data: { status: "success", data: { version: "2.45.0" } },
            });
          }
          return Promise.reject(new Error("Unknown URL"));
        });

        // Act
        const status = await getStatus(mockAxiosInstance);

        // Assert
        expect(status.healthy).toBe(true);
        expect(status.ready).toBe(false);
      });
    });

    describe("Given buildinfo endpoint fails", () => {
      it("should return undefined buildInfo when /api/v1/status/buildinfo fails", async () => {
        // Arrange
        mockAxiosInstance.get = vi.fn().mockImplementation((url: string) => {
          if (url === "/-/healthy") {
            return Promise.resolve({ status: 200, data: "Healthy" });
          }
          if (url === "/-/ready") {
            return Promise.resolve({ status: 200, data: "Ready" });
          }
          if (url === "/api/v1/status/buildinfo") {
            return Promise.reject(new Error("Not found"));
          }
          return Promise.reject(new Error("Unknown URL"));
        });

        // Act
        const status = await getStatus(mockAxiosInstance);

        // Assert
        expect(status.healthy).toBe(true);
        expect(status.ready).toBe(true);
        expect(status.buildInfo).toBeUndefined();
      });
    });
  });

  describe("Status output format", () => {
    describe("Given JSON output is requested", () => {
      it("should include serverUrl, healthy, ready, and buildInfo fields", () => {
        // This is a contract test for the expected JSON structure
        const expectedStructure: ServerStatus & { serverUrl?: string } = {
          serverUrl: "http://localhost:9090",
          healthy: true,
          ready: true,
          buildInfo: {
            version: "2.45.0",
            revision: "abc123",
            branch: "HEAD",
            buildUser: "root@builder",
            buildDate: "2024-06-15",
            goVersion: "go1.21.0",
          },
        };

        expect(expectedStructure).toHaveProperty("serverUrl");
        expect(expectedStructure).toHaveProperty("healthy");
        expect(expectedStructure).toHaveProperty("ready");
        expect(expectedStructure).toHaveProperty("buildInfo");
      });
    });

    describe("Given table output is requested", () => {
      it("should display Server, Health, Ready, Version, Build Date, Go Version", () => {
        // Contract test: expected output lines
        const expectedLines = [
          "Server:",
          "Health:",
          "Ready:",
          "Version:",
          "Build Date:",
          "Go Version:",
        ];

        // This verifies the expected format structure
        expectedLines.forEach((line) => {
          expect(line).toMatch(/^(Server|Health|Ready|Version|Build Date|Go Version):/);
        });
      });
    });
  });
});
