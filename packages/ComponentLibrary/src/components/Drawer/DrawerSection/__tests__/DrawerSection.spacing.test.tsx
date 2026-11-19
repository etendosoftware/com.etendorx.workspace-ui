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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import { render, screen } from "@testing-library/react";
import { DrawerSection } from "../index";
import { SIDEBAR_GUTTER_CLASS } from "../../spacing";

const TREE: Menu = {
  id: "ROOT",
  name: "Sales Management",
  type: "Folder",
  children: [{ id: "CHILD", name: "Sales Order", type: "Window", windowId: "W1" }],
} as Menu;

const renderTree = () =>
  render(
    <DrawerSection
      item={TREE}
      onClick={jest.fn()}
      open
      onToggleExpand={jest.fn()}
      hasChildren
      isExpanded
      isExpandable
      isSearchActive={false}
    />
  );

describe("DrawerSection spacing", () => {
  it("gives only the top-level section the sidebar gutter", () => {
    renderTree();

    const root = screen.getByTestId("MenuTitle__ROOT").parentElement as HTMLElement;
    const child = screen.getByTestId("MenuTitle__CHILD").parentElement as HTMLElement;
    expect(root).toHaveClass(SIDEBAR_GUTTER_CLASS);
    expect(child).not.toHaveClass(SIDEBAR_GUTTER_CLASS);
  });

  it("indents a child one level on the left", () => {
    renderTree();

    expect(screen.getByTestId("MenuTitle__ROOT")).toHaveStyle({ paddingLeft: "0.5rem" });
    expect(screen.getByTestId("MenuTitle__CHILD")).toHaveStyle({ paddingLeft: "1rem" });
  });
});
