import type React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DrawerSection } from "./index";

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

describe("DrawerSection - collapsed flyout menu", () => {
  const buildParentWithChildren = (childCount: number) => ({
    id: "sales",
    name: "Sales",
    type: "Window",
    windowId: undefined,
    children: Array.from({ length: childCount }, (_, i) => ({
      id: `sales-child-${i}`,
      name: `Sales child ${i}`,
      type: "Window",
      windowId: `W${i}`,
      children: [],
    })),
  });

  const renderCollapsed = (childCount = 20) =>
    render(
      <DrawerSection
        item={buildParentWithChildren(childCount) as any}
        onClick={jest.fn()}
        open={false}
        isSearchActive={false}
        onToggleExpand={jest.fn()}
        hasChildren
        isExpandable
        windowId={undefined}
        isExpanded={false}
      />
    );

  const openFlyout = () => {
    const trigger = screen.getByTestId("MenuTitle__sales").parentElement as HTMLElement;
    fireEvent.mouseEnter(trigger);
    act(() => {
      jest.advanceTimersByTime(0);
    });
    return trigger;
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders the flyout with a scrollable, visible-scrollbar container instead of a hidden fixed-height one", () => {
    renderCollapsed(20);
    openFlyout();

    const menu = screen.getByRole("menu");
    expect(menu.className).toContain("overflow-y-auto");
    expect(menu.className).not.toContain("hide-scrollbar");
    expect(menu.className).not.toMatch(/max-h-\d/);
  });

  it("keeps the flyout open while scrolling inside it, closing only after the mouse leaves the nav area", () => {
    renderCollapsed(20);
    const trigger = openFlyout();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Mouse travels from the trigger into the flyout content.
    fireEvent.mouseLeave(trigger);
    const menu = screen.getByRole("menu");
    fireEvent.mouseEnter(menu);

    // Entering the flyout must cancel the close scheduled by leaving the trigger.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Scrolling within the flyout must not close it.
    fireEvent.scroll(menu);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Only leaving the flyout (and the whole nav area) starts the close sequence.
    fireEvent.mouseLeave(menu);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
