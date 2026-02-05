import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  addConfiguration,
  getActiveConfig,
  listConfigurations,
  loadConfigStore,
  removeConfiguration,
  saveConfigStore,
  setActiveConfig,
  validateAuthentication,
  validateConfigName,
  validateServerUrl,
} from "../src/services/config-store.js";
import type { ConfigStore, Configuration } from "../src/types/index.js";

describe("ConfigStore Operations", () => {
  let testConfigDir: string;
  let testConfigPath: string;

  beforeEach(() => {
    // Create temp directory for testing
    testConfigDir = join(tmpdir(), `prom-cli-test-${Date.now()}`);
    mkdirSync(testConfigDir, { recursive: true });
    testConfigPath = join(testConfigDir, "config.json");

    // Override config path for testing
    process.env.PROM_CLI_CONFIG_PATH = testConfigPath;
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true, force: true });
    }
    delete process.env.PROM_CLI_CONFIG_PATH;
  });

  describe("Given no config file exists", () => {
    it("When loading config store, Then returns empty store", () => {
      // Act
      const store = loadConfigStore();

      // Assert
      expect(store).toEqual({
        configs: {},
        activeConfig: undefined,
      });
    });
  });

  describe("Given empty config store", () => {
    it("When adding first configuration, Then becomes active automatically", () => {
      // Arrange
      let store = loadConfigStore();

      const config: Configuration = {
        serverUrl: "http://localhost:9090",
      };

      // Act
      store = addConfiguration(store, "dev", config);

      // Assert
      expect(store.configs["dev"]).toEqual(config);
      expect(store.activeConfig).toBe("dev");
    });
  });

  describe("Given one config exists", () => {
    it("When adding second configuration, Then remains inactive", () => {
      // Arrange
      let store = loadConfigStore();

      store = addConfiguration(store, "dev", {
        serverUrl: "http://localhost:9090",
      });

      // Act
      store = addConfiguration(store, "prod", {
        serverUrl: "https://prod.example.com",
      });

      // Assert
      expect(store.configs["prod"]).toBeDefined();
      expect(store.activeConfig).toBe("dev"); // Still dev
    });
  });

  describe("Given multiple configurations", () => {
    it("When switching active config, Then updates activeConfig field", () => {
      // Arrange
      let store = loadConfigStore();

      store = addConfiguration(store, "dev", {
        serverUrl: "http://localhost:9090",
      });
      store = addConfiguration(store, "prod", {
        serverUrl: "https://prod.example.com",
      });

      // Act
      store = setActiveConfig(store, "prod");

      // Assert
      expect(store.activeConfig).toBe("prod");
    });

    it("When removing inactive config, Then active remains unchanged", () => {
      // Arrange
      let store = loadConfigStore();

      store = addConfiguration(store, "dev", {
        serverUrl: "http://localhost:9090",
      });
      store = addConfiguration(store, "prod", {
        serverUrl: "https://prod.example.com",
      });

      // Act
      store = removeConfiguration(store, "prod");

      // Assert
      expect(store.configs["prod"]).toBeUndefined();
      expect(store.activeConfig).toBe("dev");
    });

    it("When listing configurations, Then returns sorted names", () => {
      // Arrange
      let store = loadConfigStore();

      store = addConfiguration(store, "staging", {
        serverUrl: "https://staging.example.com",
      });
      store = addConfiguration(store, "dev", {
        serverUrl: "http://localhost:9090",
      });
      store = addConfiguration(store, "production", {
        serverUrl: "https://prod.example.com",
      });

      // Act
      const names = listConfigurations(store);

      // Assert
      expect(names).toEqual(["dev", "production", "staging"]);
    });
  });

  describe("Given config store with active config", () => {
    it("When getting active config, Then returns configuration", () => {
      // Arrange
      let store = loadConfigStore();

      const devConfig: Configuration = {
        serverUrl: "http://localhost:9090",
      };

      store = addConfiguration(store, "dev", devConfig);

      // Act
      const activeConfig = getActiveConfig(store);

      // Assert
      expect(activeConfig).toEqual(devConfig);
    });
  });

  describe("Given config store without active config", () => {
    it("When getting active config, Then returns null", () => {
      // Arrange
      const store = loadConfigStore();

      // Act
      const activeConfig = getActiveConfig(store);

      // Assert
      expect(activeConfig).toBeNull();
    });
  });

  describe("Given config store can be saved and loaded", () => {
    it("When saving and loading store, Then data persists", () => {
      // Arrange
      let store = loadConfigStore();

      store = addConfiguration(store, "dev", {
        serverUrl: "http://localhost:9090",
        username: "admin",
        password: "secret",
      });

      // Act: Save
      saveConfigStore(store);

      // Assert: Load and verify
      const loadedStore = loadConfigStore();
      expect(loadedStore).toEqual(store);
      expect(loadedStore.configs["dev"].username).toBe("admin");
    });
  });
});

describe("Configuration Validation", () => {
  describe("validateConfigName()", () => {
    describe("Given valid configuration names", () => {
      it("When validating 'production', Then does not throw", () => {
        expect(() => validateConfigName("production")).not.toThrow();
      });

      it("When validating 'prod-us-west', Then does not throw", () => {
        expect(() => validateConfigName("prod-us-west")).not.toThrow();
      });

      it("When validating 'staging_eu', Then does not throw", () => {
        expect(() => validateConfigName("staging_eu")).not.toThrow();
      });

      it("When validating 'team-1', Then does not throw", () => {
        expect(() => validateConfigName("team-1")).not.toThrow();
      });

      it("When validating single character 'a', Then does not throw", () => {
        expect(() => validateConfigName("a")).not.toThrow();
      });
    });

    describe("Given invalid configuration names", () => {
      it("When validating empty string, Then throws error", () => {
        expect(() => validateConfigName("")).toThrow("Configuration name must be 1-64 characters");
      });

      it("When validating name over 64 characters, Then throws error", () => {
        const longName = "a".repeat(65);
        expect(() => validateConfigName(longName)).toThrow(
          "Configuration name must be 1-64 characters",
        );
      });

      it("When validating name starting with hyphen, Then throws error", () => {
        expect(() => validateConfigName("-production")).toThrow(
          "Configuration name must contain only letters, numbers, hyphens, and underscores",
        );
      });

      it("When validating name ending with underscore, Then throws error", () => {
        expect(() => validateConfigName("staging_")).toThrow(
          "Configuration name must contain only letters, numbers, hyphens, and underscores",
        );
      });

      it("When validating name with consecutive hyphens, Then throws error", () => {
        expect(() => validateConfigName("prod--west")).toThrow(
          "Configuration name cannot contain consecutive special characters",
        );
      });

      it("When validating name with consecutive underscores, Then throws error", () => {
        expect(() => validateConfigName("prod__west")).toThrow(
          "Configuration name cannot contain consecutive special characters",
        );
      });

      it("When validating name with space, Then throws error", () => {
        expect(() => validateConfigName("my config")).toThrow(
          "Configuration name must contain only letters, numbers, hyphens, and underscores",
        );
      });

      it("When validating name with special characters, Then throws error", () => {
        expect(() => validateConfigName("test@prod")).toThrow(
          "Configuration name must contain only letters, numbers, hyphens, and underscores",
        );
      });
    });
  });

  describe("validateServerUrl()", () => {
    describe("Given valid server URLs", () => {
      it("When validating 'http://localhost:9090', Then does not throw", () => {
        expect(() => validateServerUrl("http://localhost:9090")).not.toThrow();
      });

      it("When validating 'https://prometheus.example.com', Then does not throw", () => {
        expect(() => validateServerUrl("https://prometheus.example.com")).not.toThrow();
      });

      it("When validating 'https://10.0.0.1:9090', Then does not throw", () => {
        expect(() => validateServerUrl("https://10.0.0.1:9090")).not.toThrow();
      });

      it("When validating URL with path, Then does not throw", () => {
        expect(() => validateServerUrl("https://example.com/prometheus")).not.toThrow();
      });
    });

    describe("Given invalid server URLs", () => {
      it("When validating URL without protocol, Then throws error", () => {
        expect(() => validateServerUrl("prometheus.example.com")).toThrow("Invalid URL format");
      });

      it("When validating URL with wrong protocol, Then throws error", () => {
        expect(() => validateServerUrl("ftp://prometheus.example.com")).toThrow(
          "URL must use http:// or https://",
        );
      });

      it("When validating URL with query parameters, Then throws error", () => {
        expect(() => validateServerUrl("https://example.com?foo=bar")).toThrow(
          "URL cannot contain query parameters or fragments",
        );
      });

      it("When validating URL with fragment, Then throws error", () => {
        expect(() => validateServerUrl("https://example.com#section")).toThrow(
          "URL cannot contain query parameters or fragments",
        );
      });
    });
  });

  describe("validateAuthentication()", () => {
    describe("Given valid authentication configurations", () => {
      it("When validating config with no auth, Then does not throw", () => {
        const config: Configuration = {
          serverUrl: "http://localhost:9090",
        };
        expect(() => validateAuthentication(config)).not.toThrow();
      });

      it("When validating config with basic auth, Then does not throw", () => {
        const config: Configuration = {
          serverUrl: "http://localhost:9090",
          username: "admin",
          password: "secret",
        };
        expect(() => validateAuthentication(config)).not.toThrow();
      });

      it("When validating config with bearer token, Then does not throw", () => {
        const config: Configuration = {
          serverUrl: "http://localhost:9090",
          token: "abc123",
        };
        expect(() => validateAuthentication(config)).not.toThrow();
      });
    });

    describe("Given invalid authentication configurations", () => {
      it("When validating config with both basic auth and token, Then throws error", () => {
        const config: Configuration = {
          serverUrl: "http://localhost:9090",
          username: "admin",
          password: "secret",
          token: "abc123",
        };
        expect(() => validateAuthentication(config)).toThrow(
          "Cannot use both username/password and token authentication",
        );
      });

      it("When validating config with username but no password, Then throws error", () => {
        const config: Configuration = {
          serverUrl: "http://localhost:9090",
          username: "admin",
        };
        expect(() => validateAuthentication(config)).toThrow(
          "Password required when username is provided",
        );
      });

      it("When validating config with password but no username, Then throws error", () => {
        const config: Configuration = {
          serverUrl: "http://localhost:9090",
          password: "secret",
        };
        expect(() => validateAuthentication(config)).toThrow(
          "Username required when password is provided",
        );
      });
    });
  });
});
