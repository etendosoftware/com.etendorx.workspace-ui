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

/** Shared JWT builders for the session keep-alive tests. */

/** Encodes a string as unpadded base64url, the way a JWT segment is encoded. */
export function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Builds a signature-less JWT carrying the given payload.
 *
 * @param payload The claims to embed
 * @returns A three-segment token the client-side decoder accepts
 */
export function buildToken(payload: Record<string, unknown>): string {
  return `${encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${encodeBase64Url(
    JSON.stringify(payload)
  )}.signature`;
}

/**
 * Builds a token that expires at the given millisecond timestamp.
 *
 * @param expiresAtMs Expiration in milliseconds since the epoch
 * @returns A token whose exp claim matches the given instant
 */
export function buildTokenExpiringAt(expiresAtMs: number): string {
  return buildToken({ user: "U1", exp: Math.floor(expiresAtMs / 1000) });
}
