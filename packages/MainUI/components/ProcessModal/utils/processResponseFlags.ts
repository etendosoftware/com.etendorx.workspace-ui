/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/** Field names emitted by Etendo Classic in process responses. */
export const PROCESS_RESPONSE_FIELDS = {
  RETRY_EXECUTION: "retryExecution",
  REFRESH_PARENT: "refreshParent",
} as const;

/**
 * Reads a boolean flag from any of the three response paths used by Etendo
 * Classic process handlers: top-level, `response.<key>`, `response.data.<key>`.
 *
 * Returns `undefined` when the flag is absent or non-boolean — callers decide
 * how to interpret absence (typically: default-true for refresh-style flags,
 * default-false for retry-style flags).
 */
export const readProcessResponseFlag = (data: unknown, key: string): boolean | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const root = data as Record<string, unknown>;
  const response = root.response as Record<string, unknown> | undefined;
  const responseData = response?.data as Record<string, unknown> | undefined;
  const candidates: unknown[] = [root[key], response?.[key], responseData?.[key]];
  for (const candidate of candidates) {
    if (typeof candidate === "boolean") return candidate;
  }
  return undefined;
};

/**
 * Etendo Classic semantics: refresh unless the handler explicitly returns
 * `refreshParent: false`. Defaulting to `true` matches
 * `BaseProcessActionHandler.doRefreshParent()`.
 */
export const shouldRefreshAfterProcess = (data: unknown): boolean => {
  return readProcessResponseFlag(data, PROCESS_RESPONSE_FIELDS.REFRESH_PARENT) !== false;
};

/**
 * Etendo Classic semantics: keep the popup open only when the handler
 * explicitly returns `retryExecution: true`.
 */
export const shouldRetryAfterProcess = (data: unknown): boolean => {
  return readProcessResponseFlag(data, PROCESS_RESPONSE_FIELDS.RETRY_EXECUTION) === true;
};
