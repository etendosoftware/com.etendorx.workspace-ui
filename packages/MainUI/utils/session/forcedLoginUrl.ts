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

import { logger } from "@/utils/logger";

/** Next route with the System configuration of the login screen. */
export const LOGIN_CONFIG_PATH = "/api/auth/login-config";

const parseUrl = (value: string): URL | undefined => {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

/**
 * Address the login page must move to, as classic `Login.java` does with `ForcedLoginURL`: the configured
 * address when the page was reached through another one. In the new UI it only applies when the address
 * leads to this login (its path is a prefix of the current one, e.g. another host or https): an address of
 * the classic login page is ignored, so the user is never sent to the other interface.
 *
 * @param forcedLoginUrl - Value of `ForcedLoginURL`; empty when not set
 * @param currentHref - Address the login page was reached through
 * @returns The address to go to, or `undefined` to stay
 */
export function getForcedLoginRedirect(forcedLoginUrl: string | undefined, currentHref: string): string | undefined {
  const value = forcedLoginUrl?.trim();
  if (!value || currentHref.startsWith(value)) {
    return undefined;
  }
  const target = parseUrl(value);
  const current = parseUrl(currentHref);
  if (!target || !current?.pathname.startsWith(target.pathname)) {
    return undefined;
  }
  return value;
}

/**
 * Reads `ForcedLoginURL` and moves the login page to it when it applies. Any failure keeps the login page.
 */
export async function applyForcedLoginUrl(): Promise<void> {
  try {
    const response = await fetch(LOGIN_CONFIG_PATH);
    const { forcedLoginUrl } = (await response.json()) as { forcedLoginUrl?: string };
    const redirect = getForcedLoginRedirect(forcedLoginUrl, window.location.href);
    if (redirect) {
      window.location.replace(redirect);
    }
  } catch (error) {
    logger.warn("Could not apply the forced login address:", error);
  }
}
