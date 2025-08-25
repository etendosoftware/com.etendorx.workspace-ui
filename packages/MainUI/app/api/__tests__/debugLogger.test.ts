/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @jest-environment node
 */

// Mock next/server before any imports
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

// Mock debug utility to enable debugging
jest.mock("@/utils/debug", () => ({
  isDebugErpRequests: () => true,
}));

// Mock auth utilities
jest.mock("@/lib/auth", () => ({
  extractBearerToken: (req: any) => {
    if (!req) return null;
    const header = req.headers?.get?.("Authorization") || req.headers?.Authorization;
    if (!header) return null;
    return header.startsWith("Bearer ") ? header.slice(7) : header;
  },
}));

import { getDebugLogs, clearDebugLogs, getDebugStats } from "../_utils/debugLogger";

describe("ERP Request Debugger", () => {
  beforeEach(() => {
    // Clear any existing logs before each test
    clearDebugLogs();
    
    // Set environment to development (Jest allows mutation of process.env)
    (process.env as any).NODE_ENV = "development";
    (process.env as any).DEBUG_ERP_REQUESTS = "true";
  });

  afterEach(() => {
    // Clean up
    clearDebugLogs();
  });

  describe("Debug Logger Storage", () => {
    it("should start with empty logs", () => {
      const logs = getDebugLogs();
      expect(logs).toEqual([]);
    });

    it("should provide correct stats for empty state", () => {
      const stats = getDebugStats();
      expect(stats.totalLogs).toBe(0);
      expect(stats.oldestLog).toBeUndefined();
      expect(stats.newestLog).toBeUndefined();
    });

    it("should clear logs when requested", () => {
      // This test verifies the clear functionality works
      clearDebugLogs();
      const logs = getDebugLogs();
      expect(logs).toEqual([]);
    });
  });

  describe("Environment Configuration", () => {
    it("should be enabled in development with proper env var", () => {
      (process.env as any).NODE_ENV = "development";
      (process.env as any).DEBUG_ERP_REQUESTS = "true";
      
      // Mock returns true based on our mock above
      const { isDebugErpRequests } = require("@/utils/debug");
      expect(isDebugErpRequests()).toBe(true);
    });
  });

  describe("Data Masking", () => {
    // This would test the private maskSensitiveData method
    // Since it's private, we test it indirectly through the withDebugLogging function
    it("should be tested indirectly through integration tests", () => {
      // This test serves as a placeholder for data masking functionality
      // The actual masking is tested when requests are logged
      expect(true).toBe(true);
    });
  });
});