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

export type NetworkErrorKind = "network" | "timeout";

const NETWORK_FAILURE_PATTERN = /failed to fetch|networkerror|load failed|network request failed/i;

/**
 * Classifies an error as an infrastructure failure (connection lost, server unreachable, request
 * timed out) so it can be reported with an actionable message. Returns `null` for anything else.
 *
 * `AbortError` is deliberately NOT classified: the application aborts its own requests on purpose
 * (superseded searches, unmounted views), and those must stay silent.
 */
export const classifyNetworkError = (error: unknown): NetworkErrorKind | null => {
  if (typeof error !== "object" || error === null) return null;

  const { name, message } = error as { name?: string; message?: string };

  if (name === "TimeoutError") return "timeout";
  if (name === "TypeError" && typeof message === "string" && NETWORK_FAILURE_PATTERN.test(message)) {
    return "network";
  }

  return null;
};
