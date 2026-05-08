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

// Helper: get the back-arrow IconButton specifically (not the MUI label Button which
// also carries aria-label="Go back" when not the last item).
const getBackArrowButton = () =>
  screen
    .getAllByRole("button", { name: "Go back" })
    .find((el) => el.getAttribute("aria-current") !== "page") as HTMLElement;

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
    // All items are always rendered directly — no overflow menu
    expect(screen.getByText("Label 0")).toBeInTheDocument();
    expect(screen.getByText("Label 1")).toBeInTheDocument();
    expect(screen.getByText("Label 2")).toBeInTheDocument();
    expect(screen.getByText("Label 3")).toBeInTheDocument();
    expect(screen.getByText("Label 4")).toBeInTheDocument();
  });

  it("does not render a collapse button or ellipsis for long lists", () => {
    render(
      <BreadcrumbList
        items={makeItems(6)}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    );
    // All labels visible — no overflow menu collapses anything
    expect(screen.getByText("Label 0")).toBeInTheDocument();
    expect(screen.getByText("Label 1")).toBeInTheDocument();
    expect(screen.getByText("Label 2")).toBeInTheDocument();
    expect(screen.getByText("Label 3")).toBeInTheDocument();
    expect(screen.getByText("Label 4")).toBeInTheDocument();
    expect(screen.getByText("Label 5")).toBeInTheDocument();
    // No ellipsis text in the DOM
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
    // With 3 items, all rendered linearly:
    // index 0 (isFirst=true, isLast=false): IconButton "Go back" + MUI Button "Go back" aria-current="page"
    // index 1 (isFirst=false, isLast=false): MUI Button "Go back" aria-current="page" only
    // index 2 (isFirst=false, isLast=true): Typography only, no button
    // Total "Go back" buttons: 3 (1 IconButton + 2 MUI Buttons)
    const backButtons = screen.getAllByRole("button", { name: "Go back" });
    expect(backButtons).toHaveLength(3);

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
    // All items are always rendered directly — simplified component never collapses
    expect(screen.getByText("Sales Window")).toBeInTheDocument();
    expect(screen.getByText("Order #123")).toBeInTheDocument();
    expect(screen.getByText("Order Line")).toBeInTheDocument();
  });

  describe("afterFirstItem slot", () => {
    const SLOT_TESTID = "after-first-slot";
    const renderWithSlot = (count: number) =>
      render(
        <BreadcrumbList
          items={makeItems(count)}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
          afterFirstItem={<span data-testid={SLOT_TESTID}>★</span>}
        />
      );

    it("renders the slot exactly once when items.length === 1", () => {
      renderWithSlot(1);
      expect(screen.getAllByTestId(SLOT_TESTID)).toHaveLength(1);
    });

    it("renders the slot exactly once when items.length === 2", () => {
      renderWithSlot(2);
      expect(screen.getAllByTestId(SLOT_TESTID)).toHaveLength(1);
    });

    it("renders the slot exactly once when items.length > 2 (overflow path)", () => {
      renderWithSlot(4);
      expect(screen.getAllByTestId(SLOT_TESTID)).toHaveLength(1);
    });

    it("does not render the slot when afterFirstItem is omitted", () => {
      render(
        <BreadcrumbList
          items={makeItems(4)}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
        />
      );
      expect(screen.queryByTestId(SLOT_TESTID)).not.toBeInTheDocument();
    });
  });

  describe("onBackClick wiring", () => {
    // Regression: the level-0 form-mode bug was caused by BreadcrumbList NOT forwarding
    // onBackClick to BreadcrumbItem in the items.length<=2 branch — the back arrow then
    // fell through to item.onClick (window-title click) or handleHomeNavigation, which
    // never cleared the form state. Both branches MUST forward onBackClick.

    it.each([
      ["1 item (no records)", 1],
      ["2 items (1 record)", 2],
      ["4 items (overflow path)", 4],
    ])("forwards onBackClick to the back arrow with %s", (_label, count) => {
      const onBackClick = jest.fn();
      const itemOnClick = jest.fn();
      const items = makeItems(count).map((it, i) => (i === 0 ? { ...it, onClick: itemOnClick } : it));

      render(
        <BreadcrumbList
          items={items}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
          onBackClick={onBackClick}
        />
      );

      fireEvent.click(getBackArrowButton());

      expect(onBackClick).toHaveBeenCalledTimes(1);
      expect(itemOnClick).not.toHaveBeenCalled();
      expect(handleHomeNavigation).not.toHaveBeenCalled();
    });
  });
});
