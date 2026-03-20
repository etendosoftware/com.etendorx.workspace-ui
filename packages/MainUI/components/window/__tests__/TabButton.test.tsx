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
import { TabButton } from "../TabButton";
import { useMetadataContext } from "@/hooks/useMetadataContext";

// Mocks
jest.mock("@/hooks/useMetadataContext");

describe("TabButton", () => {
  const mockTab = {
    id: "tab1",
    name: "Tab Name",
    title: "Tab Title",
    tabLevel: 1,
  };
  const mockOnClick = jest.fn();
  const mockOnDoubleClick = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useMetadataContext as jest.Mock).mockReturnValue({ window: { name: "Window Name" } });
  });

  it("should render the tab name when tabLevel > 0", () => {
    render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    expect(screen.getByText("Tab Name")).toBeInTheDocument();
  });

  it("should render the window name when tabLevel === 0", () => {
    const rootTab = { ...mockTab, tabLevel: 0 };
    render(<TabButton tab={rootTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    expect(screen.getByText("Window Name")).toBeInTheDocument();
  });

  it("should render the tab title when isWindow is true", () => {
    render(
      <TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} isWindow={true} />
    );
    expect(screen.getByText("Tab Title")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledWith(mockTab);
  });

  it("should call onDoubleClick when double clicked", () => {
    render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    fireEvent.doubleClick(screen.getByRole("button"));
    expect(mockOnDoubleClick).toHaveBeenCalledWith(mockTab);
  });

  it("should show close button when isWindow and canClose are true", () => {
    render(
      <TabButton
        tab={mockTab}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        active={false}
        isWindow={true}
        canClose={true}
        onClose={mockOnClose}
      />
    );
    const closeButton = screen.getByTitle("Cerrar ventana");
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should return null if no title is resolved", () => {
    (useMetadataContext as jest.Mock).mockReturnValue({ window: null });
    const { container } = render(
      <TabButton
        tab={{ ...mockTab, tabLevel: 0, name: "", title: "" }}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        active={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
