#!/usr/bin/env node
/**
 * Removes credentials from HAR recordings of the mocked-backend layer before they are committed:
 * auth and cookie headers, cookies, login passwords and session tokens. The replay ignores all of
 * them (see e2e/support/mock/normalize.ts), so a sanitized recording replays the same.
 *
 * Usage:
 *   node scripts/sanitize-har.mjs <file.har> [...]   rewrites each file in place
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SECRET_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-csrf-token"]);
/** JSON properties whose value is a credential, and what replaces it. */
const SECRET_PROPERTIES = { password: "***", token: "e2e-token", csrfToken: "e2e-csrf" };

/** A JSON value with every secret property replaced, at any depth. */
function maskJson(value) {
  if (Array.isArray(value)) {
    return value.map(maskJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        key in SECRET_PROPERTIES ? SECRET_PROPERTIES[key] : maskJson(child),
      ])
    );
  }
  return value;
}

/** A body text with its secrets masked; non-JSON bodies are kept as they are. */
export function maskBody(text) {
  if (!text) {
    return text;
  }
  try {
    return JSON.stringify(maskJson(JSON.parse(text)));
  } catch {
    return text;
  }
}

const withoutSecretHeaders = (headers = []) =>
  headers.filter((header) => !SECRET_HEADERS.has(header.name.toLowerCase()));

/** One HAR entry without credentials. */
function sanitizeEntry(entry) {
  const { request, response } = entry;
  const postData = request.postData && { ...request.postData, text: maskBody(request.postData.text) };
  return {
    ...entry,
    request: { ...request, headers: withoutSecretHeaders(request.headers), cookies: [], ...(postData && { postData }) },
    response: {
      ...response,
      headers: withoutSecretHeaders(response.headers),
      cookies: [],
      content: { ...response.content, text: maskBody(response.content?.text) },
    },
  };
}

/** A HAR without credentials. */
export function sanitizeHar(har) {
  return { ...har, log: { ...har.log, entries: har.log.entries.map(sanitizeEntry) } };
}

/** Rewrites each HAR file in place, sanitized. */
export function sanitizeFiles(files) {
  for (const file of files) {
    writeFileSync(file, `${JSON.stringify(sanitizeHar(JSON.parse(readFileSync(file, "utf8"))), null, 2)}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sanitizeFiles(process.argv.slice(2));
}
