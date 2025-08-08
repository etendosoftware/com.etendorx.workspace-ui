import React from "react";
import { render, screen } from "@testing-library/react";

// Mock TabButton to expose the "active" prop in markup for easier assertions
jest.mock("@/components/window/TabButton", () => ({
  TabButton: ({ tab, active, onClick, onDoubleClick }: any) => (
    <button
      data-testid={`tab-${tab.id}`}
      aria-label={tab.name}
      data-active={String(!!active)}
      onClick={() => onClick(tab)}
      onDoubleClick={() => onDoubleClick(tab)}>
      {tab.name}
    </button>
  ),
}));

import { SubTabsSwitch } from "./SubTabsSwitch";

describe("SubTabsSwitch - activeTabId visual state", () => {
  const tabs = [
    { id: "t1", name: "Tab 1", tabLevel: 1 },
    { id: "t2", name: "Tab 2", tabLevel: 1 },
  ] as any[];

  it("usa activeTabId en lugar de current para marcar activo", () => {
    render(
      <SubTabsSwitch
        tabs={tabs as any}
        current={tabs[0] as any}
        activeTabId={tabs[1].id}
        onClick={jest.fn()}
        onDoubleClick={jest.fn()}
        onClose={jest.fn()}
        collapsed={false}
      />
    );

    expect(screen.getByTestId("tab-t2")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tab-t1")).toHaveAttribute("data-active", "false");
  });
});

