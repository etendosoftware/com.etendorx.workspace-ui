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

import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";
import { compileParameterHook, type CompiledParameterHook } from "@/utils/processes/definition/compileParameterHook";
import {
  createFormHandle,
  createItemProxy,
  createViewProxy,
  type FieldController,
  type GridResolver,
  type MessageBarHandle,
  type ViewController,
  type ViewData,
} from "@/utils/processes/definition/scriptProxies";

/**
 * Trailing debounce (ms) applied before invoking a parameter's onChange hook.
 * Coalesces free-text keystroke bursts into a single call; discrete selectors
 * (select / boolean / date) emit one change and effectively fire immediately.
 */
const ONCHANGE_DEBOUNCE_MS = 250;

export interface UseParameterChangeHooksParams {
  /** The process modal's react-hook-form instance. */
  form: UseFormReturn;
  /** Process parameters keyed by name (form keys match `parameter.name`). */
  parameters: Record<string, ProcessParameter> | undefined;
  /** Script context injected into each hook (`{ Metadata, ...processScriptContext }`). Must be stable. */
  context: Record<string, unknown>;
  /** Backing for `view.messageBar`. */
  messageBar: MessageBarHandle;
  /** Bridge that makes the form-item mutation API (`setRequired` / `show` / …) live. */
  fieldController?: FieldController;
  /** Bridge that makes the `view` action methods + footer chrome live. */
  viewController?: ViewController;
  /** Read-only environment data surfaced on the `view`. */
  viewData?: ViewData;
  /** Resolves `view.theForm.getItem('<param>').canvas.viewGrid` to a live grid handle. */
  gridResolver?: GridResolver;
}

/**
 * Compiles each parameter's `etmetaOnParameterChange` body once and fires it when
 * the parameter's committed value changes, with the classic signature
 * `(item, view, form, grid)` (grid is `null` for non-grid parameters).
 *
 * Three guards keep this safe against loops and overload:
 *  - value diff: only fires when the parameter's value actually changed;
 *  - re-entrancy: a hook's own `item.setValue` does not re-trigger that same
 *    parameter's hook;
 *  - trailing debounce: rapid changes for one parameter collapse into one call.
 */
export function useParameterChangeHooks({
  form,
  parameters,
  context,
  messageBar,
  fieldController,
  viewController,
  viewData,
  gridResolver,
}: UseParameterChangeHooksParams): void {
  const compiledHooks = useMemo(() => {
    const map = new Map<string, CompiledParameterHook>();
    for (const parameter of Object.values(parameters ?? {})) {
      const compiled = compileParameterHook(parameter.etmetaOnParameterChange, context);
      if (compiled) {
        map.set(parameter.name, compiled);
      }
    }
    return map;
  }, [parameters, context]);

  useEffect(() => {
    if (compiledHooks.size === 0) {
      return;
    }

    const formHandle = createFormHandle(form);

    const prevValues = { ...(form.getValues() as Record<string, unknown>) };
    const firing = new Set<string>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const runHook = (name: string, hook: CompiledParameterHook) => {
      firing.add(name);
      try {
        const item = createItemProxy(formHandle, name, {}, fieldController, gridResolver);
        const view = createViewProxy(formHandle, parameters, {
          messageBar,
          controller: fieldController,
          viewController,
          gridResolver,
          data: viewData,
        });
        hook(item, view, view.theForm, null);
      } catch (error) {
        logger.error(`[useParameterChangeHooks] onParameterChange failed for "${name}"`, error);
      } finally {
        firing.delete(name);
      }
    };

    const subscription = form.watch((values, info) => {
      const name = info?.name;
      if (!name) return;

      const hook = compiledHooks.get(name);
      if (!hook) return;

      const nextValue = (values as Record<string, unknown>)[name];

      // Re-entrancy guard: ignore the echo from the hook's own setValue.
      if (firing.has(name)) {
        prevValues[name] = nextValue;
        return;
      }

      // Value-diff guard: skip no-op changes (also prevents loops).
      if (Object.is(prevValues[name], nextValue)) return;
      prevValues[name] = nextValue;

      const pending = timers.get(name);
      if (pending) clearTimeout(pending);
      timers.set(
        name,
        setTimeout(() => {
          timers.delete(name);
          runHook(name, hook);
        }, ONCHANGE_DEBOUNCE_MS)
      );
    });

    return () => {
      subscription.unsubscribe();
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, [compiledHooks, form, parameters, messageBar, fieldController, viewController, viewData, gridResolver]);
}
