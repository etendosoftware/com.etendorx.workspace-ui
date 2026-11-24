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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { decideFilterMessage, FILTER_MESSAGE, type FilterMessageState, isFilterMessageEnabled } from "../filterMessage";

const IMPLICIT_PREFERENCE = "OBUIAPP_ShowImplicitFilterMsg";
const SINGLE_RECORD_PREFERENCE = "OBUIAPP_ShowSingleRecordFilterMsg";

const state = (overrides: Partial<FilterMessageState> = {}): FilterMessageState => ({
  isGridVisible: true,
  isDirectLink: false,
  isImplicitFilterApplied: true,
  implicitFilterMessage: "This grid is filtered using an implicit filter.",
  hasParentSelection: true,
  ...overrides,
});

describe("filterMessage", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({});
  });

  describe("decideFilterMessage", () => {
    it("shows the implicit filter message while the default filter is applied", () => {
      expect(decideFilterMessage(state())).toBe(FILTER_MESSAGE.IMPLICIT);
    });

    it("shows the single-record message for a grid opened from a link", () => {
      expect(decideFilterMessage(state({ isDirectLink: true }))).toBe(FILTER_MESSAGE.SINGLE_RECORD);
    });

    it.each<[string, Partial<FilterMessageState>]>([
      ["the form is on screen", { isGridVisible: false, isDirectLink: true }],
      ["the default filter was removed", { isImplicitFilterApplied: false }],
      ["the tab has no default filter", { implicitFilterMessage: "" }],
      ["the parent has no record", { hasParentSelection: false }],
    ])("shows nothing when %s", (_case, overrides) => {
      expect(decideFilterMessage(state(overrides))).toBeNull();
    });

    it("respects the preferences that turn each message off", () => {
      savePreferences({ [IMPLICIT_PREFERENCE]: "N", [SINGLE_RECORD_PREFERENCE]: '"N"' });
      expect(decideFilterMessage(state())).toBeNull();
      expect(decideFilterMessage(state({ isDirectLink: true }))).toBeNull();
    });
  });

  describe("isFilterMessageEnabled", () => {
    it("is enabled without the preference or with any value other than N", () => {
      expect(isFilterMessageEnabled(FILTER_MESSAGE.IMPLICIT)).toBe(true);
      savePreferences({ [IMPLICIT_PREFERENCE]: "Y" });
      expect(isFilterMessageEnabled(FILTER_MESSAGE.IMPLICIT)).toBe(true);
    });
  });
});
