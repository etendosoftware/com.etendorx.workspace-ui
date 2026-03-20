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

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubTabsSwitch } from "../SubTabsSwitch";

// Mocks
jest.mock("../TabButton", () => ({
  TabButton: ({ tab, onClick, active }: any) => (
    <button data-testid={`tab-${tab.id}`} onClick={() => onClick(tab)} data-active={active}>
      {tab.name}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/components", () => ({
  IconButton: ({ children, "data-testid": testId }: any) => <div data-testid={testId}>{children}</div>,
}));

jest.mock("../../../ComponentLibrary/src/assets/icons/chevron-down.svg", () => {
  return ({ onClick, "data-testid": testId }: any) => <div data-testid={testId} onClick={onClick}>Chevron</div>;
});

describe("SubTabsSwitch", () => {
  const mockTabs = [
    { id: "tab1", name: "Tab 1" },
    { id: "tab2", name: "Tab 2" },
  ];
  const mockCurrent = mockTabs[0];
  const mockOnClick = jest.fn();
  const mockOnDoubleClick = jest.fn();

  it("should render tabs correctly", () => {
    render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    expect(screen.getByTestId("tab-tab1")).toBeInTheDocument();
    expect(screen.getByTestId("tab-tab2")).toBeInTheDocument();
  });

  it("should mark the active tab", () => {
    render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab2"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    expect(screen.getByTestId("tab-tab1")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("tab-tab2")).toHaveAttribute("data-active", "true");
  });

  it("should call onClick when a tab is clicked", () => {
    render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    fireEvent.click(screen.getByTestId("tab-tab2"));
    expect(mockOnClick).toHaveBeenCalledWith(mockTabs[1]);
  });

  it("should call handle collapse/expand icons", () => {
    const { rerender } = render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={true}
        isExpanded={false}
      />
    );

    const chevron = screen.getByTestId("ChevronDown__tab1");
    fireEvent.click(chevron);
    // When collapsed is true, click calls onClick
    expect(mockOnClick).toHaveBeenCalledWith(mockCurrent);

    rerender(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    fireEvent.click(chevron);
    // When collapsed is false, click calls onDoubleClick
    expect(mockOnDoubleClick).toHaveBeenCalledWith(mockCurrent);
  });
});
