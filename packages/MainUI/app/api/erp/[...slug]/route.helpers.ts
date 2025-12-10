/**
 * Helper functions for ERP route handler
 * Separated for testing purposes to avoid Next.js API dependencies
 */

/**
 * Detect charset from Content-Type header
 * @param contentType - The Content-Type header value
 * @returns The detected charset (defaults to iso-8859-1 for Tomcat legacy servlets)
 */
export function detectCharset(contentType: string | null): string {
  if (!contentType) {
    return "iso-8859-1"; // Default for Tomcat legacy servlets
  }
  const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
  return charsetMatch ? charsetMatch[1].toLowerCase() : "iso-8859-1";
}

/**
 * Check if response content type is binary
 * @param contentType - The Content-Type header value
 * @returns true if the content type indicates a binary file
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
 * Rewrite HTML resource URLs to point to Tomcat
 * Adds a <base> tag and rewrites relative/absolute paths to use the Etendo Classic host
 * @param html - The HTML content to rewrite
 * @param baseUrl - Optional base URL (defaults to ETENDO_CLASSIC_HOST or ETENDO_CLASSIC_URL)
 * @returns The HTML with rewritten URLs
 */
export function rewriteHtmlResourceUrls(html: string, baseUrl?: string): string {
  let rewritten = html;
  // Use ETENDO_CLASSIC_HOST for browser-accessible URLs (public host)
  // Falls back to ETENDO_CLASSIC_URL for backwards compatibility
  const targetUrl = baseUrl || process.env.ETENDO_CLASSIC_HOST || process.env.ETENDO_CLASSIC_URL || "";

  // Add <base> tag after <head> to set the base URL for all relative URLs
  // This ensures resources like CSS, JS, images load from Tomcat, not Next.js
  if (targetUrl && !rewritten.includes("<base")) {
    rewritten = rewritten.replace(/(<head[^>]*>)/i, `$1\n  <base href="${targetUrl}/" />`);
  }

  // Rewrite relative paths that reference Etendo resources (e.g., ../web/, ../../web/)
  rewritten = rewritten.replace(/(href|src)="(\.\.\/)*web\//gi, `$1="${targetUrl}/web/`);
  rewritten = rewritten.replace(/(href|src)="(\.\.\/)*org\.openbravo\./gi, `$1="${targetUrl}/org.openbravo.`);
  rewritten = rewritten.replace(/(href|src)="(\.\.\/)*ad_forms\//gi, `$1="${targetUrl}/ad_forms/`);

  // Rewrite absolute paths (e.g., /web/, /org.openbravo., /ad_forms/)
  // These need to go through the backend, not Next.js
  rewritten = rewritten.replace(/(href|src)="\/web\//gi, `$1="${targetUrl}/web/`);
  rewritten = rewritten.replace(/(href|src)="\/org\.openbravo\./gi, `$1="${targetUrl}/org.openbravo.`);
  rewritten = rewritten.replace(/(href|src)="\/ad_forms\//gi, `$1="${targetUrl}/ad_forms/`);

  return rewritten;
}

/**
 * Create HTML response with proper headers
 * @param html - The HTML content
 * @param originalResponse - The original response to copy headers from
 * @returns A new Response with the HTML content and proper headers
 */
export function createHtmlResponse(html: string, originalResponse: Response): Response {
  const htmlHeaders = new Headers(originalResponse.headers);
  if (!htmlHeaders.has("content-type")) {
    htmlHeaders.set("Content-Type", "text/html");
  }
  return new Response(html, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers: htmlHeaders,
  });
}
