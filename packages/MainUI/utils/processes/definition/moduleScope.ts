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

import { logger } from "@/utils/logger";

/**
 * Classification of the `em_etmeta_payscript_logic` column content.
 * - `"dsl"`: a PayScript DSL expression (object/config), handled by the existing
 *   DSL registry. This is the shape every process shipping the column uses today.
 * - `"module"`: a JavaScript module body declaring shared helpers/constants/state
 *   that the process hooks resolve by bare name.
 */
export type PayscriptBodyKind = "dsl" | "module";

const KIND_DSL: PayscriptBodyKind = "dsl";
const KIND_MODULE: PayscriptBodyKind = "module";

/** Explicit Tier-1 markers (first significant line of the body). */
const MARKER_DSL = "@payscript";
const MARKER_MODULE = "@module-scope";

/** Structural Tier-2 openers that identify a DSL expression. */
const DSL_OPENERS = ["{", "("];

/**
 * A leading `export` keyword (e.g. `export const NAME = {...}` / `export default {...}`).
 * Such a body is always a DSL object: the DSL registry strips that wrapper, and a module
 * body (run via `new Function`) can never contain a top-level `export`.
 */
const EXPORT_KEYWORD_RE = /^export\b/;

/**
 * Removes leading whitespace plus any leading line (`//`) or block (`/* *\/`)
 * comments so the structural classifier can inspect the first significant token.
 */
function stripLeadingComments(body: string): string {
  let rest = body.trimStart();
  while (rest.length > 0) {
    if (rest.startsWith("//")) {
      const newline = rest.indexOf("\n");
      rest = newline === -1 ? "" : rest.slice(newline + 1).trimStart();
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = rest.indexOf("*/");
      rest = end === -1 ? "" : rest.slice(end + 2).trimStart();
      continue;
    }
    break;
  }
  return rest;
}

/** Reads the first non-blank, non-comment line as a Tier-1 marker, if present. */
function markerKind(body: string): PayscriptBodyKind | null {
  const trimmed = body.trimStart();
  if (!trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
    return null;
  }
  const firstLine = trimmed.slice(0, trimmed.indexOf("\n") === -1 ? trimmed.length : trimmed.indexOf("\n"));
  if (firstLine.includes(MARKER_MODULE)) {
    return KIND_MODULE;
  }
  if (firstLine.includes(MARKER_DSL)) {
    return KIND_DSL;
  }
  return null;
}

/**
 * Classifies the content of `em_etmeta_payscript_logic` into a PayScript DSL
 * expression or a JavaScript module body, so the runtime dispatches each to the
 * correct path without modifying any shipped content.
 *
 * Tier 1 (explicit marker on the first significant line) wins; otherwise Tier 2
 * inspects the first significant character: `{` or `(` → DSL (expression form),
 * anything else → module body (declarations / statements).
 */
export function classifyPayscriptBody(body: string): PayscriptBodyKind {
  const marker = markerKind(body);
  if (marker) {
    return marker;
  }
  const significant = stripLeadingComments(body);
  // A DSL object exported via `export const NAME = {...}` (the shape every process
  // shipping the column uses) routes to DSL: the registry strips the wrapper and a
  // module body can never carry a top-level `export`.
  if (EXPORT_KEYWORD_RE.test(significant)) {
    return KIND_DSL;
  }
  const firstChar = significant.charAt(0);
  if (DSL_OPENERS.includes(firstChar)) {
    return KIND_DSL;
  }
  return KIND_MODULE;
}

/** Empty scope reused as a stable reference when there is no module body. */
const EMPTY_SCOPE: Record<string, unknown> = {};

function isScopeObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Evaluates a JavaScript module body once, returning the scope object it exports.
 *
 * The body is run as a module-level function with the script context injected as
 * named parameters, so it can read `OB`, `callAction`, etc. To expose helpers for
 * bare-name resolution, the body must end with `return { helperA, helperB, ... };`.
 * Any `OB.<Namespace>.* = ...` writes performed during evaluation persist on the
 * shared OB shim regardless of the return value.
 *
 * Returns an empty scope (never throws) when the body does not return an object or
 * fails to evaluate, so a malformed body never blocks the modal from opening.
 */
export function evaluateModuleScope(body: string, context: Record<string, unknown>): Record<string, unknown> {
  try {
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);
    // `body` is an Application Dictionary field (Process/Report-and-Process "Payscript
    // Logic") fetched read-only from the authenticated metadata API. It is authored by
    // administrators in Etendo Classic, never by end-user input, form fields, or
    // URL/query parameters reaching this frontend.
    const factory = new Function(...contextKeys, body); // NOSONAR typescript:S1523
    const scope = factory(...contextValues);

    if (isScopeObject(scope)) {
      return scope;
    }

    logger.warn(
      "[evaluateModuleScope] Module body did not return an object; bare-name helpers will be unavailable. " +
        "End the body with `return { ... };` to expose helpers."
    );
    return EMPTY_SCOPE;
  } catch (error) {
    logger.error("[evaluateModuleScope] Failed to evaluate module body", error);
    return EMPTY_SCOPE;
  }
}
