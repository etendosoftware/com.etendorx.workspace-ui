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

/**
 * Create HTML response with proper headers
 * @param html - HTML content string
 * @param originalResponse - Original response to copy headers/status from
 * @returns New Response object with HTML content
 */
export function createHtmlResponse(html: string, originalResponse: Response): Response {
  const htmlHeaders = new Headers(originalResponse.headers);
  const contentType = htmlHeaders.get("content-type") || "text/html";

  // Ensure Content-Type header exists and has charset
  if (!htmlHeaders.has("content-type")) {
    htmlHeaders.set("Content-Type", "text/html; charset=UTF-8");
  } else if (!contentType.includes("charset")) {
    htmlHeaders.set("Content-Type", `${contentType}; charset=UTF-8`);
  }

  return new Response(html, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers: htmlHeaders,
  });
}

/**
 * Rewrite HTML resource URLs to point to Tomcat
 * Adds a <base> tag and rewrites relative/absolute paths to use the Etendo Classic host
 * @param html - The HTML content to rewrite
 * @param baseUrl - Optional base URL (defaults to ETENDO_CLASSIC_HOST or ETENDO_CLASSIC_URL)
 * @returns The HTML with rewritten URLs
 */
export function rewriteHtmlResourceUrls(html: string, baseUrl?: string): string {
  let rewritten = html;
  // Use ETENDO_CLASSIC_HOST (e.g. http://localhost:8080/etendo)
  // Ensure no trailing slash for consistent concatenation
  let targetUrl =
    baseUrl || process.env.ETENDO_CLASSIC_HOST || process.env.ETENDO_CLASSIC_URL || "http://localhost:8080";
  if (targetUrl.endsWith("/")) targetUrl = targetUrl.slice(0, -1);

  // 1. Inject <base> tag.
  if (targetUrl && !rewritten.includes("<base")) {
    rewritten = rewritten.replace(/(<head[^>]*>)/i, `$1\n  <base href="${targetUrl}/" />`);
  }

  // 2. FIX RELATIVE TRAVERSAL AND ABSOLUTE PATHS
  // Matches:
  //  - Absolute: /web/...
  //  - Relative traversal: ../web/... or ../../web/...
  //  - Current relative: ./web/...
  // We want to normalize ALL of these to just "web/..." so they resolve relative to <base> (which includes /etendo/)

  const resourcePaths = ["web/", "org.openbravo.", "ad_forms/"];

  resourcePaths.forEach((path) => {
    const escapedPath = path.replace(/\./g, "\\.");
    // Regex matches: src=" (optional / or ../ or ./) path..."
    // Matches patterns like: /web/, ../web/, ./web/, ../../web/
    const regex = new RegExp(`(href|src)\\s*=\\s*([\"'])(\\.|\\/)*${escapedPath}`, "gi");
    rewritten = rewritten.replace(regex, `$1=$2${path}`);
  });

  // Special handling for /etendo/ path to ensure it uses origin
  try {
    const origin = new URL(targetUrl).origin;
    rewritten = rewritten.replace(/(href|src)\s*=\s*([\"'])\/etendo\//gi, `$1=$2${origin}/etendo/`);
  } catch (e) {}

  return rewritten;
}
