/**
 * Centralized endpoint configuration for Etendo Classic backend routes.
 * This module handles the routing logic for different types of requests
 * to ensure consistency across the application.
 */

import { joinUrl } from "./url";

export interface EndpointConfig {
  baseUrl: string;
  useSws: boolean;
  useForward: boolean;
  service?: string;
}

/**
 * Determines the appropriate endpoint configuration for datasource requests
 * @param entity - The datasource entity name
 * @param operationType - The type of operation (add, update, remove, fetch, etc.)
 * @returns EndpointConfig with the appropriate routing settings
 */
export function getDatasourceEndpoint(entity: string, operationType?: string): EndpointConfig {
  const isOperation = operationType && ["add", "update", "remove"].includes(operationType);

  if (isOperation) {
    // Operations go directly to the datasource servlet (like Classic)
    return {
      baseUrl: process.env.ETENDO_CLASSIC_URL || "",
      useSws: false,
      useForward: false,
      service: `org.openbravo.service.datasource/${entity}`,
    };
  }
  // Queries use the SWS forward mechanism
  return {
    baseUrl: process.env.ETENDO_CLASSIC_URL || "",
    useSws: true,
    useForward: true,
    service: `org.openbravo.service.datasource/${entity}`,
  };
}

/**
 * Determines the appropriate endpoint configuration for ERP kernel requests
 * @param isKernel - Whether this is a kernel request
 * @returns EndpointConfig with the appropriate routing settings
 */
export function getKernelEndpoint(_isKernel = true): EndpointConfig {
  return {
    baseUrl: process.env.ETENDO_CLASSIC_URL || "",
    useSws: true,
    useForward: false,
    service: "com.smf.securewebservices.kernel/org.openbravo.client.kernel",
  };
}

/**
 * Determines the appropriate endpoint configuration for metadata requests
 * @param path - The metadata path
 * @returns EndpointConfig with the appropriate routing settings
 */
export function getMetadataEndpoint(path: string): EndpointConfig {
  return {
    baseUrl: process.env.ETENDO_CLASSIC_URL || "",
    useSws: true,
    useForward: false,
    service: `com.etendoerp.metadata.${path}`,
  };
}

/**
 * Builds the complete URL based on endpoint configuration
 * @param config - The endpoint configuration
 * @returns Complete URL string
 */
export function buildEndpointUrl(config: EndpointConfig): string {
  if (!config.service) {
    throw new Error("Service must be specified in endpoint configuration");
  }

  let path = "";

  if (config.useSws) {
    if (config.useForward) {
      path = `sws/com.etendoerp.metadata.forward/${config.service}`;
    } else {
      path = `sws/${config.service}`;
    }
  } else {
    path = config.service;
  }

  return joinUrl(config.baseUrl, path);
}

/**
 * Convenience function to get a complete datasource URL
 * @param entity - The datasource entity name
 * @param operationType - The type of operation
 * @returns Complete datasource URL
 */
export function getDatasourceUrl(entity: string, operationType?: string): string {
  const config = getDatasourceEndpoint(entity, operationType);
  return buildEndpointUrl(config);
}

/**
 * Convenience function to get a complete kernel URL
 * @returns Complete kernel URL
 */
export function getKernelUrl(): string {
  const config = getKernelEndpoint();
  return buildEndpointUrl(config);
}

/**
 * Convenience function to get a complete metadata URL
 * @param path - The metadata path
 * @returns Complete metadata URL
 */
export function getMetadataUrl(path: string): string {
  const config = getMetadataEndpoint(path);
  return buildEndpointUrl(config);
}
