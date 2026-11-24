/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { isTabHiddenByPreference, shouldShowTab, type TabWithParentInfo } from "../tabUtils";

describe("tabUtils", () => {
  describe("shouldShowTab", () => {
    const parentTab = {
      id: "parent-1",
      entityName: "Order",
      table$_identifier: "OrderTable",
      window: "win-1",
    } as any;

    it("should always show level 0 tabs", () => {
      const tab = { tabLevel: 0 } as any;
      expect(shouldShowTab(tab, null)).toBe(true);
    });

    it("should not show subtabs if no parent is active", () => {
      const tab = { tabLevel: 1 } as any;
      expect(shouldShowTab(tab, null)).toBe(false);
    });

    it("should show subtab if parentTabId matches activeParentTab ID", () => {
      const tab = { tabLevel: 1, parentTabId: "parent-1" } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(true);
    });

    it("should show subtab if parentColumns match activeParentTab entityName (case-insensitive)", () => {
      const tab = {
        tabLevel: 1,
        parentColumns: ["ORDER_ID"],
        fields: {
          ORDER_ID: {},
        },
      } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(true);
    });

    it("should show subtab based on field referencedEntity", () => {
      const tab = {
        tabLevel: 1,
        parentColumns: ["custom_field"],
        fields: {
          custom_field: { referencedEntity: "Order" },
        },
      } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(true);
    });

    it.each([
      ["leading underscores", "__order_id"],
      ["trailing underscores", "order___id"],
    ])("should match a parent column with %s after normalizing it", (_case, parentColumn) => {
      const tab = { tabLevel: 1, parentColumns: [parentColumn], fields: {} } as unknown as TabWithParentInfo;
      expect(shouldShowTab(tab, parentTab)).toBe(true);
    });

    it("should return false if no match is found", () => {
      const tab = {
        tabLevel: 1,
        parentColumns: ["MISMATCH"],
        fields: {},
      } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(false);
    });
  });

  describe("accounting and translation tabs", () => {
    const WINDOW_ID = "167";
    const asTab = (tab: Partial<TabWithParentInfo>) => tab as TabWithParentInfo;
    const parent = asTab({ id: "parent-1", window: WINDOW_ID, tabLevel: 0 });
    const accountingTab = asTab({ tabLevel: 1, parentTabId: "parent-1", window: WINDOW_ID, accountingTab: true });
    const translationTab = asTab({ tabLevel: 1, parentTabId: "parent-1", window: WINDOW_ID, translationTab: true });

    beforeEach(() => {
      installLocalStorageMock();
    });

    it("hides both kinds of tab when the preferences are not set, as classic does", () => {
      savePreferences({});
      expect(shouldShowTab(accountingTab, parent)).toBe(false);
      expect(shouldShowTab(translationTab, parent)).toBe(false);
    });

    it("shows each kind of tab only with its own preference set to Y", () => {
      savePreferences({ ShowAcct: "Y" });
      expect(shouldShowTab(accountingTab, parent)).toBe(true);
      expect(shouldShowTab(translationTab, parent)).toBe(false);

      savePreferences({ [`ShowTrl_${WINDOW_ID}`]: "Y" });
      expect(shouldShowTab(accountingTab, parent)).toBe(false);
      expect(shouldShowTab(translationTab, parent)).toBe(true);
    });

    it("hides the children of a hidden accounting tab", () => {
      savePreferences({ ShowAcct: "N" });
      const child = asTab({ tabLevel: 2, parentTabId: "acct-1", window: WINDOW_ID });
      expect(shouldShowTab(child, { ...accountingTab, id: "acct-1" })).toBe(false);
    });

    it("never hides a regular tab", () => {
      savePreferences({});
      expect(isTabHiddenByPreference(asTab({ window: WINDOW_ID }))).toBe(false);
    });
  });
});
