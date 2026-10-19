/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/** Below this size gzip saves nothing worth its CPU. */
const MIN_COMPRESSIBLE_BYTES = 1024;

const COMPRESSIBLE_TYPE = /json|text\/|javascript|xml/i;

/**
 * gzips a route handler response when the client accepts it. Next.js `compress` covers pages and RSC payloads
 * but not App Router route handlers, so the API JSON (1–3 MB of window metadata, ~0.5 MB grid pages) went
 * uncompressed through any server that does not compress it itself.
 *
 * Left as is: non-text bodies, Server-Sent Events (compressing buffers the stream), responses that are already
 * encoded or have no body (304), small bodies, and anything that is not a standard Response.
 */
export function withCompression(request: Request, response: Response): Response {
  if (typeof CompressionStream === "undefined" || !(response instanceof Response) || !response.body) {
    return response;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!COMPRESSIBLE_TYPE.test(contentType) || contentType.includes("text/event-stream")) return response;
  if (response.headers.has("content-encoding")) return response;
  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > 0 && contentLength < MIN_COMPRESSIBLE_BYTES) return response;
  if (!/\bgzip\b/i.test(request.headers.get("accept-encoding") ?? "")) return response;

  const headers = new Headers(response.headers);
  headers.set("content-encoding", "gzip");
  headers.delete("content-length");
  headers.append("vary", "Accept-Encoding");
  return new Response(response.body.pipeThrough(new CompressionStream("gzip")), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
