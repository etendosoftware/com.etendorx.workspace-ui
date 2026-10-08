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

import { fireEvent, render, screen } from "@testing-library/react";
import RecentlyViewedRenderer from "@/screens/Home/widgets/renderers/RecentlyViewedRenderer";
import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { useWindowStore } from "@/stores/windowStore";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { buildRecentItem, ROLE_ID, setUserSession } from "@/test-utils/recentItems";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/stores/windowStore", () => ({
  useWindowStore: jest.fn(),
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: jest.fn((windowId: string) => `${windowId}_id`),
}));

const EMPTY_TEST_ID = "RecentlyViewedRenderer__empty";
const item = buildRecentItem("a");

describe("RecentlyViewedRenderer", () => {
  const setWindowActive = jest.fn();

  beforeEach(() => {
    setWindowActive.mockClear();
    (useWindowStore as unknown as jest.Mock).mockImplementation((selector) => selector({ setWindowActive }));
    useRecentItemsStore.setState({ items: [item] });
    setUserSession(ROLE_ID);
  });

  it("shows the empty state when there are no recent items", () => {
    useRecentItemsStore.setState({ items: [] });
    render(<RecentlyViewedRenderer />);
    expect(screen.getByTestId(EMPTY_TEST_ID)).toBeInTheDocument();
  });

  it("shows the empty state while there is no role", () => {
    setUserSession(undefined);
    render(<RecentlyViewedRenderer />);
    expect(screen.getByTestId(EMPTY_TEST_ID)).toBeInTheDocument();
  });

  it("renders the server-side recent items and opens the window on click", () => {
    render(<RecentlyViewedRenderer />);

    fireEvent.click(screen.getByTestId(`RecentlyViewedRenderer__item_${item.id}`));

    expect(getNewWindowIdentifier).toHaveBeenCalledWith(item.windowId);
    expect(setWindowActive).toHaveBeenCalledWith({
      windowIdentifier: `${item.windowId}_id`,
      windowData: { title: item.name, initialized: true },
    });
  });
});
