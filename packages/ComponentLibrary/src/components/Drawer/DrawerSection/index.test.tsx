import type React from "react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DrawerSection } from "./index";
import { DrawerHighlightContext } from "../DrawerHighlightContext";
import { MENU_COLLAPSED_ATTRIBUTE, MENU_ITEM_ID_ATTRIBUTE } from "../../../utils/drawerUtils";

describe("DrawerSection - optimistic selection (pendingWindowId)", () => {
  const baseItem = {
    id: "win-1",
    name: "Sales",
    type: "Window",
    windowId: "A123",
    children: [],
  } as const;

  const renderSection = (override?: Partial<React.ComponentProps<typeof DrawerSection>>) =>
    render(
      <DrawerSection
        item={baseItem as any}
        onClick={jest.fn()}
        open
        isSearchActive={false}
        onToggleExpand={jest.fn()}
        hasChildren={false}
        isExpandable={false}
        windowId={undefined}
        isExpanded={false}
        {...override}
      />
    );

  it("marks as selected when pendingWindowId matches item.windowId", () => {
    renderSection({ pendingWindowId: baseItem.windowId });
    const btn = screen.getByRole("button", { name: /Sales/ });
    expect(btn.className).toContain("bg-dynamic-main");
  });

  it("does not mark as selected when pendingWindowId does not match", () => {
    renderSection({ pendingWindowId: "OTHER" });
    const btn = screen.getByRole("button", { name: /Sales/ });
    // When not selected, it should not have the active style
    expect(btn.className).not.toContain("bg-dynamic-main");
  });
});

describe("DrawerSection - collapsed flyout scroll & hover", () => {
  jest.useFakeTimers();

  const itemWithChildren = {
    id: "win-parent",
    name: "Sales",
    type: "Window",
    windowId: undefined,
    children: [
      { id: "c1", name: "Child 1", type: "Window", windowId: "C1", children: [] },
      { id: "c2", name: "Child 2", type: "Window", windowId: "C2", children: [] },
    ],
  } as const;

  const renderCollapsed = (override?: Partial<React.ComponentProps<typeof DrawerSection>>) =>
    render(
      <DrawerSection
        item={itemWithChildren as any}
        onClick={jest.fn()}
        open={false}
        isSearchActive={false}
        onToggleExpand={jest.fn()}
        hasChildren
        isExpandable
        windowId={undefined}
        isExpanded={false}
        {...override}
      />
    );

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("opens the flyout with a visible auto-overflow scrollbar, not the old hidden-scrollbar classes", () => {
    renderCollapsed();
    const trigger = screen.getByTestId("MenuTitle__win-parent");
    const triggerRow = trigger.parentElement as HTMLElement;
    fireEvent.mouseEnter(triggerRow);

    const flyout = screen.getByText("Child 1").closest(".flyout-scrollbar");
    expect(flyout).toBeInTheDocument();
    expect(flyout).toHaveClass("overflow-y-auto");
    expect(flyout).toHaveClass("overscroll-contain");
    expect(flyout).not.toHaveClass("overflow-y-scroll");
    expect(flyout).not.toHaveClass("hide-scrollbar");
  });

  it("closes the flyout only 150ms after the mouse leaves the trigger", () => {
    renderCollapsed();
    const trigger = screen.getByTestId("MenuTitle__win-parent");
    const triggerRow = trigger.parentElement as HTMLElement;
    fireEvent.mouseEnter(triggerRow);
    expect(screen.getByText("Child 1")).toBeInTheDocument();

    fireEvent.mouseLeave(triggerRow);
    act(() => {
      jest.advanceTimersByTime(149);
    });
    expect(screen.queryByText("Child 1")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Child 1")).not.toBeInTheDocument();
  });

  it("cancels the pending close when re-entering the flyout content", () => {
    renderCollapsed();
    const trigger = screen.getByTestId("MenuTitle__win-parent");
    const triggerRow = trigger.parentElement as HTMLElement;
    fireEvent.mouseEnter(triggerRow);

    fireEvent.mouseLeave(triggerRow);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const flyoutContainer = screen.getByText("Child 1").closest(".flyout-scrollbar") as HTMLElement;
    fireEvent.mouseEnter(flyoutContainer);

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.getByText("Child 1")).toBeInTheDocument();
  });
});

describe("DrawerSection - keyboard navigation markers", () => {
  const parentItem = {
    id: "folder-1",
    name: "Sales",
    type: "Summary",
    children: [{ id: "win-1", name: "Sales Order", type: "Window", windowId: "W-1", children: [] }],
  } as unknown as Menu;

  const renderParent = (override?: Partial<React.ComponentProps<typeof DrawerSection>>) =>
    render(
      <DrawerSection
        item={parentItem}
        onClick={jest.fn()}
        open
        isSearchActive={false}
        onToggleExpand={jest.fn()}
        hasChildren
        isExpandable
        windowId={undefined}
        isExpanded={false}
        {...override}
      />
    );

  const childrenContainer = () => screen.getByText("Sales Order").closest(`[${MENU_COLLAPSED_ATTRIBUTE}]`);

  it("marks the children container while the section is collapsed", () => {
    renderParent();

    expect(childrenContainer()).toBeInTheDocument();
  });

  it("drops the marker once the section is expanded", () => {
    renderParent({ isExpanded: true });

    expect(childrenContainer()).toBeNull();
  });

  it("marks an expandable folder as navigable, so the arrows can reach and open it", () => {
    renderParent();

    expect(screen.getByTestId("MenuTitle__folder-1")).toHaveAttribute(MENU_ITEM_ID_ATTRIBUTE, "folder-1");
  });

  // During a search a folder can neither be collapsed nor opened, so it is not a stop.
  it("leaves a folder out of the navigation while a search is active", () => {
    renderParent({ isSearchActive: true, isExpandable: false });

    expect(screen.getByTestId("MenuTitle__folder-1")).not.toHaveAttribute(MENU_ITEM_ID_ATTRIBUTE);
  });

  it("does not highlight anything outside the highlight provider", () => {
    renderParent();

    expect(screen.getByTestId("MenuTitle__folder-1")).not.toHaveAttribute("data-highlighted");
  });

  it("highlights only the entry the provider points at", () => {
    render(
      <DrawerHighlightContext.Provider value={{ highlightedItemId: "folder-1" }}>
        <DrawerSection
          item={parentItem}
          onClick={jest.fn()}
          open
          isSearchActive={false}
          onToggleExpand={jest.fn()}
          hasChildren
          isExpandable
          isExpanded
          windowId={undefined}
        />
      </DrawerHighlightContext.Provider>
    );

    expect(screen.getByTestId("MenuTitle__folder-1")).toHaveAttribute("data-highlighted", "true");
    expect(screen.getByTestId("MenuTitle__win-1")).not.toHaveAttribute("data-highlighted");
  });
});
