// Simple, centralized toggle for datasource caching.
// For now, caching is disabled for all entities as requested.
// Later this can read a dictionary or configuration per entity.

export function shouldCacheDatasource(entity: string, _params?: any): boolean {
  // TODO: make configurable per-entity via dictionary/config
  return false;
}

