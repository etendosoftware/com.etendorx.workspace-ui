/**
 * Safely concatenates a base URL with a path, avoiding double slashes
 */
export function joinUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) return path;
  
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
}