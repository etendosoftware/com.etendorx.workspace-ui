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

import { loadTabDefaultView, prefetchWindowViewSettings, toDefaultViewsByTab } from "../defaultViews";
import { loadWindowGridConfiguration } from "../gridConfiguration";
import { useUserStore } from "@/stores/userStore";
import { resetSessionState } from "@/utils/session/resetSessionState";
import {
  DEFAULT_VIEW_TAB_ID,
  makeDefaultViewRecord,
  makeErrorResponse,
  makeSavedViewsResponse,
} from "@/utils/testUtils/savedViews";

jest.mock("@/utils/logger");
jest.mock("@/utils/session/resetSessionState");
jest.mock("@/stores/userStore", () => ({ useUserStore: { getState: jest.fn() } }));
jest.mock("../gridConfiguration", () => ({ loadWindowGridConfiguration: jest.fn() }));

const WINDOW_ID = "143";
const OTHER_TAB_ID = "tab-child";
const FILTERS = [{ id: "status", value: "active" }];

let windowSequence = 0;
/** A fresh opened window per call: the views are loaded once per opened window. */
const nextWindow = () => `${WINDOW_ID}_${++windowSequence}`;

const mockFetch = jest.fn();
const givenToken = (token: string | null) => (useUserStore.getState as jest.Mock).mockReturnValue({ token });

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
  givenToken("test-token");
});

describe("loadTabDefaultView", () => {
  it("asks for the default views of the whole window", async () => {
    mockFetch.mockReturnValue(makeSavedViewsResponse([]));

    await loadTabDefaultView(nextWindow(), DEFAULT_VIEW_TAB_ID);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`/api/meta/saved-views?window=${WINDOW_ID}&isdefault=true`);
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("returns the parsed default view of the tab", async () => {
    mockFetch.mockReturnValue(makeSavedViewsResponse([makeDefaultViewRecord()]));

    const view = await loadTabDefaultView(nextWindow(), DEFAULT_VIEW_TAB_ID);

    expect(view?.filters).toEqual(FILTERS);
  });

  it("shares one request between the tabs of an opened window", async () => {
    mockFetch.mockReturnValue(
      makeSavedViewsResponse([makeDefaultViewRecord(), makeDefaultViewRecord({ id: "view-002", tab: OTHER_TAB_ID })])
    );
    const windowIdentifier = nextWindow();

    const [header, child] = await Promise.all([
      loadTabDefaultView(windowIdentifier, DEFAULT_VIEW_TAB_ID),
      loadTabDefaultView(windowIdentifier, OTHER_TAB_ID),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(header).not.toBeNull();
    expect(child).not.toBeNull();
  });

  it("asks again when the window is opened again", async () => {
    mockFetch.mockImplementation(() => makeSavedViewsResponse([]));

    await loadTabDefaultView(nextWindow(), DEFAULT_VIEW_TAB_ID);
    await loadTabDefaultView(nextWindow(), DEFAULT_VIEW_TAB_ID);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns null for a tab without default view", async () => {
    mockFetch.mockReturnValue(makeSavedViewsResponse([makeDefaultViewRecord()]));

    expect(await loadTabDefaultView(nextWindow(), OTHER_TAB_ID)).toBeNull();
  });

  it.each([
    ["the response is not ok", () => makeErrorResponse(500)],
    ["the server answers a non-zero status", () => makeSavedViewsResponse([makeDefaultViewRecord()], -1)],
    ["the request fails", () => Promise.reject(new Error("network"))],
  ])("returns null when %s", async (_case, answer) => {
    mockFetch.mockImplementation(answer);

    expect(await loadTabDefaultView(nextWindow(), DEFAULT_VIEW_TAB_ID)).toBeNull();
  });

  it("returns null without a session, and asks once there is one", async () => {
    mockFetch.mockImplementation(() => makeSavedViewsResponse([makeDefaultViewRecord()]));
    const windowIdentifier = nextWindow();
    givenToken(null);

    expect(await loadTabDefaultView(windowIdentifier, DEFAULT_VIEW_TAB_ID)).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();

    givenToken("test-token");
    expect(await loadTabDefaultView(windowIdentifier, DEFAULT_VIEW_TAB_ID)).not.toBeNull();
  });

  it("asks again after a logout", async () => {
    mockFetch.mockImplementation(() => makeSavedViewsResponse([]));
    const windowIdentifier = nextWindow();

    await loadTabDefaultView(windowIdentifier, DEFAULT_VIEW_TAB_ID);
    resetSessionState();
    await loadTabDefaultView(windowIdentifier, DEFAULT_VIEW_TAB_ID);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("toDefaultViewsByTab", () => {
  it.each([
    ["unparseable", "{invalid json}"],
    ["empty", ""],
  ])("leaves out a view whose configuration is %s", (_case, gridconfiguration) => {
    const viewsByTab = toDefaultViewsByTab([
      makeDefaultViewRecord({ gridconfiguration }),
      makeDefaultViewRecord({ tab: OTHER_TAB_ID }),
    ]);

    expect(Object.keys(viewsByTab)).toEqual([OTHER_TAB_ID]);
  });
});

describe("prefetchWindowViewSettings", () => {
  it("starts loading the default views and the stored columns of the window", async () => {
    mockFetch.mockReturnValue(makeSavedViewsResponse([makeDefaultViewRecord()]));
    const windowIdentifier = nextWindow();

    prefetchWindowViewSettings(windowIdentifier);
    await loadTabDefaultView(windowIdentifier, DEFAULT_VIEW_TAB_ID);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(loadWindowGridConfiguration).toHaveBeenCalledWith(windowIdentifier);
  });
});
