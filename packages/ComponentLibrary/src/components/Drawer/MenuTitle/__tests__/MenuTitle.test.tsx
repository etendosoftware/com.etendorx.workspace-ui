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
