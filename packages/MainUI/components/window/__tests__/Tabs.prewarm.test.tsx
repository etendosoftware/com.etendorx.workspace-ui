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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type React from "react";
import { act, render, screen } from "@testing-library/react";
import type { Tab as TabType } from "@workspaceui/api-client/src/api/types";
import TabsComponent from "../Tabs";

const mockActiveLevels = { current: [0] };

jest.mock("@/contexts/focus", () => ({ useFocusContext: () => ({ setFocus: jest.fn() }) }));
jest.mock("@/contexts/CurrentWindowContext", () => ({ useCurrentWindowIdentifier: () => "143_1" }));
jest.mock("@/hooks/useTabSwitchGuard", () => ({
  useTabSwitchGuard: () => ({ guardTabSwitch: (_id: string, run: () => void) => run(), prompt: null }),
}));
jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    activeLevels: mockActiveLevels.current,
    setActiveLevel: jest.fn(),
    setActiveTabsByLevel: jest.fn(),
  }),
}));
jest.mock("@/components/window/TabContainer", () => ({
  TabContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@workspaceui/componentlibrary/src/components/ResizeHandle", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/contexts/tab", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/window/Tab", () => ({
  Tab: ({ tab }: { tab: TabType }) => <div data-testid={`mounted-${tab.id}`} />,
}));
// The tab strip is reduced to what Tabs hands it: the prewarm of a tab the pointer is over.
const mockPrewarm: { current?: (tab: TabType) => void } = {};
jest.mock("@/components/window/SubTabsSwitch", () => ({
  SubTabsSwitch: ({ onPrewarm }: { onPrewarm?: (tab: TabType) => void }) => {
    mockPrewarm.current = onPrewarm;
    return null;
  },
}));

const buildTab = (id: string) => ({ id, name: id, tabLevel: 1, window: "143" }) as unknown as TabType;
const TABS = [buildTab("LINES"), buildTab("TAX")];

describe("Tabs — prewarm of a hovered child tab (ETP-6431)", () => {
  beforeEach(() => {
    mockPrewarm.current = undefined;
  });

  it.each([
    ["collapsed", [0]],
    ["open", [0, 1]],
  ])("mounts the hovered tab while the child level is %s, so its record count loads", (_state, levels) => {
    mockActiveLevels.current = levels;
    render(<TabsComponent tabs={TABS} />);
    expect(screen.queryByTestId("mounted-TAX")).toBeNull();

    act(() => mockPrewarm.current?.(TABS[1]));

    expect(screen.getByTestId("mounted-TAX")).toBeInTheDocument();
  });
});
