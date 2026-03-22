import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateRuleType } from "../src/commands/rules.js";
import { formatRulesTable } from "../src/formatters/table.js";
import { getRules } from "../src/services/prometheus.js";
import type { Rule } from "../src/types/index.js";

const createMockAxiosInstance = () =>
  ({
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  }) as unknown as AxiosInstance;

const mockRulesResponse = {
  groups: [
    {
      name: "node.rules",
      file: "/etc/prometheus/rules.yml",
      interval: 60,
      rules: [
        {
          type: "alerting",
          name: "HighCPU",
          query: "node_cpu_seconds_total > 0.9",
          duration: 300,
          labels: { severity: "critical" },
          annotations: { summary: "CPU above 90%" },
          health: "ok",
          lastEvaluation: "2026-03-21T10:00:00Z",
          evaluationTime: 0.001,
        },
        {
          type: "recording",
          name: "job:cpu:avg",
          query: "avg by (job)(rate(node_cpu_seconds_total[5m]))",
          labels: {},
          health: "ok",
          lastEvaluation: "2026-03-21T10:00:00Z",
          evaluationTime: 0.001,
        },
      ],
    },
    {
      name: "api.rules",
      file: "/etc/prometheus/api-rules.yml",
      interval: 30,
      rules: [
        {
          type: "alerting",
          name: "HighLatency",
          query: "http_request_duration_seconds > 1",
          duration: 60,
          labels: { severity: "warning" },
          annotations: { summary: "High latency" },
          health: "ok",
          lastEvaluation: "2026-03-21T10:00:00Z",
          evaluationTime: 0.002,
        },
      ],
    },
  ],
};

describe("getRules()", () => {
  let mockClient: AxiosInstance;

  beforeEach(() => {
    mockClient = createMockAxiosInstance();
  });

  describe("Given a Prometheus server with configured rules", () => {
    it("When called, Then returns flattened Rule objects from all groups", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: mockRulesResponse },
      });

      const rules = await getRules(mockClient);

      expect(rules).toHaveLength(3);
    });

    it("When called, Then each rule has the parent group name", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: mockRulesResponse },
      });

      const rules = await getRules(mockClient);

      expect(rules[0].group).toBe("node.rules");
      expect(rules[1].group).toBe("node.rules");
      expect(rules[2].group).toBe("api.rules");
    });

    it("When called, Then alerting rules include duration", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: mockRulesResponse },
      });

      const rules = await getRules(mockClient);
      const alertingRule = rules.find((r) => r.name === "HighCPU");

      expect(alertingRule?.duration).toBe(300);
    });

    it("When called, Then recording rules have undefined duration", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: mockRulesResponse },
      });

      const rules = await getRules(mockClient);
      const recordingRule = rules.find((r) => r.name === "job:cpu:avg");

      expect(recordingRule?.duration).toBeUndefined();
    });
  });

  describe("Given an empty rules response", () => {
    it("When called, Then returns empty array", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: { groups: [] } },
      });

      const rules = await getRules(mockClient);

      expect(rules).toHaveLength(0);
    });
  });

  describe("Given an API error response", () => {
    it("When status is not success, Then returns empty array", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "error", error: "something went wrong" },
      });

      const rules = await getRules(mockClient);

      expect(rules).toHaveLength(0);
    });
  });
});

describe("formatRulesTable()", () => {
  describe("Given a list of rules", () => {
    it("When called, Then output contains column headers", () => {
      const rules: Rule[] = [
        {
          name: "HighCPU",
          type: "alerting",
          query: "node_cpu > 0.9",
          health: "ok",
          group: "node.rules",
          labels: {},
          annotations: {},
        },
      ];

      const output = formatRulesTable(rules);

      expect(output).toContain("NAME");
      expect(output).toContain("TYPE");
      expect(output).toContain("GROUP");
      expect(output).toContain("HEALTH");
      expect(output).toContain("EXPRESSION");
    });

    it("When called, Then output contains rule data", () => {
      const rules: Rule[] = [
        {
          name: "HighCPU",
          type: "alerting",
          query: "node_cpu > 0.9",
          health: "ok",
          group: "node.rules",
          labels: {},
          annotations: {},
        },
      ];

      const output = formatRulesTable(rules);

      expect(output).toContain("HighCPU");
      expect(output).toContain("alerting");
      expect(output).toContain("node.rules");
    });
  });

  describe("Given an empty rules list", () => {
    it("When called, Then returns no-data message", () => {
      const output = formatRulesTable([]);
      expect(output).toBe("No data");
    });
  });
});

describe("validateRuleType()", () => {
  it("When type is undefined, Then does not throw", () => {
    expect(() => validateRuleType(undefined)).not.toThrow();
  });

  it("When type is 'alerting', Then does not throw", () => {
    expect(() => validateRuleType("alerting")).not.toThrow();
  });

  it("When type is 'recording', Then does not throw", () => {
    expect(() => validateRuleType("recording")).not.toThrow();
  });

  it("When type is invalid, Then throws error", () => {
    expect(() => validateRuleType("invalid")).toThrow('--type must be "alerting" or "recording"');
  });
});
