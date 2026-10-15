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

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

import { act, render, screen } from "@testing-library/react";
import type { EntityData, Field, Tab } from "@workspaceui/api-client/src/api/types";
import type { Etendo } from "@workspaceui/api-client/src/api/metadata";
import TabsContainer from "../TabsContainer";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";

const WINDOW_IDENTIFIER = "win-122";
const COUNTRY_TAB_ID = "country";
const REGION_TAB_ID = "region";
const CITY_TAB_ID = "city";
const SPAIN_ID = "ES";

const mockSelectedRecords: Record<string, EntityData | undefined> = {};
const mockTabsRender = jest.fn();

jest.mock("@/hooks/useSelectedRecord", () => ({
  useSelectedRecord: (tab?: { id: string }) => (tab ? mockSelectedRecords[tab.id] : undefined),
}));

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => "win-122",
}));

jest.mock("@/contexts/window", () => ({
  useWindowContext: () => ({ getSelectedRecord: () => "selected-id" }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { session: Record<string, unknown> }) => unknown) => selector({ session: {} }),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    activeLevels: [0, 1],
    activeTabsByLevel: new Map([
      [0, "country"],
      [1, "region"],
    ]),
    setActiveLevel: jest.fn(),
    setActiveTabsByLevel: jest.fn(),
  }),
}));

jest.mock("@/components/window/Tabs", () => ({
  __esModule: true,
  default: (props: { tabs: Tab[] }) => {
    mockTabsRender(props);
    const names = props.tabs.map((tab) => tab.name).join(",");
    return <div data-testid={`tabs-level-${props.tabs[0].tabLevel}`}>{names}</div>;
  },
}));

jest.mock("@/components/Breadcrums", () => ({
  __esModule: true,
  default: () => null,
}));

const createField = (hqlName: string, columnName: string): Field =>
  ({ hqlName, columnName, column: { dBColumnName: columnName } }) as unknown as Field;

const createTab = (overrides: Partial<Tab> & { parentTabId?: string }): Tab =>
  ({
    window: "122",
    fields: {},
    parentColumns: [],
    ...overrides,
  }) as unknown as Tab;

const countryTab = createTab({
  id: COUNTRY_TAB_ID,
  name: "Country",
  tabLevel: 0,
  fields: {
    hasRegion: createField("hasRegion", "HasRegion"),
    name: createField("name", "Name"),
  },
});
const regionTab = createTab({
  id: REGION_TAB_ID,
  name: "Region",
  tabLevel: 1,
  parentTabId: COUNTRY_TAB_ID,
  displayLogic: "@HasRegion@='Y'",
  fields: { active: createField("active", "IsActive") },
});
const translationTab = createTab({
  id: "translation",
  name: "Translation",
  tabLevel: 1,
  parentTabId: COUNTRY_TAB_ID,
});
const cityTab = createTab({ id: CITY_TAB_ID, name: "City", tabLevel: 2, parentTabId: REGION_TAB_ID });

const windowData = {
  id: "122",
  tabs: [countryTab, regionTab, translationTab, cityTab],
} as unknown as Etendo.WindowMetadata;

const publishCountryValues = (values: Record<string, unknown>, recordId = SPAIN_ID) =>
  act(() => {
    useLiveTabValuesStore.getState().publishTabValues(WINDOW_IDENTIFIER, COUNTRY_TAB_ID, { recordId, values });
  });

const clearCountryValues = () =>
  act(() => {
    useLiveTabValuesStore.getState().clearTabValues(WINDOW_IDENTIFIER, COUNTRY_TAB_ID);
  });

const renderContainer = () => render(<TabsContainer windowData={windowData} />);

const levelOneNames = () => screen.getByTestId("tabs-level-1").textContent;

describe("TabsContainer - tab display logic with live header values", () => {
  beforeEach(() => {
    useLiveTabValuesStore.setState({ entries: {} });
    mockTabsRender.mockClear();
    mockSelectedRecords[COUNTRY_TAB_ID] = { id: SPAIN_ID, hasRegion: true, name: "Spain" };
    mockSelectedRecords[REGION_TAB_ID] = { id: "R1", active: true };
  });

  it("evaluates the persisted record when the header has no live values", () => {
    renderContainer();

    expect(levelOneNames()).toBe("Region,Translation");
  });

  it("hides and shows the tab as the unsaved header value changes", () => {
    renderContainer();

    publishCountryValues({ hasRegion: false });
    expect(levelOneNames()).toBe("Translation");

    publishCountryValues({ hasRegion: true });
    expect(levelOneNames()).toBe("Region,Translation");
  });

  it("returns to the persisted record state once the live values are discarded", () => {
    renderContainer();

    publishCountryValues({ hasRegion: false });
    clearCountryValues();

    expect(levelOneNames()).toBe("Region,Translation");
  });

  it("ignores live values published for a different record", () => {
    renderContainer();

    publishCountryValues({ hasRegion: false }, "FR");

    expect(levelOneNames()).toBe("Region,Translation");
  });

  it("cascades the hide to the grandchildren when live values hide their parent", () => {
    renderContainer();
    expect(screen.getByTestId("tabs-level-2").textContent).toBe("City");

    publishCountryValues({ hasRegion: false });

    expect(screen.queryByTestId("tabs-level-2")).not.toBeInTheDocument();
  });

  it("keeps passing the same tabs list when an edit does not change the visible tabs", () => {
    renderContainer();
    const levelOneProps = () => mockTabsRender.mock.calls.filter(([props]) => props.tabs[0].tabLevel === 1);
    const rendersBeforeEdit = levelOneProps().length;
    const tabsBeforeEdit = levelOneProps().at(-1)?.[0].tabs;

    publishCountryValues({ hasRegion: true });

    expect(levelOneProps().length).toBeGreaterThan(rendersBeforeEdit);
    expect(levelOneProps().at(-1)?.[0].tabs).toBe(tabsBeforeEdit);
  });
});
