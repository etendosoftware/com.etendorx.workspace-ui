import React from "react";
import { render, screen } from "@testing-library/react";

// Mock subcomponents to reduce rendering complexity
jest.mock("@/components/window/SubTabsSwitch", () => ({
  SubTabsSwitch: () => <div data-testid="subtabs" />,
}));

jest.mock("@/components/window/TabContainer", () => ({
  TabContainer: ({ children }: any) => <div data-testid="tab-container">{children}</div>,
}));

jest.mock("@/components/window/Tab", () => ({
  Tab: () => <div data-testid="tab-content" />,
}));

jest.mock("@/contexts/tab", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("@workspaceui/componentlibrary/src/components/ResizeHandle", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ activeLevels: [1], setActiveLevel: jest.fn() }),
}));

// Spy on useTransition to force pending state
// Force React.useTransition to always be pending
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useTransition: () => [true, (cb: any) => cb()] };
});

import Tabs from "./Tabs";

describe("Tabs - pending state skeleton", () => {
  const tabs = [
    { id: "t1", name: "Tab 1", tabLevel: 1 },
    { id: "t2", name: "Tab 2", tabLevel: 2 },
  ] as any[];

  it("renders skeleton content when transition is pending", () => {
    render(<Tabs tabs={tabs as any} />);

    expect(screen.getByTestId("tab-container")).toBeInTheDocument();
    // When pending, the skeleton container with animate-pulse should be present
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
