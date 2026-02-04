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
  // Get Parent Context first (ancestors)
  const parentTab = graph.getParent(tab);
  const parentContext = parentTab ? buildEtendoContext(parentTab, graph) : {};

  // Build Current Tab Context
  const currentContext: EtendoContext = {};
  const record = graph.getSelected(tab);

  if (record) {
    for (const field of Object.values(tab.fields)) {
      // Rule: Include if it is the ID (Mandatory) OR it is a Session Attribute
      // Note: storedInSession is a string "true" in the column definition record
      const isSessionAttr = field.column?.storedInSession;
      const isId = field.hqlName === "id";

      if (isId || isSessionAttr) {
        const value = record[field.hqlName];

        if (value !== undefined) {
          // Format: @EntityName.PropertyName@
          const contextKey = `@${tab.entityName}.${field.hqlName}@`;
          currentContext[contextKey] = formatDateContext(value);
        }
      }
    }
  }

  // Merge: Parent context is base, Current context overrides/adds to it
  return { ...parentContext, ...currentContext };
};
