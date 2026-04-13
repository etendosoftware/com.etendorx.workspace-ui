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

import { render, screen } from "@testing-library/react";
import BreadcrumbList from "../index";
import type { BreadcrumbItem } from "../../types";

// useTheme is globally mocked by jest.setup.js — no ThemeProvider wrapper needed.

const handleActionMenuOpen = jest.fn();
const handleHomeNavigation = jest.fn();

const makeItems = (count: number): BreadcrumbItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    label: `Label ${i}`,
  }));

describe("BreadcrumbList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when items array is empty", () => {
    const { container } = render(
      <BreadcrumbList
        items={[]}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("renders a single item when the list has one entry", () => {
    render(
      <BreadcrumbList
        items={makeItems(1)}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    expect(screen.getByText("Label 0")).toBeInTheDocument();
  });

  it("renders all items when the list has two entries", () => {
    render(
      <BreadcrumbList
        items={makeItems(2)}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    expect(screen.getByText("Label 0")).toBeInTheDocument();
    expect(screen.getByText("Label 1")).toBeInTheDocument();
  });

  it("renders only first and last items visibly for five entries; middle three are in the overflow menu", () => {
    const items = makeItems(5);
    render(
      <BreadcrumbList
        items={items}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    // First and last are always rendered directly
    expect(screen.getByText("Label 0")).toBeInTheDocument();
    expect(screen.getByText("Label 4")).toBeInTheDocument();
    // Middle items (Label 1, Label 2, Label 3) are hidden inside the closed overflow Menu
    expect(screen.queryByText("Label 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Label 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Label 3")).not.toBeInTheDocument();
  });

  it("does not render a collapse button or ellipsis for long lists", () => {
    render(
      <BreadcrumbList
        items={makeItems(6)}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    // The old implementation replaced middle items with "…" — verify it is gone
    expect(screen.queryByText("…")).not.toBeInTheDocument();
    expect(screen.queryByText("...")).not.toBeInTheDocument();
  });

  it("passes correct position index to each item (first item gets back-arrow)", () => {
    render(
      <BreadcrumbList
        items={makeItems(3)}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    // BreadcrumbList with 3+ items renders: first item + ellipsis menu button + last item.
    // BreadcrumbItem for first item (position=0, isFirst=true, isLast=false):
    //   → IconButton aria-label="Go back" (back-arrow) + MUI Button aria-label="Go back" (label)
    // Middle items are hidden in a Menu (not rendered as direct buttons).
    // Last item (position=2, isLast=true) → Typography only, no button.
    // Total "Go back" buttons: 2 (IconButton + first-item MUI Button)
    const backButtons = screen.getAllByRole("button", { name: "Go back" });
    expect(backButtons).toHaveLength(2);

    // The IconButton (back-arrow) is the one without aria-current="page"
    const iconButton = backButtons.find((el) => el.getAttribute("aria-current") !== "page");
    expect(iconButton).toBeInTheDocument();
  });

  it("renders the last item as non-interactive Typography (no button) when it has no onClick", () => {
    render(
      <BreadcrumbList
        items={makeItems(3)}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    // "Label 2" is the last item — it renders as Typography, not a Button
    const lastLabel = screen.getByText("Label 2");
    expect(lastLabel.closest("button")).toBeNull();
  });

  it("renders first and last items visibly; middle items are hidden in an overflow menu", () => {
    const items: BreadcrumbItem[] = [
      { id: "win", label: "Sales Window" },
      { id: "rec", label: "Order #123" },
      { id: "sub", label: "Order Line" },
    ];
    render(
      <BreadcrumbList
        items={items}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    // BreadcrumbList collapses middle items behind an ellipsis Menu for 3+ items.
    // First and last labels are rendered directly; middle item is in a closed Menu (not visible).
    expect(screen.getByText("Sales Window")).toBeInTheDocument();
    expect(screen.getByText("Order Line")).toBeInTheDocument();
    // "Order #123" is a middle item — it lives inside a closed MUI Menu, not in the visible DOM.
    expect(screen.queryByText("Order #123")).not.toBeInTheDocument();
  });
});
