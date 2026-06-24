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

import { compileStringFunction } from "@/utils/functions";
import { logger } from "@/utils/logger";

/** A compiled parameter-level hook (onParameterChange / onGridLoad). */
export type CompiledParameterHook = (...args: unknown[]) => unknown;

/**
 * Compiles a parameter-level hook body (onParameterChange / onGridLoad) into a
 * callable, injecting the same script context used by the process-level hooks
 * (`Metadata`, `OB`, `callAction`, …). The body is a bare function expression,
 * e.g. `(item, view, form, grid) => { … }`.
 *
 * Returns `null` when the body is empty/null (the common case: the parameter
 * carries no hook) or when compilation fails, so callers can skip wiring without
 * a try/catch. Compilation errors are logged once rather than thrown, so a single
 * malformed parameter body never breaks the modal render.
 *
 * @param body    Raw hook source from the parameter JSON, or null/undefined.
 * @param context Script context injected as named parameters (same shape as the
 *                process-level hooks).
 */
export function compileParameterHook(
  body: string | null | undefined,
  context: Record<string, unknown>
): CompiledParameterHook | null {
  if (!body || body.trim().length === 0) {
    return null;
  }

  try {
    return compileStringFunction(body, context);
  } catch (error) {
    logger.error("[compileParameterHook] Failed to compile parameter hook", error);
    return null;
  }
}
