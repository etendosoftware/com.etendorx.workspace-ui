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

import { CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type Graph from "../data/graph";

interface ContextItem {
  contextString: string;
}

interface BuildContextStringOptions {
  contextItems: ContextItem[];
  registersText: string;
}

/**
 * Interface representing the context parameters.
 * Keys are in the format `@EntityName.PropertyName@`.
 */
export interface EtendoContext extends Record<string, unknown> {}

export const buildContextString = ({ contextItems, registersText }: BuildContextStringOptions): string => {
  if (contextItems.length === 0) {
    return "";
  }

  const recordsData = contextItems.map((item) => item.contextString);
  const count = contextItems.length;

  return `${CONTEXT_CONSTANTS.TAG_START} (${count} ${registersText}):\n\n${recordsData.join("\n\n---\n\n")}${CONTEXT_CONSTANTS.TAG_END}`;
};

/**
 * Formats a value for use in the Etendo context, specifically handling dates.
 * NOTE: currently not used
 *
 * @param value - The value to format
 * @returns The formatted value
 */
const formatDateContext = (value: unknown): unknown => {
  return value;
};

/**
 * Recursively builds the Etendo Classic context variables for a given tab.
 * This mimics the "Snowball Context" logic where context is gathered from
 * the current tab (if a record is selected) and all its ancestor tabs.
 *
 * The context keys are formatted as `@EntityName.HqlName@`.
 *
 * Filtering Rules:
 * - A field is included if its `hqlName` is "id".
 * - OR if its column definition has `storedInSession` set to true.
 *
 * @param tab - The tab to start building context from.
 * @param graph - The Graph instance used to traverse the tab hierarchy and retrieve selected records.
 * @returns A record of context variables.
 */
export const buildEtendoContext = (tab: Tab, graph: Graph<Tab>): EtendoContext => {
  // Merge: Parent context is base, Current context overrides/adds to it
  return { ...buildAncestorContext(tab, graph), ...buildRecordContext(tab, graph.getSelected(tab)) };
};

/**
 * Context of a record of a tab: its id and its session properties, as `@EntityName.property@`.
 *
 * @param tab - Tab the record belongs to, whose `entityName` names the keys.
 * @param record - The record; none gives an empty context.
 */
export const buildRecordContext = (tab: Tab, record: Record<string, unknown> | null | undefined): EtendoContext => {
  const context: EtendoContext = {};
  if (!record) {
    return context;
  }
  for (const field of Object.values(tab.fields)) {
    // Rule: Include if it is the ID (Mandatory) OR it is a Session Attribute
    // Note: storedInSession is a string "true" in the column definition record
    const isSessionAttr = field.column?.storedInSession;
    const isId = field.hqlName === "id";

    if (isId || isSessionAttr) {
      const value = record[field.hqlName];

      if (value !== undefined) {
        context[`@${tab.entityName}.${field.hqlName}@`] = formatDateContext(value);
      }
    }
  }
  return context;
};

/**
 * Context of the records selected in the ancestors of a tab, without the tab's own record: what decides the
 * records a child tab shows. The nearer ancestor overrides the farther one.
 *
 * @param tab - Tab whose ancestors give the context.
 * @param graph - Tabs of the window with their selected records.
 * @param parentRecord - Record of the direct parent to use instead of the one in the graph (a child tab passes
 *   the parent record it fetches with, which the graph may have cleared without notice).
 */
export const buildAncestorContext = (
  tab: Tab,
  graph: Graph<Tab>,
  parentRecord?: Record<string, unknown> | null
): EtendoContext => {
  const parentTab = graph.getParent(tab);
  if (!parentTab) {
    return {};
  }
  return {
    ...buildAncestorContext(parentTab, graph),
    ...buildRecordContext(parentTab, parentRecord ?? graph.getSelected(parentTab)),
  };
};

/**
 * The properties every parent record contributes to a child tab's datasource request, in the
 * order the server needs them. Classic sends the parent's whole session-property set
 * (`getContextInfo(true, false)`, ob-view-grid.js:2736); these three are the ones the server
 * actually reads back when substituting a child tab's `hqlwhereclause`.
 */
const PARENT_SESSION_PROPERTIES = ["id", "client", "organization"] as const;

/**
 * Builds the `@EntityName.property@` context params for a child tab's **parent** record.
 *
 * `AdvancedQueryBuilder.substituteContextParameters` resolves the variables of a child tab's
 * `hqlwhereclause` by walking the ancestor tabs and reading these exact request params:
 * `@AD_Org_ID@` is answered with `@<parentEntity>.organization@`, `@AD_Client_ID@` with
 * `@<parentEntity>.client@`, and `@<parenttable>_id@` with `@<parentEntity>.id@`. Omitting them
 * leaves the variable unresolved, and an empty organization makes `AD_ISORGINCLUDED` return -1,
 * which silently drops every row.
 *
 * This complements `buildEtendoContext` (which derives the same keys from the tab's field
 * metadata); it is additive — it only ever contributes keys, never removes any.
 *
 * @param parentTab - The parent tab, whose `entityName` names the context keys.
 * @param parentRecord - The record selected in the parent tab, if any.
 * @returns A record of context variables; empty when there is no parent entity or no record.
 */
export const buildParentSessionContext = (
  parentTab: Tab | null | undefined,
  parentRecord: Record<string, unknown> | null | undefined
): EtendoContext => {
  const context: EtendoContext = {};
  if (!parentTab?.entityName || !parentRecord) {
    return context;
  }

  for (const property of PARENT_SESSION_PROPERTIES) {
    const value = parentRecord[property];
    if (value !== undefined && value !== null && value !== "") {
      context[`@${parentTab.entityName}.${property}@`] = value;
    }
  }

  return context;
};
