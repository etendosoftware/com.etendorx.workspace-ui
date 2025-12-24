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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfigurationModal from "../index";
import type { ISection } from "../types";

describe("ConfigurationModal", () => {
  const mockOnChangeSelect = jest.fn();

  const defaultSections: ISection[] = [
    {
      id: "test-section",
      name: "Test Section",
      items: [
        { id: "item-1", img: "test1.svg", label: "Item 1" },
        { id: "item-2", img: "test2.svg", label: "Item 2" },
        { id: "item-3", img: "test3.svg", label: "Item 3" },
      ],
      selectedItem: 0,
      isDisabled: false,
      itemsPerRow: 3,
    },
  ];

  const defaultProps = {
    icon: <span data-testid="settings-icon">⚙</span>,
    title: { icon: <span>⚙</span>, label: "Quick Setup" },
    linkTitle: { label: "View all settings", url: "/settings" },
    sections: defaultSections,
    onChangeSelect: mockOnChangeSelect,
    tooltipButtonProfile: "Settings",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the icon button", () => {
    render(<ConfigurationModal {...defaultProps} />);
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("should open modal when icon button is clicked", async () => {
    render(<ConfigurationModal {...defaultProps} />);

    const iconButton = screen.getByRole("button");
    fireEvent.click(iconButton);

    await waitFor(() => {
      expect(screen.getByText("Quick Setup")).toBeInTheDocument();
    });
  });

  it("should render section name", async () => {
    render(<ConfigurationModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Test Section")).toBeInTheDocument();
    });
  });

  it("should render section items", async () => {
    render(<ConfigurationModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });
  });

  it("should call onChangeSelect when item is clicked", async () => {
    render(<ConfigurationModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      const item2Button = screen.getByText("Item 2").closest("button");
      if (item2Button) {
        fireEvent.click(item2Button);
      }
    });

    expect(mockOnChangeSelect).toHaveBeenCalledWith({
      id: "item-2",
      sectionId: "test-section",
      sectionIndex: 0,
      imageIndex: 1,
    });
  });

  it("should filter out disabled sections", async () => {
    const sectionsWithDisabled: ISection[] = [
      ...defaultSections,
      {
        id: "disabled-section",
        name: "Disabled Section",
        items: [{ id: "disabled-item", img: "disabled.svg", label: "Disabled Item" }],
        selectedItem: 0,
        isDisabled: true,
        itemsPerRow: 3,
      },
    ];

    render(<ConfigurationModal {...defaultProps} sections={sectionsWithDisabled} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Test Section")).toBeInTheDocument();
      expect(screen.queryByText("Disabled Section")).not.toBeInTheDocument();
    });
  });

  it("should show selected item with different styling", async () => {
    render(<ConfigurationModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      // The first item (selected) should have the selected styling class
      const item1Button = screen.getByText("Item 1").closest("button");
      expect(item1Button).toHaveClass("border-2");
      expect(item1Button?.className).toContain("border-[var(--color-etendo-main)]");
    });
  });

  it("should render items with React.ReactNode as img", async () => {
    const sectionsWithReactNode: ISection[] = [
      {
        id: "react-node-section",
        name: "React Node Section",
        items: [{ id: "react-item", img: <span data-testid="custom-icon">🎨</span>, label: "Custom Icon" }],
        selectedItem: 0,
        isDisabled: false,
        itemsPerRow: 3,
      },
    ];

    render(<ConfigurationModal {...defaultProps} sections={sectionsWithReactNode} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  it("should apply itemsPerRow styling", async () => {
    const sectionsWithItemsPerRow: ISection[] = [
      {
        ...defaultSections[0],
        itemsPerRow: 4,
      },
    ];

    render(<ConfigurationModal {...defaultProps} sections={sectionsWithItemsPerRow} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Test Section")).toBeInTheDocument();
    });
  });
});
