import fs from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../src/types/index.js";

// Mock fs and os modules BEFORE importing config service
vi.mock("node:fs");
vi.mock("node:os", () => ({
  default: {
    homedir: vi.fn(() => "/mock/home"),
  },
  homedir: vi.fn(() => "/mock/home"),
}));

// Import after mocks are set up
const { loadConfig, normalizeUrl, saveConfig, validateUrl } =
  await import("../src/services/config.js");

describe("Config Service", () => {
  const mockHomeDir = "/mock/home";
  const mockConfigDir = path.join(mockHomeDir, ".prom-cli");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateUrl()", () => {
    describe("Given a valid HTTP URL", () => {
      it("should return true for http://localhost:9090", () => {
        expect(validateUrl("http://localhost:9090")).toBe(true);
      });

      it("should return true for https://prometheus.example.com", () => {
        expect(validateUrl("https://prometheus.example.com")).toBe(true);
      });

      it("should return true for http://192.168.1.1:9090", () => {
        expect(validateUrl("http://192.168.1.1:9090")).toBe(true);
      });
    });

    describe("Given an invalid URL", () => {
      it("should return false for empty string", () => {
        expect(validateUrl("")).toBe(false);
      });

      it("should return false for non-URL string", () => {
        expect(validateUrl("not-a-url")).toBe(false);
      });

      it("should return false for ftp:// protocol", () => {
        expect(validateUrl("ftp://server.com")).toBe(false);
      });

      it("should return false for URL without protocol", () => {
        expect(validateUrl("localhost:9090")).toBe(false);
      });
    });
  });

  describe("normalizeUrl()", () => {
    describe("Given a URL with trailing slash", () => {
      it("should remove single trailing slash", () => {
        expect(normalizeUrl("http://localhost:9090/")).toBe("http://localhost:9090");
      });

      it("should remove multiple trailing slashes", () => {
        expect(normalizeUrl("http://localhost:9090///")).toBe("http://localhost:9090");
      });
    });

    describe("Given a URL without trailing slash", () => {
      it("should return the URL unchanged", () => {
        expect(normalizeUrl("http://localhost:9090")).toBe("http://localhost:9090");
      });
    });
  });

  describe("loadConfig()", () => {
    describe("Given no config file exists", () => {
      it("should return null", () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        const config = loadConfig();

        expect(config).toBeNull();
      });
    });

    describe("Given a valid config file exists", () => {
      it("should return the parsed config", () => {
        const mockConfig: Config = {
          serverUrl: "http://localhost:9090",
          timeout: 30000,
        };

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

        const config = loadConfig();

        expect(config).toEqual(mockConfig);
      });
    });

    describe("Given an invalid JSON config file", () => {
      it("should return null", () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue("invalid json");

        const config = loadConfig();

        expect(config).toBeNull();
      });
    });
  });

  describe("saveConfig()", () => {
    describe("Given config directory does not exist", () => {
      it("should create the directory and save config", () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
        vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

        const config: Config = {
          serverUrl: "http://localhost:9090",
        };

        saveConfig(config);

        expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, {
          recursive: true,
        });
        expect(fs.writeFileSync).toHaveBeenCalled();
      });
    });

    describe("Given config with authentication", () => {
      it("should save config with basic auth", () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

        const config: Config = {
          serverUrl: "http://localhost:9090",
          auth: {
            type: "basic",
            username: "admin",
            password: "secret",
          },
        };

        saveConfig(config);

        const savedContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        const savedConfig = JSON.parse(savedContent as string);

        expect(savedConfig.auth.type).toBe("basic");
        expect(savedConfig.auth.username).toBe("admin");
      });

      it("should save config with bearer token", () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

        const config: Config = {
          serverUrl: "http://localhost:9090",
          auth: {
            type: "bearer",
            token: "my-token",
          },
        };

        saveConfig(config);

        const savedContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        const savedConfig = JSON.parse(savedContent as string);

        expect(savedConfig.auth.type).toBe("bearer");
        expect(savedConfig.auth.token).toBe("my-token");
      });
    });
  });
});
