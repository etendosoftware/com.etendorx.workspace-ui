// Simple, centralized toggle for datasource caching.
// For now, caching is disabled for all entities as requested.
// Later this can read a dictionary or configuration per entity.

/**
 * Determines if the datasource for a specific entity should be cached.
 * @param entity The name of the entity to check.
 * @param _params Optional parameters for the cache decision.
 * @returns True if the datasource should be cached, false otherwise.
 */
export function shouldCacheDatasource(entity: string, _params?: any): boolean {
  return false;
}
