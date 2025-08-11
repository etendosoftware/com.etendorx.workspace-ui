import type React from "react";
import { render, screen } from "@testing-library/react";
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
