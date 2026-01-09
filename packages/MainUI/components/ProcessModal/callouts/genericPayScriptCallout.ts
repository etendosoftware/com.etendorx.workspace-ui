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

import { executeLogic } from "@/payscript";
import type { PayScriptRules } from "@/payscript";
import type { ProcessCalloutFunction } from "./processCallouts";
import { logger } from "@/utils/logger";

/**
 * Registry of PayScript rules by process ID
 * In the future, this will be loaded from the backend dynamically
 */
const PAYSCRIPT_RULES_REGISTRY: Record<string, PayScriptRules> = {};

/**
 * Register PayScript rules for a process
 */
export function registerPayScriptRules(processId: string, rules: PayScriptRules): void {
  PAYSCRIPT_RULES_REGISTRY[processId] = rules;
  logger.debug(`[PayScript] Registered rules for process: ${processId}`);
}

/**
 * Get PayScript rules for a process
 */
export function getPayScriptRules(processId: string): PayScriptRules | undefined {
  return PAYSCRIPT_RULES_REGISTRY[processId];
}

/**
 * Generic PayScript callout that works for ANY process
 *
 * This callout:
 * 1. Checks if the process has registered PayScript rules
 * 2. Passes ALL form values and grid selection as context (no mapping needed)
 * 3. Executes the rules
 * 4. Returns ALL computed and transformed values (no mapping needed)
 *
 * The beauty of this approach is that:
 * - The DSL rules themselves define what data they need from context
 * - The DSL rules themselves define what fields they return
 * - No process-specific adapter code needed
 * - Works for any process once rules are registered
 */
export const genericPayScriptCallout: ProcessCalloutFunction = async (formValues, _form, gridSelection) => {
  try {
    // Extract process ID from form values
    const processId = extractProcessId(formValues);
    if (!processId) {
      logger.debug("[PayScript] No process ID found in form values");
      return {};
    }

    // Get rules for this process
    const rules = getPayScriptRules(processId);
    if (!rules) {
      logger.debug(`[PayScript] No rules registered for process: ${processId}`);
      return {};
    }

    logger.debug(`[PayScript] Executing rules for process: ${processId}`);
    logger.debug("[PayScript] Form values keys:", Object.keys(formValues));
    logger.debug("[PayScript] Grid selection:", gridSelection);

    // Build context by passing everything
    const context = {
      ...formValues,
      _gridSelection: gridSelection,
      _processId: processId,
    };

    // Execute PayScript rules
    const result = executeLogic(rules, context);

    if (!result.success) {
      logger.error(`[PayScript] Execution failed: ${result.error}`);
      return {};
    }

    logger.debug("[PayScript] Execution successful");
    logger.debug("[PayScript] Computed fields:", Object.keys(result.computed || {}));
    logger.debug("[PayScript] Sample computed values:", {
      total: result.computed?.total,
      difference: result.computed?.difference,
      overpayment_action: result.computed?.overpayment_action,
    });

    // Handle validation errors
    if (result.validations && result.validations.length > 0) {
      const errors = result.validations.filter((v) => !v.isValid);
      if (errors.length > 0) {
        logger.warn("[PayScript] Validation errors:", errors);
        // In the future, we could emit these to a validation context
      }
    }

    // Return all computed values and transformations
    // The DSL rules dictate what fields are returned
    const updates: Record<string, unknown> = {
      ...result.computed, // All calculated fields from compute phase
      ...result.invoices, // Transformed invoices (if any)
      ...result.glItems, // Transformed GL items (if any)
      ...result.creditToUse, // Transformed credits (if any)
      _validations: result.validations || [], // Pass validations to the UI
    };

    // Don't include internal fields (success, computed, validations, error)
    // These are already extracted above

    logger.debug("[PayScript] Returning updates:", updates);

    return updates;
  } catch (error) {
    logger.error("[PayScript] Callout error:", error);
    return {};
  }
};

/**
 * Extract process ID from form values
 * Tries common field names where process ID might be stored
 */
function extractProcessId(formValues: Record<string, unknown>): string | null {
  const candidates = [formValues._processId, formValues.processId, formValues.process_id, formValues.ad_process_id];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

/**
 * Parse and register PayScript DSL from string content
 */
export function registerPayScriptDSL(processId: string, dslCode: string): void {
  try {
    if (!dslCode || !dslCode.trim()) return;

    // 1. Clean up imports and exports
    // Use a non-greedy, multiline-safe regex to avoid ReDoS and handle multi-line imports
    // We handle specifically the "export const NAME = ..." pattern
    let cleanCode = dslCode
      .replace(/^\s*import\s+[\s\S]+?;/gm, "")
      .replace(/export\s+const\s+\w+(\s*:\s*\w+)?\s*=\s*/, "")
      .trim();

    // Remove trailing semicolon if present
    if (cleanCode.endsWith(";")) {
      cleanCode = cleanCode.slice(0, -1);
    }

    // Attempt basic type stripping if it looks like TS
    // This is a naive stripper but works for simple cases, and specifically checks for '=>' to avoid breaking non-arrow functions
    if (
      dslCode.includes("=>") &&
      (dslCode.includes(": any") || dslCode.includes("as any") || dslCode.includes("as const"))
    ) {
      cleanCode = cleanCode
        .replace(/as\s+any/g, "")
        .replace(/as\s+const/g, "")
        // Remove function argument types: (n: any) -> (n)
        .replace(/\(\s*([a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_\[\]<>]+\s*\)/g, "($1)")
        // Remove explicit return types: ): void => -> ) =>
        .replace(/\)\s*:\s*[a-zA-Z0-9_\[\]<>]+\s*=>/g, ") =>");
    }

    // Evaluate
    // We wrap it in return (...) to ensure it's treated as an expression
    // SECURITY: This relies on 'dslCode' coming from a trusted backend source.
    // Do not allow end-users to input arbitrary PayScript code here.
    // biome-ignore lint/security/noGlobalEval: Dynamic DSL execution required for PayScript engine
    const createRules = new Function(`return ${cleanCode}`);
    const rules = createRules();

    if (rules && typeof rules === "object") {
      // Ensure ID matches
      const rulesWithId = { ...rules, id: processId };
      registerPayScriptRules(processId, rulesWithId);
      logger.debug(`[PayScript] Successfully registered DSL for process: ${processId}`);
    } else {
      logger.warn(`[PayScript] Parsed DSL is not an object for process: ${processId}`);
    }
  } catch (error) {
    logger.error(`[PayScript] Failed to parse DSL for process ${processId}:`, error);
    // Log the failing code for debugging
    logger.debug(`[PayScript] Failing code snippet: ${dslCode.substring(0, 100)}...`);
  }
}
