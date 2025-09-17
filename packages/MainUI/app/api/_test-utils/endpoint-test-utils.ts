/**
 * Test utilities for endpoint URL generation to keep tests consistent with actual implementation
 */

import { getDatasourceUrl } from "../_utils/endpoints";

/**
 * Generates the expected datasource URL for tests based on the centralized endpoint configuration
 * @param entity - The datasource entity name
 * @param operationType - The operation type (add, update, remove, etc.)
 * @param queryParams - Additional query parameters as URLSearchParams or object
 * @returns Complete expected URL for tests
 */
export function getExpectedDatasourceUrl(
  entity: string,
  operationType?: string,
  queryParams?: URLSearchParams | Record<string, string | number>
): string {
  // Use the same logic as the actual implementation
  const baseUrl = getDatasourceUrl(entity, operationType);

  if (!queryParams) {
    return baseUrl;
  }

  // Convert queryParams to URLSearchParams if it's an object
  let params: URLSearchParams;
  if (queryParams instanceof URLSearchParams) {
    params = new URLSearchParams(queryParams);
  } else {
    params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      params.set(key, String(value));
    }
  }

  // Add pagination parameters for operations if not present
  if (operationType && ["add", "update", "remove"].includes(operationType)) {
    if (!params.has("_startRow") && !params.has("_endRow")) {
      params.set("_startRow", "0");
      params.set("_endRow", "75");
    }
  }

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

/**
 * Updates old-style URLs to new endpoint format
 * This is a migration helper to update test expectations
 * @param oldUrl - The old-style URL with /meta/forward/
 * @returns Updated URL with correct SWS pattern
 */
export function migrateOldUrlToNew(oldUrl: string): string {
  // Extract entity and query params from old URL
  const url = new URL(oldUrl);
  const pathMatch = url.pathname.match(/\/meta\/forward\/org\.openbravo\.service\.datasource\/(.+)$/);

  if (!pathMatch) {
    throw new Error(`Cannot migrate URL: ${oldUrl}`);
  }

  const entity = pathMatch[1];
  const params = new URLSearchParams(url.search);
  const operationType = params.get("_operationType");

  return getExpectedDatasourceUrl(entity, operationType || undefined, params);
}

/**
 * Helper to assert fetch calls with correct endpoint URLs
 * @param expectedBaseUrl - Base URL without query parameters
 * @param entity - Entity name
 * @param operationType - Operation type
 * @param queryParams - Query parameters
 * @returns Object with assertion helpers
 */
export function createDatasourceUrlAssertion(
  entity: string,
  operationType?: string,
  queryParams?: Record<string, string | number>
) {
  const expectedUrl = getExpectedDatasourceUrl(entity, operationType, queryParams);

  return {
    expectedUrl,
    assertFetchUrl: () => {
      const [dest] = (global as any).fetch.mock.calls[0];
      expect(String(dest)).toBe(expectedUrl);
    },
  };
}
