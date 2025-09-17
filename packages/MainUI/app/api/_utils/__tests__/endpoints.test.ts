/**
 * Tests for centralized endpoint configuration
 */

import {
  getDatasourceEndpoint,
  getKernelEndpoint,
  getMetadataEndpoint,
  buildEndpointUrl,
  getDatasourceUrl,
  getKernelUrl,
  getMetadataUrl,
} from "../endpoints";

// Mock environment variable
const mockBaseUrl = "http://localhost:8080/etendo";
const originalEnv = process.env.ETENDO_CLASSIC_URL;

beforeAll(() => {
  process.env.ETENDO_CLASSIC_URL = mockBaseUrl;
});

afterAll(() => {
  process.env.ETENDO_CLASSIC_URL = originalEnv;
});

// Helper function to test datasource endpoints
const testDatasourceEndpoint = (operation: string | undefined, expectedConfig: any) => {
  const config = getDatasourceEndpoint("Order", operation);
  expect(config).toEqual(expectedConfig);
};

// Helper function to create expected datasource config
const createExpectedConfig = (useSws: boolean, useForward: boolean) => ({
  baseUrl: mockBaseUrl,
  useSws,
  useForward,
  service: "org.openbravo.service.datasource/Order",
});

describe("Endpoint Configuration", () => {
  describe("getDatasourceEndpoint", () => {
    const directUrlConfig = createExpectedConfig(false, false);
    const swsForwardConfig = createExpectedConfig(true, true);

    it.each([
      ["add", directUrlConfig],
      ["update", directUrlConfig],
      ["remove", directUrlConfig],
    ])("should return direct URL for %s operation", (operation, expectedConfig) => {
      testDatasourceEndpoint(operation, expectedConfig);
    });

    it("should return SWS forward URL for fetch operation", () => {
      testDatasourceEndpoint("fetch", swsForwardConfig);
    });

    it("should return SWS forward URL when no operation type specified", () => {
      testDatasourceEndpoint(undefined, swsForwardConfig);
    });
  });

  describe("getKernelEndpoint", () => {
    it("should return SWS kernel URL", () => {
      const config = getKernelEndpoint();
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: false,
        service: "com.smf.securewebservices.kernel/org.openbravo.client.kernel",
      });
    });
  });

  describe("getMetadataEndpoint", () => {
    it("should return SWS metadata URL", () => {
      const config = getMetadataEndpoint("meta/menu");
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: false,
        service: "com.etendoerp.metadata.meta/menu",
      });
    });
  });

  describe("buildEndpointUrl", () => {
    const testCases = [
      {
        description: "direct URL without SWS",
        config: { useSws: false, useForward: false, service: "org.openbravo.service.datasource/Order" },
        expected: "http://localhost:8080/etendo/org.openbravo.service.datasource/Order",
      },
      {
        description: "SWS URL without forward",
        config: { useSws: true, useForward: false, service: "com.etendoerp.metadata.meta/menu" },
        expected: "http://localhost:8080/etendo/sws/com.etendoerp.metadata.meta/menu",
      },
      {
        description: "SWS URL with forward",
        config: { useSws: true, useForward: true, service: "org.openbravo.service.datasource/Order" },
        expected:
          "http://localhost:8080/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.service.datasource/Order",
      },
    ];

    testCases.forEach(({ description, config, expected }) => {
      it(`should build ${description}`, () => {
        const fullConfig = { baseUrl: mockBaseUrl, ...config };
        const url = buildEndpointUrl(fullConfig);
        expect(url).toBe(expected);
      });
    });

    it("should throw error when service is not specified", () => {
      const config = {
        baseUrl: mockBaseUrl,
        useSws: false,
        useForward: false,
      };
      expect(() => buildEndpointUrl(config)).toThrow("Service must be specified in endpoint configuration");
    });
  });

  describe("Convenience functions", () => {
    it("should build datasource URL for operations", () => {
      const url = getDatasourceUrl("Order", "add");
      expect(url).toBe("http://localhost:8080/etendo/org.openbravo.service.datasource/Order");
    });

    it("should build datasource URL for queries", () => {
      const url = getDatasourceUrl("Order");
      expect(url).toBe(
        "http://localhost:8080/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.service.datasource/Order"
      );
    });

    it("should build kernel URL", () => {
      const url = getKernelUrl();
      expect(url).toBe("http://localhost:8080/etendo/sws/com.smf.securewebservices.kernel/org.openbravo.client.kernel");
    });

    it("should build metadata URL", () => {
      const url = getMetadataUrl("meta/menu");
      expect(url).toBe("http://localhost:8080/etendo/sws/com.etendoerp.metadata.meta/menu");
    });
  });
});
