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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local / cloud metadata (AWS, GCP, Azure)
  /^\[?::1\]?$/, // IPv6 loopback
  /^\[?fc[0-9a-f]{2}:/i, // IPv6 ULA
];

/**
 * Returns true only if the value is a valid https URL pointing to a public host.
 * Rejects javascript:, data:, http:, private/reserved IP ranges,
 * and URLs with userinfo (user:pass@ or user@ tricks like https://evil.com\@google.com).
 */
export function isSafeUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false; // block userinfo tricks
    const host = url.hostname.toLowerCase();
    if (PRIVATE_IP_PATTERNS.some((re) => re.test(host))) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true if a widget param is a URL field.
 * Detection is based on the param's defaultValue being a URL,
 * or the param name containing "url" or being "src".
 * Used to decide whether to apply URL validation regardless of what the user typed.
 */
export function isUrlParam(param: { name: string; defaultValue: string | null }): boolean {
  if (param.defaultValue != null && param.defaultValue.trim().toLowerCase().startsWith("http")) {
    return true;
  }
  const name = param.name.toLowerCase();
  return name === "src" || name === "url" || name.endsWith("url") || name.endsWith("_src");
}
