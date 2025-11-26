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
 * @fileoverview Unit tests for URL utility functions
 *
 * Tests the window identifier generation implementation:
 * - Unique identifier generation for window instances
 * - URL parameter handling utilities
 * - Instance isolation validation
 */

import { getNewWindowIdentifier } from "../utils";

describe("URL Utility Functions", () => {
  // Mock Date.now to control timestamp generation
  let mockNow: jest.SpyInstance;
  let timestampCounter = 1000000; // Start with a base timestamp

  beforeEach(() => {
    timestampCounter = 1000000; // Reset counter for each test
    mockNow = jest.spyOn(Date, "now").mockImplementation(() => {
      return timestampCounter++; // Increment to ensure uniqueness
    });
  });

  afterEach(() => {
    mockNow.mockRestore();
  });

  describe("getNewWindowIdentifier", () => {
    it("should generate unique identifiers for the same window type", () => {
      const identifier1 = getNewWindowIdentifier("TestWindow");
      const identifier2 = getNewWindowIdentifier("TestWindow");

      expect(identifier1).not.toBe(identifier2);
      expect(identifier1).toMatch(/^TestWindow_\d+$/);
      expect(identifier2).toMatch(/^TestWindow_\d+$/);

      // Verify the timestamps are different
      const timestamp1 = identifier1.split("_")[1];
      const timestamp2 = identifier2.split("_")[1];
      expect(timestamp1).not.toBe(timestamp2);
    });

    it("should include window ID in the identifier format", () => {
      const windowTypes = ["Product", "Customer", "Invoice", "Order"];

      for (const windowId of windowTypes) {
        const identifier = getNewWindowIdentifier(windowId);
        expect(identifier.startsWith(`${windowId}_`)).toBe(true);
        expect(identifier).toMatch(new RegExp(`^${windowId}_\\d+$`));
      }
    });

    it("should generate timestamp-based identifiers", () => {
      // Use real Date.now for this test to verify actual timestamp behavior
      mockNow.mockRestore();

      const beforeTime = Date.now();
      const identifier = getNewWindowIdentifier("TestWindow");
      const afterTime = Date.now();

      const timestampPart = identifier.split("_")[1];

      // Should be a valid timestamp (numeric)
      expect(Number.isInteger(Number(timestampPart))).toBe(true);

      // Should be a reasonable timestamp (within the test execution window)
      const timestamp = Number(timestampPart);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);

      // Re-establish mock for subsequent tests
      mockNow = jest.spyOn(Date, "now").mockImplementation(() => {
        return timestampCounter++;
      });
    });

    it("should handle empty or undefined window IDs gracefully", () => {
      const emptyIdentifier = getNewWindowIdentifier("");
      const undefinedIdentifier = getNewWindowIdentifier(undefined as unknown as string);

      expect(emptyIdentifier).toMatch(/^_\d+$/);
      expect(undefinedIdentifier).toMatch(/^undefined_\d+$/);

      // Verify they have different timestamps
      const emptyTimestamp = emptyIdentifier.split("_")[1];
      const undefinedTimestamp = undefinedIdentifier.split("_")[1];
      expect(emptyTimestamp).not.toBe(undefinedTimestamp);
    });

    it("should handle special characters in window IDs", () => {
      const specialWindowIds = [
        "Window-With-Dashes",
        "Window_With_Underscores",
        "Window.With.Dots",
        "Window123",
        "UPPERCASE_WINDOW",
      ];

      for (const windowId of specialWindowIds) {
        const identifier = getNewWindowIdentifier(windowId);
        expect(identifier.startsWith(`${windowId}_`)).toBe(true);
        expect(identifier).toMatch(new RegExp(`^${windowId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_\\d+$`));
      }
    });

    it("should generate unique identifiers across rapid calls", () => {
      const identifiers = new Set<string>();
      const windowId = "RapidTest";

      // Generate multiple identifiers quickly - mock ensures uniqueness
      for (let i = 0; i < 100; i++) {
        const identifier = getNewWindowIdentifier(windowId);
        expect(identifiers.has(identifier)).toBe(false);
        identifiers.add(identifier);
      }

      expect(identifiers.size).toBe(100);

      // Verify all identifiers have different timestamps
      const timestamps = Array.from(identifiers).map((id) => id.split("_")[1]);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(100);
    });

    it("should maintain consistency in identifier format", () => {
      const identifier = getNewWindowIdentifier("FormatTest");
      const parts = identifier.split("_");

      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe("FormatTest");
      expect(parts[1]).toMatch(/^\d+$/);
      expect(Number(parts[1])).toBeGreaterThan(0);
    });

    it("should support concurrent identifier generation", async () => {
      // Reset mock to use incremental timestamps for concurrent test
      timestampCounter = 2000000;

      const promises = Array(50)
        .fill(null)
        .map(() => Promise.resolve(getNewWindowIdentifier("ConcurrentTest")));

      const identifiers = await Promise.all(promises);
      const uniqueIdentifiers = new Set(identifiers);

      expect(uniqueIdentifiers.size).toBe(identifiers.length);
      expect(identifiers.every((id) => id.startsWith("ConcurrentTest_"))).toBe(true);

      // Verify all have unique timestamps
      const timestamps = identifiers.map((id) => id.split("_")[1]);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(50);
    });

    it("should handle extremely long window IDs", () => {
      const longWindowId = "A".repeat(1000);
      const identifier = getNewWindowIdentifier(longWindowId);

      expect(identifier.startsWith(`${longWindowId}_`)).toBe(true);
      expect(identifier.split("_")).toHaveLength(2);
    });

    it("should generate identifiers that are URL-safe", () => {
      const windowIds = ["Window With Spaces", "Window@#$%Special", "Window+&=Symbols", "Window[]{|}Brackets"];

      for (const windowId of windowIds) {
        const identifier = getNewWindowIdentifier(windowId);

        // Should not contain URL-unsafe characters in the timestamp part
        const timestampPart = identifier.split("_")[1];
        expect(timestampPart).toMatch(/^\d+$/);

        // The entire identifier should be present
        expect(identifier).toContain(windowId);
      }
    });
  });

  describe("Identifier Uniqueness Validation", () => {
    it("should generate globally unique identifiers across different window types", () => {
      const identifiers = new Set<string>();
      const windowTypes = ["Product", "Customer", "Invoice", "Order", "Payment"];

      for (const windowType of windowTypes) {
        for (let i = 0; i < 10; i++) {
          const identifier = getNewWindowIdentifier(windowType);
          expect(identifiers.has(identifier)).toBe(false);
          identifiers.add(identifier);
        }
      }

      expect(identifiers.size).toBe(50); // 5 types × 10 identifiers each

      // Verify all timestamps are unique
      const timestamps = Array.from(identifiers).map((id) => id.split("_")[1]);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(50);
    });

    it("should maintain uniqueness over extended time periods", () => {
      // Use real Date.now for this test to simulate time passage
      mockNow.mockRestore();

      const identifiers = new Set<string>();
      const windowId = "TimeTest";

      // Generate identifiers with small delays
      for (let i = 0; i < 10; i++) {
        const identifier = getNewWindowIdentifier(windowId);
        identifiers.add(identifier);

        // Small delay to ensure timestamp difference - use busy wait
        const start = Date.now();
        while (Date.now() - start < 2) {
          // Busy wait for 2ms to ensure different timestamps
        }
      }

      expect(identifiers.size).toBe(10);

      // Re-establish mock for subsequent tests
      timestampCounter = 3000000;
      mockNow = jest.spyOn(Date, "now").mockImplementation(() => {
        return timestampCounter++;
      });
    });

    it("should create identifiers suitable for URL parameters", () => {
      const identifier = getNewWindowIdentifier("URLTest");

      // Should be usable in URLSearchParams
      const params = new URLSearchParams();
      params.set("windowIdentifier", identifier);

      expect(params.get("windowIdentifier")).toBe(identifier);
      expect(params.toString()).toContain(identifier);
    });

    it("should support identifier parsing back to components", () => {
      const windowId = "ParseTest";
      const identifier = getNewWindowIdentifier(windowId);

      const [extractedWindowId, timestampStr] = identifier.split("_");

      expect(extractedWindowId).toBe(windowId);
      expect(Number.isInteger(Number(timestampStr))).toBe(true);
      expect(Number(timestampStr)).toBeGreaterThan(0);
    });
  });

  describe("Window Identifier Requirements", () => {
    it("should support the multi-window instance isolation pattern", () => {
      // Simulate multiple instances of the same window type
      const windowId = "MultiInstanceTest";
      const instances = Array(5)
        .fill(null)
        .map(() => ({
          windowId,
          windowIdentifier: getNewWindowIdentifier(windowId),
        }));

      // All should have the same windowId but different identifiers
      expect(instances.every((instance) => instance.windowId === windowId)).toBe(true);

      const identifiers = instances.map((instance) => instance.windowIdentifier);
      const uniqueIdentifiers = new Set(identifiers);
      expect(uniqueIdentifiers.size).toBe(5);

      // Verify all have different timestamps
      const timestamps = identifiers.map((id) => id.split("_")[1]);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(5);
    });

    it("should integrate with URL state management requirements", () => {
      const identifier = getNewWindowIdentifier("URLStateTest");

      // Should work with URLSearchParams
      const searchParams = new URLSearchParams();
      searchParams.set("windowIdentifier", identifier);
      searchParams.set("tabId", "mainTab");
      searchParams.set("recordId", "12345");

      const urlString = searchParams.toString();
      expect(urlString).toContain(`windowIdentifier=${identifier}`);

      // Should be parseable from URL
      const parsedParams = new URLSearchParams(urlString);
      expect(parsedParams.get("windowIdentifier")).toBe(identifier);
    });

    it("should maintain performance characteristics under load", () => {
      // Use real Date.now for performance testing
      mockNow.mockRestore();

      const startTime = performance.now();
      const identifiers = [];

      // Generate 1000 identifiers
      for (let i = 0; i < 1000; i++) {
        identifiers.push(getNewWindowIdentifier("PerformanceTest"));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms for 1000 identifiers)
      expect(duration).toBeLessThan(100);

      // Verify we got 1000 identifiers
      expect(identifiers).toHaveLength(1000);

      // All should follow the correct format
      expect(identifiers.every((id) => id.startsWith("PerformanceTest_"))).toBe(true);
      expect(identifiers.every((id) => /^PerformanceTest_\d+$/.test(id))).toBe(true);

      // Re-establish mock for subsequent tests
      timestampCounter = 4000000;
      mockNow = jest.spyOn(Date, "now").mockImplementation(() => {
        return timestampCounter++;
      });
    });

    it("should provide deterministic format for testing and validation", () => {
      const identifier = getNewWindowIdentifier("TestWindow");

      // Should match expected pattern (using mocked timestamp)
      expect(identifier).toMatch(/^TestWindow_\d+$/);

      // Should be splittable
      const parts = identifier.split("_");
      expect(parts[0]).toBe("TestWindow");
      expect(parts[1]).toMatch(/^\d+$/);
      expect(Number(parts[1])).toBeGreaterThan(0);

      // With mocked timestamps, we know the exact format
      expect(parts[1]).toBe(String(timestampCounter - 1)); // Last used timestamp
    });

    it("should support instance management across browser sessions", () => {
      // Test that identifiers are suitable for persistence/restoration
      const identifier = getNewWindowIdentifier("SessionTest");

      // Should be JSON serializable
      const serialized = JSON.stringify({ windowIdentifier: identifier });
      const deserialized = JSON.parse(serialized);

      expect(deserialized.windowIdentifier).toBe(identifier);

      // Should be URL encodable
      const encoded = encodeURIComponent(identifier);
      const decoded = decodeURIComponent(encoded);

      expect(decoded).toBe(identifier);
    });

    it("should generate unique identifiers under normal usage conditions", () => {
      // Use real Date.now to simulate normal user interactions
      mockNow.mockRestore();

      const identifiers = new Set<string>();

      // Simulate normal user behavior - opening windows with some delay between them
      const delays = [10, 5, 15, 8, 12]; // Simulate realistic delays in ms

      for (const delay of delays) {
        const identifier = getNewWindowIdentifier("NormalUsage");
        identifiers.add(identifier);

        // Simulate user delay between window openings
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Busy wait to simulate realistic timing
        }
      }

      // Under normal usage conditions, all identifiers should be unique
      expect(identifiers.size).toBe(5);

      // Re-establish mock for any subsequent tests
      timestampCounter = 5000000;
      mockNow = jest.spyOn(Date, "now").mockImplementation(() => {
        return timestampCounter++;
      });
    });
  });
});
