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

import {
  type ExtendedMenu,
  MENU_CLICK_INTENT_KINDS,
  isPickAndExecuteMenuItem,
  isProcessDefinitionMenuItem,
  isReportAndProcessMenuItem,
  mapMenuToProcessDefinitionButton,
  resolveMenuClickIntent,
} from "../menuItemDispatch";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";

const buildMenuItem = (overrides: Partial<ExtendedMenu>): ExtendedMenu => ({
  id: "MENU_ID",
  name: "Menu Name",
  ...overrides,
});

describe("menuItemDispatch", () => {
  describe("isProcessDefinitionMenuItem", () => {
    it("returns true when type is ProcessDefinition and id is set", () => {
      const item = buildMenuItem({ type: "ProcessDefinition" });
      expect(isProcessDefinitionMenuItem(item)).toBe(true);
    });

    it("returns false when type is not ProcessDefinition", () => {
      const item = buildMenuItem({ type: "Window" });
      expect(isProcessDefinitionMenuItem(item)).toBe(false);
    });

    it("returns false when id is missing", () => {
      const item = buildMenuItem({ type: "ProcessDefinition", id: "" });
      expect(isProcessDefinitionMenuItem(item)).toBe(false);
    });
  });

  describe("isReportAndProcessMenuItem", () => {
    it("returns true when type is Process and id is set", () => {
      const item = buildMenuItem({ type: "Process" });
      expect(isReportAndProcessMenuItem(item)).toBe(true);
    });

    it("returns false when type is not Process", () => {
      const item = buildMenuItem({ type: "ProcessDefinition" });
      expect(isReportAndProcessMenuItem(item)).toBe(false);
    });

    it("returns false when id is missing", () => {
      const item = buildMenuItem({ type: "Process", id: "" });
      expect(isReportAndProcessMenuItem(item)).toBe(false);
    });
  });

  describe("isPickAndExecuteMenuItem", () => {
    it("returns true when windowType is OBUIAPP_PickAndExecute", () => {
      const item = buildMenuItem({ windowType: "OBUIAPP_PickAndExecute" });
      expect(isPickAndExecuteMenuItem(item)).toBe(true);
    });

    it("returns false when windowType is M (standard maintain window)", () => {
      const item = buildMenuItem({ windowType: "M" });
      expect(isPickAndExecuteMenuItem(item)).toBe(false);
    });

    it("returns false when windowType is undefined", () => {
      const item = buildMenuItem({});
      expect(isPickAndExecuteMenuItem(item)).toBe(false);
    });
  });

  describe("mapMenuToProcessDefinitionButton", () => {
    it("returns null for non-process menu items", () => {
      const item = buildMenuItem({ type: "Window" });
      expect(mapMenuToProcessDefinitionButton(item)).toBeNull();
    });

    it("returns a button with the resolved processId for a Process Definition", () => {
      const item = buildMenuItem({
        id: "MENU_X",
        name: "Run X",
        type: "ProcessDefinition",
        processDefinitionId: "PROCESS_DEFINITION_X",
      });
      const button = mapMenuToProcessDefinitionButton(item);
      expect(button).not.toBeNull();
      expect(button?.id).toBe("MENU_X");
      expect(button?.processId).toBe("PROCESS_DEFINITION_X");
      expect(button?.name).toBe("Run X");
    });

    it("falls back to processId when processDefinitionId is missing", () => {
      const item = buildMenuItem({
        id: "MENU_Y",
        type: "Process",
        processId: "AD_PROCESS_Y",
      });
      const button = mapMenuToProcessDefinitionButton(item);
      expect(button?.processId).toBe("AD_PROCESS_Y");
    });

    it("falls back to the menu id when no processId nor processDefinitionId is present", () => {
      const item = buildMenuItem({
        id: "MENU_Z",
        type: "ProcessDefinition",
      });
      const button = mapMenuToProcessDefinitionButton(item);
      expect(button?.processId).toBe("MENU_Z");
    });

    it("propagates the description to processDefinition.description when present", () => {
      const item = buildMenuItem({
        id: "MENU_W",
        type: "ProcessDefinition",
        description: "Purges old log entries",
      });
      const button = mapMenuToProcessDefinitionButton(item);
      // biome-ignore lint/suspicious/noExplicitAny: minimal button shape, see dispatch util.
      expect((button as any)?.processDefinition?.description).toBe("Purges old log entries");
    });
  });

  describe("resolveMenuClickIntent", () => {
    it("returns a pick-and-execute intent when the menu entry targets a P&E window", () => {
      const item = buildMenuItem({
        id: "LOG_MGMT",
        type: "ProcessDefinition",
        windowType: "OBUIAPP_PickAndExecute",
        processDefinitionId: "LOG_MGMT_PROCESS",
      });
      const intent = resolveMenuClickIntent(item);
      expect(intent.kind).toBe(MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE);
      if (intent.kind === MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE) {
        expect(intent.button.processId).toBe("LOG_MGMT_PROCESS");
      }
    });

    it("returns a process-definition intent with PROCESS_DEFINITION type for a regular Process Definition", () => {
      const item = buildMenuItem({
        id: "PD_GENERIC",
        type: "ProcessDefinition",
        processDefinitionId: "PD_PROCESS",
      });
      const intent = resolveMenuClickIntent(item);
      expect(intent.kind).toBe(MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION);
      if (intent.kind === MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION) {
        expect(intent.processType).toBe(PROCESS_TYPES.PROCESS_DEFINITION);
        expect(intent.button.processId).toBe("PD_PROCESS");
      }
    });

    it("returns a process-definition intent with REPORT_AND_PROCESS type for a Process menu entry", () => {
      const item = buildMenuItem({
        id: "RP_GENERIC",
        type: "Process",
        processId: "AD_PROCESS_X",
      });
      const intent = resolveMenuClickIntent(item);
      expect(intent.kind).toBe(MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION);
      if (intent.kind === MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION) {
        expect(intent.processType).toBe(PROCESS_TYPES.REPORT_AND_PROCESS);
      }
    });

    it("prefers the P&E branch over the Process Definition branch when both apply", () => {
      const item = buildMenuItem({
        id: "PE_OVERRIDE",
        type: "ProcessDefinition",
        windowType: "OBUIAPP_PickAndExecute",
      });
      const intent = resolveMenuClickIntent(item);
      expect(intent.kind).toBe(MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE);
    });

    it("returns none for menu entries that are not process-like", () => {
      const item = buildMenuItem({ type: "Window" });
      const intent = resolveMenuClickIntent(item);
      expect(intent.kind).toBe(MENU_CLICK_INTENT_KINDS.NONE);
    });

    it("returns none when the resolved process button is null", () => {
      const item = buildMenuItem({ type: "ProcessDefinition", id: "" });
      const intent = resolveMenuClickIntent(item);
      expect(intent.kind).toBe(MENU_CLICK_INTENT_KINDS.NONE);
    });
  });
});
