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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview useWarehousePlugin — evaluates the onLoad string function and retrieves
 * the registered Payscript onScan hook for a given warehouse process.
 *
 * Flow:
 *  1. onLoad (from processDefinition AD field) is evaluated via executeStringFunction
 *     → returns WarehouseProcessSchema with structure + initial data.
 *     If the field is empty the hook returns loading=false with no schema,
 *     and the modal falls through to its normal render.
 *  2. The EM_Etmeta_Payscript field is registered in PAYSCRIPT_RULES_REGISTRY
 *     by ProcessDefinitionModal before this hook runs.
 *  3. This hook also exposes the effective onProcess code for the caller to execute.
 *
 */

import { useEffect, useMemo, useState } from "react";
import { executeStringFunction } from "@/utils/functions";
import { getPayScriptRules } from "@/components/ProcessModal/callouts/genericPayScriptCallout";
import { logger } from "@/utils/logger";
import { createCallAction, createFetchDatasource } from "./warehouseApiHelpers";
import type { WarehouseProcessSchema, WarehousePayScriptPlugin } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseWarehousePluginResult {
  /** Schema returned by onLoad evaluation — null while loading or on error */
  schema: WarehouseProcessSchema | null;
  /** onScan hook from the Payscript registry — null if not registered */
  payscriptPlugin: WarehousePayScriptPlugin | null;
  /** Effective onProcess code string (from backend or local fallback) */
  effectiveOnProcess: string | undefined;
  loading: boolean;
  error: string | null;
}

interface UseWarehousePluginOptions {
  processId: string;
  /** Raw string from processDefinition.onLoad — may be empty if not yet in AD */
  onLoadCode: string | undefined;
  /** Raw string from processDefinition.onProcess — may be empty if not yet in AD */
  onProcessCode: string | undefined;
  /** processDefinition object passed as first arg to onLoad */
  processDefinition: Record<string, unknown>;
  selectedRecords: { id: string }[];
  token: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWarehousePlugin({
  processId,
  onLoadCode,
  onProcessCode,
  processDefinition,
  selectedRecords,
  token,
}: UseWarehousePluginOptions): UseWarehousePluginResult {
  const [schema, setSchema] = useState<WarehouseProcessSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveOnLoad = onLoadCode;
  const effectiveOnProcess = onProcessCode;

  // Sandboxed helpers for entity lookups and ERP kernel calls.
  // Created via shared factory functions to avoid duplication with GenericWarehouseProcess.
  const fetchDatasource = useMemo(() => createFetchDatasource(token), [token]);
  const callAction = useMemo(() => createCallAction(token, processId), [token, processId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally limited deps — processDefinition, callAction and fetchDatasource are stable (derived from token/processId via useMemo)
  useEffect(() => {
    // If there's no onLoad at all (not in backend, not in fallbacks) → not a warehouse process
    if (!effectiveOnLoad) {
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const context = {
          callAction,
          fetchDatasource,
          fetch: undefined, // explicitly blocked — use callAction / fetchDatasource instead
        };

        // .trim() is critical: template literals start with \n which causes ASI after `return`
        const result = await executeStringFunction(effectiveOnLoad.trim(), context, processDefinition, {
          selectedRecords,
        });

        if (!result || result.type !== "warehouseProcess") {
          // Not a warehouse process — return silently so the modal falls through to its normal render
          setLoading(false);
          return;
        }

        setSchema(result as WarehouseProcessSchema);
      } catch (e) {
        logger.error("[useWarehousePlugin] onLoad evaluation failed", e);
        setError(e instanceof Error ? e.message : "Failed to evaluate onLoad");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [processId, effectiveOnLoad, selectedRecords[0]?.id, token]);

  // Read the Payscript plugin from registry (registered by ProcessDefinitionModal via EM_Etmeta_Payscript field)
  const rawRules = getPayScriptRules(processId);
  const payscriptPlugin: WarehousePayScriptPlugin | null =
    rawRules && typeof (rawRules as unknown as WarehousePayScriptPlugin).onScan === "function"
      ? (rawRules as unknown as WarehousePayScriptPlugin)
      : null;

  return { schema, payscriptPlugin, effectiveOnProcess, loading, error };
}
