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

import { getButtonShapeClassName, getSectionClassName } from "../index";

jest.mock("../../../../hooks/useRecentItems", () => ({ useRecentItems: jest.fn() }));
jest.mock("../../../../hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("RecentlyViewed layout", () => {
  it("adds no side padding to the open section, so it lines up with the menu", () => {
    expect(getSectionClassName(true)).toBe("py-2 rounded-lg");
  });

  it("keeps the padding of the collapsed rail", () => {
    expect(getSectionClassName(false)).toBe("p-2 rounded-lg");
  });

  it("uses the 16px side padding of a top-level menu entry when open", () => {
    expect(getButtonShapeClassName(true)).toContain("px-4");
  });

  it("keeps the round rail button when collapsed", () => {
    expect(getButtonShapeClassName(false)).toBe("p-2.5 rounded-full justify-center");
  });
});
