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

/**
 * @fileoverview Helpers that mirror the classic SmartClient "view object"
 * contract for Defined Processes. The classic UI attaches `onRefreshFunction`
 * to the parameter-window view so the migrated process code can call
 * `view.onRefreshFunction(view)` to invalidate cache and redraw. See
 * org.openbravo.client.application/web/.../js/process/ob-parameter-window-view.js:436-439
 * and org.openbravo.advpaymentmngt/web/.../js/ob-aprm-matchStatement.js:142-149.
 */

import { logger } from "@/utils/logger";
import { compileStringFunction } from "@/utils/functions";

/** Signature classic uses: `OB.<Module>.<Process>.onRefresh = function(view) { ... }` */
export type OnRefreshFunction = (view: unknown) => unknown;

/**
 * Compiles the `etmetaOnRefresh` body into a callable once, returning
 * `undefined` when the field is null/empty or when compilation fails.
 * Compilation errors are logged and swallowed so a malformed migrated script
 * never breaks the modal open path — the migrated process code can guard
 * with `typeof view.onRefreshFunction === 'function'` exactly like classic does.
 */
export function compileOnRefreshFunction(
  code: string | null | undefined,
  context: Record<string, unknown> = {}
): OnRefreshFunction | undefined {
  if (!code) {
    return undefined;
  }
  try {
    return compileStringFunction(code, context) as OnRefreshFunction;
  } catch (error) {
    logger.warn("[compileOnRefreshFunction] Failed to compile etmetaOnRefresh:", error);
    return undefined;
  }
}
