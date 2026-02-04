import { describe, expect, it } from "vitest";

import {
  InvalidStateError,
  filterTargets,
  validateStateOption,
} from "../src/commands/targets.js";
import type { Target } from "../src/types/index.js";

// Mock targets for testing
const mockTargets: Target[] = [
  {
    job: "prometheus",
    instance: "localhost:9090",
    health: "up",
    lastScrape: new Date("2025-02-03T10:00:00Z"),
    lastScrapeDuration: 0.05,
    labels: { job: "prometheus", instance: "localhost:9090" },
  },
  {
    job: "node_exporter",
    instance: "localhost:9100",
    health: "down",
    lastScrape: new Date("2025-02-03T10:00:05Z"),
    lastScrapeDuration: 0.03,
    labels: { job: "node_exporter", instance: "localhost:9100" },
  },
  {
    job: "node_exporter",
    instance: "localhost:9101",
    health: "up",
    lastScrape: new Date("2025-02-03T10:00:10Z"),
    lastScrapeDuration: 0.04,
    labels: { job: "node_exporter", instance: "localhost:9101" },
  },
];

describe("filterTargets()", () => {
  describe("Given targets with multiple jobs", () => {
    it("When job filter provided, Then returns only matching targets", () => {
      const filtered = filterTargets(mockTargets, { job: "prometheus" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].job).toBe("prometheus");
    });

    it("When job not found, Then returns empty array", () => {
      const filtered = filterTargets(mockTargets, { job: "nonexistent" });

      expect(filtered).toHaveLength(0);
    });
  });

  describe("Given targets with different health states", () => {
    it("When state filter is up, Then returns only healthy targets", () => {
      const filtered = filterTargets(mockTargets, { state: "up" });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.health === "up")).toBe(true);
    });

    it("When state filter is down, Then returns only unhealthy targets", () => {
      const filtered = filterTargets(mockTargets, { state: "down" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].health).toBe("down");
    });
  });

  describe("Given targets with combined filters", () => {
    it("When both job and state provided, Then returns targets matching both", () => {
      const filtered = filterTargets(mockTargets, {
        job: "node_exporter",
        state: "up",
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].job).toBe("node_exporter");
      expect(filtered[0].health).toBe("up");
    });

    it("When no targets match both filters, Then returns empty array", () => {
      const filtered = filterTargets(mockTargets, {
        job: "prometheus",
        state: "down",
      });

      expect(filtered).toHaveLength(0);
    });
  });

  describe("Given targets with no filters", () => {
    it("When no filters provided, Then returns all targets", () => {
      const filtered = filterTargets(mockTargets, {});

      expect(filtered).toHaveLength(3);
    });
  });
});

describe("validateStateOption()", () => {
  describe("Given valid state values", () => {
    it("When state is 'up', Then does not throw", () => {
      expect(() => validateStateOption("up")).not.toThrow();
    });

    it("When state is 'down', Then does not throw", () => {
      expect(() => validateStateOption("down")).not.toThrow();
    });

    it("When state is undefined, Then does not throw", () => {
      expect(() => validateStateOption(undefined)).not.toThrow();
    });
  });

  describe("Given invalid state value", () => {
    it("When state is 'invalid', Then throws InvalidStateError", () => {
      expect(() => validateStateOption("invalid")).toThrow(InvalidStateError);
      expect(() => validateStateOption("invalid")).toThrow('--state must be "up" or "down"');
    });

    it("When state is empty string, Then throws InvalidStateError", () => {
      expect(() => validateStateOption("")).toThrow(InvalidStateError);
    });

    it("When state is 'UP' (wrong case), Then throws InvalidStateError", () => {
      expect(() => validateStateOption("UP")).toThrow(InvalidStateError);
    });
  });
});
