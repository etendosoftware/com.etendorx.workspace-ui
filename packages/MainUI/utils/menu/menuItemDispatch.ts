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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import { WindowType } from "@workspaceui/api-client/src/api/types";
import type { ProcessDefinitionButton, ProcessType } from "@/components/ProcessModal/types";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import { MENU_ITEM_TYPES } from "./menuItemTypes";

/**
 * Extension of the {@link Menu} shape with the optional fields that the
 * metadata backend attaches to process-like menu entries. Kept local to the
 * dispatch layer because the canonical {@link Menu} interface lives in
 * `api-client` and should remain framework-agnostic.
 */
export interface ExtendedMenu extends Menu {
  processDefinitionId?: string;
  formId?: string;
  processId?: string;
  description?: string;
}

/**
 * @returns true when the menu entry represents a Process Definition (modern
 * pattern, opens the new {@code ProcessDefinitionModal}).
 */
export const isProcessDefinitionMenuItem = (item: ExtendedMenu): boolean => {
  return item.type === MENU_ITEM_TYPES.PROCESS_DEFINITION && Boolean(item.id);
};

/**
 * @returns true when the menu entry represents a Report and Process (legacy
 * pattern that the new UI maps onto the same modal as Process Definitions).
 */
export const isReportAndProcessMenuItem = (item: ExtendedMenu): boolean => {
  return item.type === MENU_ITEM_TYPES.PROCESS && Boolean(item.id);
};

/**
 * @returns true when the menu entry targets a Pick and Execute window
 * (`AD_WINDOW.WindowType = OBUIAPP_PickAndExecute`). The discriminator lives
 * in the `windowType` field emitted by the metadata module.
 */
export const isPickAndExecuteMenuItem = (item: ExtendedMenu): boolean => {
  return item.windowType === WindowType.PICK_AND_EXECUTE;
};

/**
 * Builds a minimal {@link ProcessDefinitionButton} from a process-like menu
 * entry. The full process metadata is hydrated later by the modal itself via
 * {@code /meta/process/{id}} — this only carries the identity needed for the
 * modal to issue that fetch.
 *
 * Returns `null` for entries that are not process-like, preserving the
 * historical contract.
 */
export const mapMenuToProcessDefinitionButton = (item: ExtendedMenu): ProcessDefinitionButton | null => {
  if (!isProcessDefinitionMenuItem(item) && !isReportAndProcessMenuItem(item)) {
    return null;
  }

  // Process Definitions expose their own id; legacy Report and Process entries
  // expose `processId`. Fall back to the menu id as a last resort.
  const targetProcessId = item.processDefinitionId || item.processId || item.id;

  return {
    id: item.id,
    name: item.name,
    action: "P",
    enabled: true,
    visible: true,
    processId: targetProcessId,
    buttonText: item.name,
    processInfo: {
      loadFunction: "",
      searchKey: "",
      clientSideValidation: "",
      _entityName: "ADProcess",
      id: targetProcessId,
      name: item.name,
      javaClassName: "",
      parameters: [],
    },
    processDefinition: {
      id: targetProcessId,
      name: item.name,
      description: item.description || "",
      javaClassName: "",
      parameters: {},
      onLoad: "",
      onProcess: "",
    },
  } as unknown as ProcessDefinitionButton;
};

export const MENU_CLICK_INTENT_KINDS = {
  PICK_AND_EXECUTE: "pick-and-execute",
  PROCESS_DEFINITION: "process-definition",
  NONE: "none",
} as const;

/**
 * Discriminated union describing what should happen when the user clicks a
 * menu entry. Encapsulates the decision tree so the Sidebar component only
 * needs to pattern-match the result and apply state setters.
 */
export type MenuClickIntent =
  | { kind: typeof MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE; button: ProcessDefinitionButton }
  | {
      kind: typeof MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION;
      button: ProcessDefinitionButton;
      processType: ProcessType;
    }
  | { kind: typeof MENU_CLICK_INTENT_KINDS.NONE };

const NONE_INTENT: MenuClickIntent = { kind: MENU_CLICK_INTENT_KINDS.NONE };

/**
 * Resolves the modal intent for a menu click that targets a process-like
 * entry (Pick and Execute, Process Definition or Report and Process). For any
 * other entry type — Window, Form, ProcessManual, Report or unrecognised —
 * the resolver returns {@code { kind: "none" }} and the Sidebar falls through
 * to the legacy iframe / classic / window navigation branches.
 *
 * The resolver is intentionally a pure function so it can be exhaustively
 * tested without standing up the Sidebar's hook graph.
 */
export const resolveMenuClickIntent = (item: ExtendedMenu): MenuClickIntent => {
  if (isPickAndExecuteMenuItem(item)) {
    const button = mapMenuToProcessDefinitionButton(item);
    if (!button) return NONE_INTENT;
    return { kind: MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE, button };
  }

  if (isProcessDefinitionMenuItem(item)) {
    const button = mapMenuToProcessDefinitionButton(item);
    if (!button) return NONE_INTENT;
    return { kind: MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION, button, processType: PROCESS_TYPES.PROCESS_DEFINITION };
  }

  if (isReportAndProcessMenuItem(item)) {
    const button = mapMenuToProcessDefinitionButton(item);
    if (!button) return NONE_INTENT;
    return { kind: MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION, button, processType: PROCESS_TYPES.REPORT_AND_PROCESS };
  }

  return NONE_INTENT;
};
