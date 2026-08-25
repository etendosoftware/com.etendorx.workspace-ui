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

/**
 * Browser-side JWT reading, used only to schedule the session keep-alive.
 *
 * The signature is never verified here — the ERP is the authority on that. All this needs is the
 * `exp` claim, which the ERP only emits when `SMFSWS_Config.Expirationtime > 0`. When the claim is
 * absent the token never expires and the whole keep-alive mechanism stays inert.
 */

const BASE64_PADDING = 4;
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Decodes the payload of a JWT without verifying its signature.
 *
 * @param token The raw JWT
 * @returns The decoded payload, or null when the token is missing or malformed
 */
export function decodeTokenPayload(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (BASE64_PADDING - (base64.length % BASE64_PADDING)) % BASE64_PADDING;
    const padded = base64.padEnd(base64.length + paddingLength, "=");

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/**
 * Reads the token's expiration as a millisecond timestamp.
 *
 * @param token The raw JWT
 * @returns The expiration in milliseconds since the epoch, or null when the token never expires
 */
export function getTokenExpiration(token: string | null | undefined): number | null {
  const payload = decodeTokenPayload(token);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp !== "number") return null;

  return exp * MILLISECONDS_PER_SECOND;
}

/**
 * Tells whether a token is already past its expiration.
 *
 * A token that carries no `exp` claim never expires, so this returns false — which keeps every
 * caller inert while `SMFSWS_Config.Expirationtime` is 0.
 *
 * @param token The raw JWT
 * @param nowMs Current time in milliseconds since the epoch
 * @returns true only when the token has a known expiration that has already passed
 */
export function isTokenExpired(token: string | null | undefined, nowMs: number = Date.now()): boolean {
  const expiresAt = getTokenExpiration(token);
  if (expiresAt === null) return false;

  return nowMs >= expiresAt;
}
