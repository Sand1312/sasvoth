import { describe, it, expect } from "vitest";
import { api, directApi } from "../api/base";

/**
 * Tests for API configuration
 *
 * Tests the public behavior of api and directApi instances
 * without needing to export internal implementation details.
 */
describe("API Configuration", () => {
  describe("api (proxied)", () => {
    it("should have baseURL pointing to proxy", () => {
      expect(api.defaults.baseURL).toBe("/api/v1");
    });

    it("should have shorter timeout for normal requests", () => {
      expect(api.defaults.timeout).toBe(30_000); // 30 seconds
    });

    it("should have credentials enabled", () => {
      expect(api.defaults.withCredentials).toBe(true);
    });
  });

  describe("directApi (bypass proxy)", () => {
    it("should have baseURL pointing to backend directly", () => {
      expect(directApi.defaults.baseURL).toContain("localhost:8000");
    });

    it("should have longer timeout for slow operations", () => {
      expect(directApi.defaults.timeout).toBe(5 * 60 * 1000); // 5 minutes
    });

    it("should have credentials enabled", () => {
      expect(directApi.defaults.withCredentials).toBe(true);
    });
  });
});
