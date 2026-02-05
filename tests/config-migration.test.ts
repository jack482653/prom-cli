import { describe, expect, it } from "vitest";

import { detectOldFormat, migrateOldConfig } from "../src/services/config-migration.js";
import type { ConfigStore } from "../src/types/index.js";

describe("Config Migration", () => {
  describe("Given old format config", () => {
    it("When detecting format, Then identifies as old format", () => {
      // Arrange
      const oldConfig = {
        serverUrl: "https://prometheus.example.com",
        username: "admin",
        password: "secret",
      };

      // Act
      const isOldFormat = detectOldFormat(oldConfig);

      // Assert
      expect(isOldFormat).toBe(true);
    });

    it("When migrating basic config, Then creates default config", () => {
      // Arrange
      const oldConfig = {
        serverUrl: "https://prometheus.example.com",
      };

      // Act
      const newStore = migrateOldConfig(oldConfig);

      // Assert
      expect(newStore.activeConfig).toBe("default");
      expect(newStore.configs["default"]).toEqual({
        serverUrl: "https://prometheus.example.com",
      });
    });

    it("When migrating config with basic auth, Then preserves all auth fields", () => {
      // Arrange
      const oldConfig = {
        serverUrl: "https://prometheus.example.com",
        username: "admin",
        password: "secret",
      };

      // Act
      const newStore = migrateOldConfig(oldConfig);

      // Assert
      expect(newStore.activeConfig).toBe("default");
      expect(newStore.configs["default"]).toEqual({
        serverUrl: "https://prometheus.example.com",
        username: "admin",
        password: "secret",
      });
    });

    it("When migrating config with bearer token, Then preserves token", () => {
      // Arrange
      const oldConfig = {
        serverUrl: "https://prometheus.example.com",
        token: "abc123xyz",
      };

      // Act
      const newStore = migrateOldConfig(oldConfig);

      // Assert
      expect(newStore.activeConfig).toBe("default");
      expect(newStore.configs["default"]).toEqual({
        serverUrl: "https://prometheus.example.com",
        token: "abc123xyz",
      });
    });
  });

  describe("Given new format config", () => {
    it("When detecting format, Then identifies as new format", () => {
      // Arrange
      const newConfig: ConfigStore = {
        activeConfig: "production",
        configs: {
          production: {
            serverUrl: "https://prod.example.com",
          },
        },
      };

      // Act
      const isOldFormat = detectOldFormat(newConfig);

      // Assert
      expect(isOldFormat).toBe(false);
    });
  });

  describe("Given config with configs field but also serverUrl", () => {
    it("When detecting format, Then identifies as new format", () => {
      // Arrange - malformed but has configs field
      const config = {
        serverUrl: "https://prometheus.example.com",
        configs: {
          production: {
            serverUrl: "https://prod.example.com",
          },
        },
      };

      // Act
      const isOldFormat = detectOldFormat(config);

      // Assert
      expect(isOldFormat).toBe(false);
    });
  });

  describe("Given empty object", () => {
    it("When detecting format, Then identifies as new format", () => {
      // Arrange
      const emptyConfig = {};

      // Act
      const isOldFormat = detectOldFormat(emptyConfig);

      // Assert
      expect(isOldFormat).toBe(false); // No serverUrl = not old format
    });
  });
});
