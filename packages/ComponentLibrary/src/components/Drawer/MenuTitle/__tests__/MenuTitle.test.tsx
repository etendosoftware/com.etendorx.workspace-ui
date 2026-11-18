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
import { render, screen } from "@testing-library/react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { MenuTitle } from "../index";
import { DEFAULT_B64, EXTERNAL_LINK_B64 } from "../constants";
import { DrawerHighlightContext } from "../../DrawerHighlightContext";
import { MENU_ROW_SHAPE_CLASSES, getMenuButtonClassName } from "../index";
import { MENU_ICON_SLOT_OPEN_CLASS, getMenuRowIndentStyle } from "../../spacing";

const SVG_PREFIX = "data:image/svg+xml;base64,";

const renderIcon = (overrides: Partial<Menu>) => {
  const item: Menu = { id: "MENU_ID", name: "Menu Name", ...overrides };
  render(<MenuTitle item={item} onClick={jest.fn()} open />);
  return screen.getByRole("img");
};

describe("MenuTitle icon", () => {
  it("shows the external-link icon for External entries", () => {
    expect(renderIcon({ type: "External" })).toHaveAttribute("src", `${SVG_PREFIX}${EXTERNAL_LINK_B64}`);
  });

  it("keeps the backend icon over the External default", () => {
    expect(renderIcon({ type: "External", icon: "CUSTOM" })).toHaveAttribute("src", `${SVG_PREFIX}CUSTOM`);
  });

  it("keeps the default icon for windows", () => {
    expect(renderIcon({ type: "Window" })).toHaveAttribute("src", `${SVG_PREFIX}${DEFAULT_B64}`);
  });
});

const WINDOW_ITEM: Menu = { id: "WIN_ID", name: "Sales Order", type: "Window", windowId: "W1" };
const TITLE_TEST_ID = "MenuTitle__WIN_ID";

/** Renders a window entry, optionally highlighted by the keyboard navigation. */
const renderEntry = (props: { selected?: boolean; depth?: number; highlighted?: boolean } = {}) => {
  const { highlighted = false, ...rest } = props;
  render(
    <DrawerHighlightContext.Provider value={{ highlightedItemId: highlighted ? WINDOW_ITEM.id : null }}>
      <MenuTitle item={WINDOW_ITEM} onClick={jest.fn()} open {...rest} />
    </DrawerHighlightContext.Provider>
  );
  return screen.getByTestId(TITLE_TEST_ID);
};

describe("MenuTitle layout", () => {
  it.each([
    [0, "0.5rem"],
    [1, "1rem"],
    [2, "1.5rem"],
  ])("indents an entry at depth %s on the left only (%s)", (depth, padding) => {
    const entry = renderEntry({ depth });

    expect(entry).toHaveStyle({ paddingLeft: padding });
    expect(entry).toHaveClass(...MENU_ROW_SHAPE_CLASSES.split(" "));
  });

  it("uses the same rounded shape and right padding at every level", () => {
    expect(getMenuButtonClassName(true)).toContain(MENU_ROW_SHAPE_CLASSES);
    expect(getMenuRowIndentStyle(0)).toEqual({ paddingLeft: "0.5rem" });
  });

  it("fits the icon slot to the 20px icon, with no extra space around it", () => {
    const icon = renderEntry().querySelector("img");

    expect(icon?.parentElement?.parentElement).toHaveClass(MENU_ICON_SLOT_OPEN_CLASS);
  });

  it("leaves a gap between a long label and the chevron", () => {
    expect(renderEntry()).toHaveClass("gap-2");
  });
});

describe("MenuTitle keyboard highlight", () => {
  it("paints the highlighted entry like a hovered one", () => {
    expect(renderEntry({ highlighted: true })).toHaveClass("bg-(--ui-hover)");
  });

  it("keeps only the selected style on the open window", () => {
    const title = renderEntry({ highlighted: true, selected: true });

    expect(title).toHaveClass("bg-(--ui-selected-bg)");
    expect(title).not.toHaveClass("bg-(--ui-hover)");
  });
});
