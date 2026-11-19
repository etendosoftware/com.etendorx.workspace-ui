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

import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import SearchPortal from "../index";

jest.mock("@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete", () => ({
  __esModule: true,
  default: () => <input aria-label="search" />,
}));

/** Toolbar row stub with a fixed bounding box. */
const buildAnchor = () => {
  const anchor = document.createElement("div");
  anchor.getBoundingClientRect = () => ({ bottom: 140, right: 1000 }) as DOMRect;
  return anchor;
};

const renderPortal = (anchorEl?: HTMLElement | null) =>
  render(
    <ThemeProvider theme={theme}>
      <SearchPortal isOpen searchValue="" onSearchChange={jest.fn()} onClose={jest.fn()} anchorEl={anchorEl} />
    </ThemeProvider>
  );

describe("SearchPortal placement", () => {
  it("opens under the toolbar row it belongs to", () => {
    renderPortal(buildAnchor());

    const box = screen.getByLabelText("search").parentElement as HTMLElement;
    expect(box).toHaveStyle({ top: "144px", right: `${window.innerWidth - 1000}px` });
  });

  it("keeps its fixed place when no toolbar row is given", () => {
    renderPortal(null);

    const box = screen.getByLabelText("search").parentElement as HTMLElement;
    expect(box).toHaveStyle({ top: "5.5rem" });
  });
});
