/**
 * Helper functions for ERP route handler
 * Extracted to separate file for testability
 */

/**
 * Detect charset from Content-Type header
 * @param contentType - Content-Type header value
 * @returns charset (default: iso-8859-1 for Tomcat legacy servlets)
 */
export function detectCharset(contentType: string | null): string {
  if (!contentType) {
    return "iso-8859-1"; // Default for Tomcat legacy servlets
  }
  const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
  return charsetMatch ? charsetMatch[1].toLowerCase() : "iso-8859-1";
}

/**
 * Check if response is binary file
 * @param contentType - Content-Type header value
 * @returns true if binary content type
 */
export function isBinaryContentType(contentType: string): boolean {
  return (
    contentType.includes("application/octet-stream") ||
    contentType.includes("application/zip") ||
    contentType.includes("image/") ||
    contentType.includes("video/") ||
    contentType.includes("audio/") ||
    contentType.includes("application/pdf")
  );
}
