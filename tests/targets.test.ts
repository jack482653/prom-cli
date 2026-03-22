import { describe, expect, it } from "vitest";

import {
  InvalidStateError,
  filterTargets,
  validateLabelOption,
  validateStateOption,
} from "../src/commands/targets.js";
import { formatCsv } from "../src/formatters/csv.js";
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

describe("filterTargets() — label filtering", () => {
  const labelTargets: Target[] = [
    {
      job: "api",
      instance: "server1:8080",
      health: "up",
      lastScrape: new Date("2026-03-21T10:00:00Z"),
      lastScrapeDuration: 0.01,
      labels: { job: "api", instance: "server1:8080", env: "production", region: "us-east" },
    },
    {
      job: "api",
      instance: "server2:8080",
      health: "up",
      lastScrape: new Date("2026-03-21T10:00:00Z"),
      lastScrapeDuration: 0.01,
      labels: { job: "api", instance: "server2:8080", env: "staging", region: "us-east" },
    },
    {
      job: "node",
      instance: "server3:9100",
      health: "up",
      lastScrape: new Date("2026-03-21T10:00:00Z"),
      lastScrapeDuration: 0.01,
      labels: { job: "node", instance: "server3:9100", env: "production", region: "eu-west" },
    },
  ];

  describe("Given targets with label filter", () => {
    it("When single label filter matches, Then returns matching targets only", () => {
      const filtered = filterTargets(labelTargets, { labels: ["env=production"] });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.labels.env === "production")).toBe(true);
    });

    it("When multiple label filters applied, Then applies AND logic", () => {
      const filtered = filterTargets(labelTargets, {
        labels: ["env=production", "region=us-east"],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].instance).toBe("server1:8080");
    });

    it("When label value does not match, Then returns empty array", () => {
      const filtered = filterTargets(labelTargets, { labels: ["env=unknown"] });

      expect(filtered).toHaveLength(0);
    });

    it("When label filter combined with state filter, Then applies all conditions", () => {
      const filtered = filterTargets(labelTargets, {
        labels: ["env=production"],
        state: "up",
      });

      expect(filtered).toHaveLength(2);
    });

    it("When no label filter provided, Then returns all targets", () => {
      const filtered = filterTargets(labelTargets, {});

      expect(filtered).toHaveLength(3);
    });
  });
});

describe("validateLabelOption()", () => {
  it("When label is valid 'key=value', Then does not throw", () => {
    expect(() => validateLabelOption("env=production")).not.toThrow();
  });

  it("When label has no '=', Then throws error", () => {
    expect(() => validateLabelOption("badvalue")).toThrow('--label must be in "key=value" format');
  });

  it("When label has empty key, Then throws error", () => {
    expect(() => validateLabelOption("=value")).toThrow('--label must be in "key=value" format');
  });

  it("When label value is empty string, Then does not throw", () => {
    expect(() => validateLabelOption("key=")).not.toThrow();
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

describe("targets --csv output", () => {
  it("When csv data built for targets, Then output contains expected headers", () => {
    const csvOutput = formatCsv({
      columns: [
        { header: "job", key: "job" },
        { header: "instance", key: "instance" },
        { header: "health", key: "health" },
        { header: "lastScrape", key: "lastScrape" },
        { header: "lastScrapeDuration", key: "lastScrapeDuration" },
      ],
      data: [
        {
          job: "node_exporter",
          instance: "localhost:9100",
          health: "up",
          lastScrape: "2026-03-21T10:00:00.000Z",
          lastScrapeDuration: "0.04",
        },
      ],
    });

    expect(csvOutput).toContain("job,instance,health,lastScrape,lastScrapeDuration");
    expect(csvOutput).toContain("node_exporter,localhost:9100,up");
  });

  it("When instance contains comma, Then CSV field is quoted", () => {
    const csvOutput = formatCsv({
      columns: [{ header: "instance", key: "instance" }],
      data: [{ instance: "host,name:9100" }],
    });

    expect(csvOutput).toContain('"host,name:9100"');
  });
});
