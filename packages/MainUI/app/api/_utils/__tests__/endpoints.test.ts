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
} from '../endpoints';

// Mock environment variable
const mockBaseUrl = 'http://localhost:8080/etendo';
const originalEnv = process.env.ETENDO_CLASSIC_URL;

beforeAll(() => {
  process.env.ETENDO_CLASSIC_URL = mockBaseUrl;
});

afterAll(() => {
  process.env.ETENDO_CLASSIC_URL = originalEnv;
});

describe('Endpoint Configuration', () => {
  describe('getDatasourceEndpoint', () => {
    it('should return direct URL for add operation', () => {
      const config = getDatasourceEndpoint('Order', 'add');
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: false,
        useForward: false,
        service: 'org.openbravo.service.datasource/Order'
      });
    });

    it('should return direct URL for update operation', () => {
      const config = getDatasourceEndpoint('Order', 'update');
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: false,
        useForward: false,
        service: 'org.openbravo.service.datasource/Order'
      });
    });

    it('should return direct URL for remove operation', () => {
      const config = getDatasourceEndpoint('Order', 'remove');
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: false,
        useForward: false,
        service: 'org.openbravo.service.datasource/Order'
      });
    });

    it('should return SWS forward URL for fetch operation', () => {
      const config = getDatasourceEndpoint('Order', 'fetch');
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: true,
        service: 'org.openbravo.service.datasource/Order'
      });
    });

    it('should return SWS forward URL when no operation type specified', () => {
      const config = getDatasourceEndpoint('Order');
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: true,
        service: 'org.openbravo.service.datasource/Order'
      });
    });
  });

  describe('getKernelEndpoint', () => {
    it('should return SWS kernel URL', () => {
      const config = getKernelEndpoint();
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: false,
        service: 'com.smf.securewebservices.kernel/org.openbravo.client.kernel'
      });
    });
  });

  describe('getMetadataEndpoint', () => {
    it('should return SWS metadata URL', () => {
      const config = getMetadataEndpoint('meta/menu');
      expect(config).toEqual({
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: false,
        service: 'com.etendoerp.metadata.meta/menu'
      });
    });
  });

  describe('buildEndpointUrl', () => {
    it('should build direct URL without SWS', () => {
      const config = {
        baseUrl: mockBaseUrl,
        useSws: false,
        useForward: false,
        service: 'org.openbravo.service.datasource/Order'
      };
      const url = buildEndpointUrl(config);
      expect(url).toBe('http://localhost:8080/etendo/org.openbravo.service.datasource/Order');
    });

    it('should build SWS URL without forward', () => {
      const config = {
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: false,
        service: 'com.etendoerp.metadata.meta/menu'
      };
      const url = buildEndpointUrl(config);
      expect(url).toBe('http://localhost:8080/etendo/sws/com.etendoerp.metadata.meta/menu');
    });

    it('should build SWS URL with forward', () => {
      const config = {
        baseUrl: mockBaseUrl,
        useSws: true,
        useForward: true,
        service: 'org.openbravo.service.datasource/Order'
      };
      const url = buildEndpointUrl(config);
      expect(url).toBe('http://localhost:8080/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.service.datasource/Order');
    });

    it('should throw error when service is not specified', () => {
      const config = {
        baseUrl: mockBaseUrl,
        useSws: false,
        useForward: false
      };
      expect(() => buildEndpointUrl(config)).toThrow('Service must be specified in endpoint configuration');
    });
  });

  describe('Convenience functions', () => {
    it('should build datasource URL for operations', () => {
      const url = getDatasourceUrl('Order', 'add');
      expect(url).toBe('http://localhost:8080/etendo/org.openbravo.service.datasource/Order');
    });

    it('should build datasource URL for queries', () => {
      const url = getDatasourceUrl('Order');
      expect(url).toBe('http://localhost:8080/etendo/sws/com.etendoerp.metadata.forward/org.openbravo.service.datasource/Order');
    });

    it('should build kernel URL', () => {
      const url = getKernelUrl();
      expect(url).toBe('http://localhost:8080/etendo/sws/com.smf.securewebservices.kernel/org.openbravo.client.kernel');
    });

    it('should build metadata URL', () => {
      const url = getMetadataUrl('meta/menu');
      expect(url).toBe('http://localhost:8080/etendo/sws/com.etendoerp.metadata.meta/menu');
    });
  });
});