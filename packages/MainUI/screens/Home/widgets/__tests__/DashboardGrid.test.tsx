/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance
 * with the License.
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

import { render } from "@testing-library/react";
import type { WidgetInstance } from "@workspaceui/api-client/src/api/dashboard";
import DashboardGrid from "@/screens/Home/widgets/DashboardGrid";

const mockWidgetCard = jest.fn();

jest.mock("react-grid-layout", () => ({
  GridLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/screens/Home/widgets/WidgetCard", () => (props: unknown) => {
  mockWidgetCard(props);
  return null;
});

const makeInstance = (instanceId: string) =>
  ({
    instanceId,
    widgetClassId: "kpi",
    position: { col: 0, row: 0, width: 4, height: 2 },
  }) as WidgetInstance;

const renderGrid = (onRefresh?: (instanceId: string) => Promise<void>) =>
  render(
    <DashboardGrid
      instances={[makeInstance("w1"), makeInstance("w2")]}
      widgetData={{}}
      widgetErrors={{}}
      onRemove={jest.fn()}
      onFetchPage={jest.fn()}
      onRefresh={onRefresh}
      onUpdateLayout={jest.fn()}
    />
  );

describe("DashboardGrid", () => {
  beforeAll(() => {
    global.ResizeObserver = class {
      observe = jest.fn();
      disconnect = jest.fn();
      unobserve = jest.fn();
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    mockWidgetCard.mockClear();
  });

  it("passes onRefresh to every widget card", () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    renderGrid(onRefresh);

    const renderedIds = new Set(mockWidgetCard.mock.calls.map(([props]) => props.instance.instanceId));
    expect(renderedIds).toEqual(new Set(["w1", "w2"]));
    for (const [props] of mockWidgetCard.mock.calls) {
      expect(props.onRefresh).toBe(onRefresh);
    }
  });

  it("leaves onRefresh undefined when the grid does not receive it", () => {
    renderGrid();

    for (const [props] of mockWidgetCard.mock.calls) {
      expect(props.onRefresh).toBeUndefined();
    }
  });
});
