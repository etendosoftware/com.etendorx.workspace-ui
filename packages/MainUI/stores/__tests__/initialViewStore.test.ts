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

import { getInitialViewKey, markInitialViewResolved, useInitialViewStore } from "../initialViewStore";
import { resetSessionState } from "@/utils/session/resetSessionState";

jest.mock("@/utils/session/resetSessionState");

const WINDOW = "143_1";
const TAB = "tab-1";
const isResolved = () => Boolean(useInitialViewStore.getState().resolved[getInitialViewKey(WINDOW, TAB)]);

beforeEach(() => resetSessionState());

describe("initialViewStore", () => {
  it("starts with every tab waiting for its initial view", () => {
    expect(isResolved()).toBe(false);
  });

  it("marks a tab as resolved", () => {
    markInitialViewResolved(WINDOW, TAB);

    expect(isResolved()).toBe(true);
  });

  it("keeps the same state when a resolved tab is marked again", () => {
    markInitialViewResolved(WINDOW, TAB);
    const before = useInitialViewStore.getState().resolved;

    markInitialViewResolved(WINDOW, TAB);

    expect(useInitialViewStore.getState().resolved).toBe(before);
  });

  it("keys a tab by its opened window", () => {
    markInitialViewResolved(WINDOW, TAB);

    expect(useInitialViewStore.getState().resolved[getInitialViewKey("143_2", TAB)]).toBeUndefined();
  });

  it("forgets the resolved tabs on logout", () => {
    markInitialViewResolved(WINDOW, TAB);

    resetSessionState();

    expect(isResolved()).toBe(false);
  });
});
