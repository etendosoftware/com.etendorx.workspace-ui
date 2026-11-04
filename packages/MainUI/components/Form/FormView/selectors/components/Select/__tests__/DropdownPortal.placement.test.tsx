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

import { render } from "@testing-library/react";
import DropdownPortal from "../DropdownPortal";

jest.mock("@/utils/form/keyboard", () => ({ DROPDOWN_PORTAL_ATTRIBUTE: "data-dropdown-portal" }));

// A field near the bottom of the viewport: little room below, plenty above.
const viewportData = { triggerTop: 600, triggerBottom: 630, left: 10, width: 200, spaceAbove: 600, spaceBelow: 20 };

const renderPortal = (content: React.ReactNode) => (
  <DropdownPortal
    isOpen
    viewportData={viewportData}
    searchTerm=""
    searchInputRef={{ current: null }}
    handleSetSearchTerm={jest.fn()}
    handleKeyDown={jest.fn()}
    handleSearchBlur={jest.fn()}
    handleFocus={jest.fn()}
    listRef={{ current: null }}
    handleScroll={jest.fn()}
    renderedOptions={content}
    dropdownId="dropdown-product"
  />
);

describe("DropdownPortal placement", () => {
  const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
  let contentHeight = 10;

  beforeEach(() => {
    contentHeight = 10;
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => contentHeight });
  });

  afterEach(() => {
    if (originalScrollHeight) Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
  });

  const portal = () => document.querySelector("[data-dropdown-portal]") as HTMLElement;

  it("stays below while the content fits", () => {
    render(renderPortal(<li>Loading...</li>));
    expect(portal().style.transform).toBe("");
  });

  it("moves above when the options arrive and no longer fit below", () => {
    const { rerender } = render(renderPortal(<li>Loading...</li>));
    expect(portal().style.transform).toBe("");

    contentHeight = 250;
    rerender(renderPortal(<li>BOM Product</li>));

    expect(portal().style.transform).toBe("translateY(-100%)");
  });
});
