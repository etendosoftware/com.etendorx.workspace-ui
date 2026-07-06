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

import { render, screen, fireEvent } from "@testing-library/react";
import BreadcrumbItem from "../index";
import type { BreadcrumbItemProps } from "../../types";

// useTheme is globally mocked by jest.setup.js — no ThemeProvider wrapper needed.

const baseProps: BreadcrumbItemProps = {
  item: { id: "item-1", label: "Window" },
  position: 0,
  breadcrumbsSize: 2,
  handleActionMenuOpen: jest.fn(),
  handleHomeNavigation: jest.fn(),
};

describe("BreadcrumbItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper: get the back arrow IconButton (not the MUI label Button)
  // When isFirst=true and isLast=false, both the IconButton and the MUI Button
  // carry aria-label="Go back". We target the IconButton by picking the first
  // button that does NOT have aria-current="page".
  const getBackArrowButton = () =>
    screen
      .getAllByRole("button", { name: "Go back" })
      .find((el) => el.getAttribute("aria-current") !== "page") as HTMLElement;

  describe("back arrow button (isFirst)", () => {
    it("renders the back arrow button for the first item", () => {
      render(<BreadcrumbItem {...baseProps} />);
      expect(getBackArrowButton()).toBeInTheDocument();
    });

    it("does not render the back arrow when position is not zero", () => {
      // position=1, breadcrumbsSize=2 means isLast=true, so it renders as Typography (no button)
      render(<BreadcrumbItem {...baseProps} position={1} breadcrumbsSize={2} />);
      expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
    });

    it("calls item.onClick when back arrow is clicked and breadcrumbsSize > 1 and item has onClick", () => {
      const itemOnClick = jest.fn();
      const handleHomeNavigation = jest.fn();
      render(
        <BreadcrumbItem
          {...baseProps}
          item={{ id: "item-1", label: "Window", onClick: itemOnClick }}
          breadcrumbsSize={2}
          handleHomeNavigation={handleHomeNavigation}
        />
      );
      fireEvent.click(getBackArrowButton());
      expect(itemOnClick).toHaveBeenCalledTimes(1);
      expect(handleHomeNavigation).not.toHaveBeenCalled();
    });

    it("calls handleHomeNavigation when breadcrumbsSize is 1 (single item — the routing fix)", () => {
      const handleHomeNavigation = jest.fn();
      const itemOnClick = jest.fn();
      render(
        <BreadcrumbItem
          {...baseProps}
          item={{ id: "item-1", label: "Window", onClick: itemOnClick }}
          breadcrumbsSize={1}
          handleHomeNavigation={handleHomeNavigation}
        />
      );
      // breadcrumbsSize=1 → isFirst=true, isLast=true → only IconButton renders, no ambiguity
      fireEvent.click(screen.getByRole("button", { name: "Go back" }));
      expect(handleHomeNavigation).toHaveBeenCalledTimes(1);
      expect(itemOnClick).not.toHaveBeenCalled();
    });

    it("calls handleHomeNavigation when breadcrumbsSize > 1 but item has no onClick", () => {
      const handleHomeNavigation = jest.fn();
      render(
        <BreadcrumbItem
          {...baseProps}
          item={{ id: "item-1", label: "Window" }}
          breadcrumbsSize={2}
          handleHomeNavigation={handleHomeNavigation}
        />
      );
      fireEvent.click(getBackArrowButton());
      expect(handleHomeNavigation).toHaveBeenCalledTimes(1);
    });
  });

  describe("last item rendering (isLast)", () => {
    it("renders item label as Typography for the last position", () => {
      render(<BreadcrumbItem {...baseProps} position={1} breadcrumbsSize={2} />);
      expect(screen.getByText("Window")).toBeInTheDocument();
    });

    it("calls item.onClick when the last-item label is clicked and item has onClick", () => {
      const itemOnClick = jest.fn();
      render(
        <BreadcrumbItem
          {...baseProps}
          position={1}
          breadcrumbsSize={2}
          item={{ id: "item-1", label: "Record", onClick: itemOnClick }}
        />
      );
      fireEvent.click(screen.getByText("Record"));
      expect(itemOnClick).toHaveBeenCalledTimes(1);
    });

    it("calls handleActionMenuOpen when the last-item has actions and its label is clicked", () => {
      const handleActionMenuOpen = jest.fn();
      const actions = [{ id: "a1", label: "Action 1", icon: <span /> }];
      render(
        <BreadcrumbItem
          {...baseProps}
          position={1}
          breadcrumbsSize={2}
          item={{ id: "item-1", label: "Record", actions }}
          handleActionMenuOpen={handleActionMenuOpen}
        />
      );
      fireEvent.click(screen.getByText("Record"));
      expect(handleActionMenuOpen).toHaveBeenCalledWith(expect.anything(), actions);
    });

    it("does not call any click handler when last item has neither onClick nor actions", () => {
      const handleActionMenuOpen = jest.fn();
      render(
        <BreadcrumbItem
          {...baseProps}
          position={1}
          breadcrumbsSize={2}
          item={{ id: "item-1", label: "Static" }}
          handleActionMenuOpen={handleActionMenuOpen}
        />
      );
      fireEvent.click(screen.getByText("Static"));
      expect(handleActionMenuOpen).not.toHaveBeenCalled();
    });
  });

  describe("non-last item rendering (Button)", () => {
    it("renders a Button with aria-label 'Go back' for a non-first, non-last item", () => {
      // position=1, breadcrumbsSize=3 → isFirst=false, isLast=(1===2)=false → renders Button only
      render(<BreadcrumbItem {...baseProps} position={1} breadcrumbsSize={3} />);
      // Only the MUI Button renders here (no IconButton), so getByRole is unambiguous
      const labelButton = screen.getByRole("button", { name: "Go back" });
      expect(labelButton).toBeInTheDocument();
      expect(labelButton).toHaveAttribute("aria-current", "page");
    });

    it("calls item.onClick when the non-last button is clicked", () => {
      const itemOnClick = jest.fn();
      render(
        <BreadcrumbItem
          {...baseProps}
          position={1}
          breadcrumbsSize={3}
          item={{ id: "item-2", label: "Middle", onClick: itemOnClick }}
        />
      );
      fireEvent.click(screen.getByText("Middle"));
      expect(itemOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("single-item breadcrumb (breadcrumbsSize === 1)", () => {
    it("shows both the back arrow and the label when the only item is at position 0", () => {
      render(<BreadcrumbItem {...baseProps} position={0} breadcrumbsSize={1} item={{ id: "item-1", label: "Home" }} />);
      expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });
});
