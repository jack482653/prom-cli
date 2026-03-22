import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatCsv } from "../src/formatters/csv.js";
import { formatAlertsTable } from "../src/formatters/table.js";
import { getAlerts } from "../src/services/prometheus.js";
import type { Alert } from "../src/types/index.js";

const createMockAxiosInstance = () =>
  ({
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  }) as unknown as AxiosInstance;

const mockRawAlerts = [
  {
    labels: { alertname: "HighCPU", severity: "critical", job: "node" },
    annotations: { summary: "CPU above 90%" },
    state: "firing" as const,
    activeAt: "2026-03-21T10:00:00Z",
    value: "0.95",
  },
  {
    labels: { alertname: "DiskFull", severity: "warning", instance: "server1:9100" },
    annotations: { summary: "Disk usage above 80%" },
    state: "pending" as const,
    activeAt: "2026-03-21T10:05:00Z",
    value: "0.87",
  },
];

describe("getAlerts()", () => {
  let mockClient: AxiosInstance;

  beforeEach(() => {
    mockClient = createMockAxiosInstance();
  });

  describe("Given a Prometheus server with firing alerts", () => {
    it("When called, Then returns mapped Alert objects", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: { alerts: mockRawAlerts } },
      });

      const alerts = await getAlerts(mockClient);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].name).toBe("HighCPU");
      expect(alerts[0].state).toBe("firing");
      expect(alerts[0].severity).toBe("critical");
      expect(alerts[0].value).toBe("0.95");
      expect(alerts[0].activeAt).toBeInstanceOf(Date);
    });

    it("When called, Then alertname is removed from labels", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: { alerts: mockRawAlerts } },
      });

      const alerts = await getAlerts(mockClient);

      expect(alerts[0].labels).not.toHaveProperty("alertname");
      expect(alerts[0].labels).toHaveProperty("job", "node");
    });

    it("When called, Then severity is removed from labels", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: { alerts: mockRawAlerts } },
      });

      const alerts = await getAlerts(mockClient);

      expect(alerts[0].labels).not.toHaveProperty("severity");
    });
  });

  describe("Given a Prometheus server with no active alerts", () => {
    it("When called, Then returns empty array", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "success", data: { alerts: [] } },
      });

      const alerts = await getAlerts(mockClient);

      expect(alerts).toHaveLength(0);
    });
  });

  describe("Given an alert with no severity label", () => {
    it("When called, Then severity is empty string", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: {
          status: "success",
          data: {
            alerts: [
              {
                labels: { alertname: "NoSeverityAlert" },
                annotations: {},
                state: "firing",
                activeAt: "2026-03-21T10:00:00Z",
                value: "1",
              },
            ],
          },
        },
      });

      const alerts = await getAlerts(mockClient);

      expect(alerts[0].severity).toBe("");
    });
  });

  describe("Given an API error response", () => {
    it("When status is not success, Then returns empty array", async () => {
      vi.mocked(mockClient.get).mockResolvedValue({
        data: { status: "error", error: "something went wrong" },
      });

      const alerts = await getAlerts(mockClient);

      expect(alerts).toHaveLength(0);
    });
  });
});

describe("formatAlertsTable()", () => {
  describe("Given a list of alerts", () => {
    it("When called, Then output contains column headers including LABELS", () => {
      const alerts: Alert[] = [
        {
          name: "HighCPU",
          state: "firing",
          severity: "critical",
          labels: {},
          annotations: {},
          activeAt: new Date("2026-03-21T10:00:00Z"),
          value: "0.95",
        },
      ];

      const output = formatAlertsTable(alerts);

      expect(output).toContain("ALERT NAME");
      expect(output).toContain("STATE");
      expect(output).toContain("SEVERITY");
      expect(output).toContain("LABELS");
    });

    it("When called, Then output contains alert data", () => {
      const alerts: Alert[] = [
        {
          name: "HighCPU",
          state: "firing",
          severity: "critical",
          labels: {},
          annotations: {},
          activeAt: new Date("2026-03-21T10:00:00Z"),
          value: "0.95",
        },
      ];

      const output = formatAlertsTable(alerts);

      expect(output).toContain("HighCPU");
      expect(output).toContain("firing");
      expect(output).toContain("critical");
    });

    it("When alert has labels, Then labels column shows formatted label set", () => {
      const alerts: Alert[] = [
        {
          name: "HighCPU",
          state: "firing",
          severity: "critical",
          labels: { job: "node", env: "production" },
          annotations: {},
          activeAt: new Date("2026-03-21T10:00:00Z"),
          value: "0.95",
        },
      ];

      const output = formatAlertsTable(alerts);

      expect(output).toContain('job="node"');
      expect(output).toContain('env="production"');
    });
  });

  describe("Given an empty alerts list", () => {
    it("When called, Then returns no-data message", () => {
      const output = formatAlertsTable([]);
      expect(output).toBe("No data");
    });
  });
});

describe("alerts --csv output", () => {
  it("When csv data built for alerts, Then output contains expected headers", () => {
    const alerts: Alert[] = [
      {
        name: "HighCPU",
        state: "firing",
        severity: "critical",
        labels: { job: "node" },
        annotations: {},
        activeAt: new Date("2026-03-21T10:00:00Z"),
        value: "0.95",
      },
    ];

    const csvOutput = formatCsv({
      columns: [
        { header: "name", key: "name" },
        { header: "state", key: "state" },
        { header: "severity", key: "severity" },
        { header: "activeAt", key: "activeAt" },
        { header: "value", key: "value" },
      ],
      data: alerts.map((a) => ({
        name: a.name,
        state: a.state,
        severity: a.severity,
        activeAt: a.activeAt.toISOString(),
        value: a.value,
      })),
    });

    expect(csvOutput).toContain("name,state,severity,activeAt,value");
    expect(csvOutput).toContain("HighCPU,firing,critical");
  });

  it("When alert name contains comma, Then CSV field is quoted", () => {
    const alerts: Alert[] = [
      {
        name: "High,CPU",
        state: "firing",
        severity: "critical",
        labels: {},
        annotations: {},
        activeAt: new Date("2026-03-21T10:00:00Z"),
        value: "1",
      },
    ];

    const csvOutput = formatCsv({
      columns: [{ header: "name", key: "name" }],
      data: alerts.map((a) => ({ name: a.name })),
    });

    expect(csvOutput).toContain('"High,CPU"');
  });
});
