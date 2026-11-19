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

import { MENU_ROW_SHAPE_CLASSES } from "@workspaceui/componentlibrary/src/components/Drawer/MenuTitle";
import { SIDEBAR_GUTTER_CLASS } from "@workspaceui/componentlibrary/src/components/Drawer/spacing";
import {
  RECENT_CHIPS_CLASSES,
  RECENT_CHIP_SHAPE_CLASSES,
  getButtonShapeClassName,
  getSectionClassName,
} from "../index";

jest.mock("../../../../hooks/useRecentItems", () => ({ useRecentItems: jest.fn() }));
jest.mock("../../../../hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("RecentlyViewed layout", () => {
  it("takes the sidebar gutter when open, like a top-level menu section", () => {
    expect(getSectionClassName(true)).toContain(SIDEBAR_GUTTER_CLASS);
  });

  it("uses compact chips that end in an ellipsis when a name is longer than the sidebar", () => {
    expect(RECENT_CHIP_SHAPE_CLASSES).toContain("text-xs");
    expect(RECENT_CHIP_SHAPE_CLASSES).toContain("truncate");
  });

  it("starts the chips on the column of the menu icons and wraps them inside it", () => {
    expect(RECENT_CHIPS_CLASSES).toContain("pl-2");
    expect(RECENT_CHIPS_CLASSES).toContain("flex-wrap");
    expect(RECENT_CHIPS_CLASSES).not.toMatch(/\b(pl-4|w-full)\b/);
  });

  it("keeps the padding of the collapsed rail", () => {
    expect(getSectionClassName(false)).toBe("p-2 rounded-lg");
  });

  it("uses the shape and padding of a menu entry when open", () => {
    expect(getButtonShapeClassName(true)).toBe(MENU_ROW_SHAPE_CLASSES);
  });

  it("keeps the round rail button when collapsed", () => {
    expect(getButtonShapeClassName(false)).toBe("p-2.5 rounded-full justify-center");
  });
});
