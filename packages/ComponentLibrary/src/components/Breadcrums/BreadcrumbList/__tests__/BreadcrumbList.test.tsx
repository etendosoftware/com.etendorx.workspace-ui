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

  it("renders all items when the list has five entries — no collapse or ellipsis", () => {
    const items = makeItems(5);
    render(
      <BreadcrumbList
        items={items}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
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
    // BreadcrumbItem renders:
    //   position=0, size=3: isFirst=true, isLast=false → IconButton + non-last MUI Button (2 "Go back")
    //   position=1, size=3: isFirst=false, isLast=false → 1 MUI Button "Go back"
    //   position=2, size=3: isFirst=false, isLast=true → Typography only (0 buttons)
    // Total "Go back" buttons: 3
    const backButtons = screen.getAllByRole("button", { name: "Go back" });
    expect(backButtons).toHaveLength(3);

    // Only the first item's IconButton lacks aria-current="page"
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

  it("renders items in the correct visual order", () => {
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
    const allText = screen.getAllByText(/Sales Window|Order #123|Order Line/);
    // MUI Breadcrumbs renders items in document order; verify label sequence
    const labels = allText.map((el) => el.textContent);
    expect(labels).toEqual(["Sales Window", "Order #123", "Order Line"]);
  });
});
