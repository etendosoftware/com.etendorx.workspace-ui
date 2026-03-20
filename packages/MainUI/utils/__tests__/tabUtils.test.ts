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

import { shouldShowTab } from "../tabUtils";

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
          ORDER_ID: {}
        }
      } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(true);
    });

    it("should show subtab based on field referencedEntity", () => {
      const tab = {
        tabLevel: 1,
        parentColumns: ["custom_field"],
        fields: {
          custom_field: { referencedEntity: "Order" }
        }
      } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(true);
    });

    it("should return false if no match is found", () => {
      const tab = {
        tabLevel: 1,
        parentColumns: ["MISMATCH"],
        fields: {}
      } as any;
      expect(shouldShowTab(tab, parentTab)).toBe(false);
    });
  });
});
