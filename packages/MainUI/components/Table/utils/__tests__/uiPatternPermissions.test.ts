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

import { UIPattern } from "@workspaceui/api-client/src/api/types";
import { isRecordCreationBlocked, isRecordEditionBlocked } from "../uiPatternPermissions";

describe("uiPatternPermissions", () => {
  it.each([UIPattern.READ_ONLY, UIPattern.EDIT_ONLY, UIPattern.EDIT_AND_DELETE_ONLY])(
    "blocks record creation on %s tabs",
    (pattern) => {
      expect(isRecordCreationBlocked(pattern)).toBe(true);
    }
  );

  it.each([UIPattern.STANDARD, undefined])("allows record creation on %s tabs", (pattern) => {
    expect(isRecordCreationBlocked(pattern)).toBe(false);
  });

  it("blocks record edition only on read-only tabs", () => {
    expect(isRecordEditionBlocked(UIPattern.READ_ONLY)).toBe(true);
    expect(isRecordEditionBlocked(UIPattern.EDIT_ONLY)).toBe(false);
    expect(isRecordEditionBlocked()).toBe(false);
  });
});
