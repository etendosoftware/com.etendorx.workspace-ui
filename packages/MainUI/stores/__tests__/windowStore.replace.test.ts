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

import { useWindowStore } from "../windowStore";

const ORDER_WINDOW = "143_1";
const INVOICE_WINDOW = "167_1";
const NEW_ORDER_WINDOW = "143_2";

beforeEach(() => {
  const store = useWindowStore.getState();
  store.cleanState();
  store.setWindowActive({ windowIdentifier: ORDER_WINDOW, windowData: { title: "Sales Order", initialized: true } });
  store.setWindowActive({
    windowIdentifier: INVOICE_WINDOW,
    windowData: { title: "Sales Invoice", initialized: true },
  });
});

describe("windowStore replaceWindow", () => {
  it("puts the new instance in the position of the replaced one, active", () => {
    useWindowStore.getState().replaceWindow({
      windowIdentifier: ORDER_WINDOW,
      newWindowIdentifier: NEW_ORDER_WINDOW,
      windowData: { title: "Sales Order", initialized: true },
    });

    const { windows } = useWindowStore.getState();
    expect(Object.keys(windows)).toEqual([NEW_ORDER_WINDOW, INVOICE_WINDOW]);
    expect(windows[NEW_ORDER_WINDOW]).toMatchObject({ windowId: "143", isActive: true, tabs: {} });
    expect(windows[INVOICE_WINDOW].isActive).toBe(false);
  });

  it("drops the unsaved-changes marks of the replaced instance", () => {
    useWindowStore.getState().setWindowDirtySource(ORDER_WINDOW, "form:186", true);
    expect(useWindowStore.getState().dirtyWindows[ORDER_WINDOW]).toBeDefined();
    useWindowStore.getState().replaceWindow({ windowIdentifier: ORDER_WINDOW, newWindowIdentifier: NEW_ORDER_WINDOW });

    expect(useWindowStore.getState().dirtyWindows[ORDER_WINDOW]).toBeUndefined();
  });

  it("does nothing when the instance is not open", () => {
    useWindowStore.getState().replaceWindow({ windowIdentifier: "999_1", newWindowIdentifier: NEW_ORDER_WINDOW });

    expect(Object.keys(useWindowStore.getState().windows)).toEqual([ORDER_WINDOW, INVOICE_WINDOW]);
  });
});
