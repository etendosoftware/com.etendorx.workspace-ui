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

import { act, render, screen } from "@testing-library/react";
import { RecentItemsProvider } from "@/contexts/recentItems";
import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { buildRecentItemsScopeKey } from "@/utils/recentItems";
import { ORG_ID, ROLE_ID, SCOPE_KEY, setUserSession, USER_ID } from "@/test-utils/recentItems";

const OTHER_ROLE_ID = "role-2";

describe("RecentItemsProvider", () => {
  const loadForScope = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    loadForScope.mockClear();
    useRecentItemsStore.setState({ loadForScope });
  });

  it("renders its children and loads the recent items of the current scope", () => {
    setUserSession(ROLE_ID);

    render(
      <RecentItemsProvider>
        <span data-testid="child" />
      </RecentItemsProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(loadForScope).toHaveBeenCalledWith(SCOPE_KEY);
  });

  it("reloads the recent items when the role changes", () => {
    setUserSession(ROLE_ID);
    render(<RecentItemsProvider>{null}</RecentItemsProvider>);

    act(() => setUserSession(OTHER_ROLE_ID));

    expect(loadForScope).toHaveBeenLastCalledWith(buildRecentItemsScopeKey(USER_ID, OTHER_ROLE_ID, ORG_ID));
    expect(loadForScope).toHaveBeenCalledTimes(2);
  });
});
