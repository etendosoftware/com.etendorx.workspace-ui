/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * Unit tests for the window store support of the in-app tabs that embed External menu entries.
 */

import { useWindowStore } from "../windowStore";

const WINDOW_IDENTIFIER = "143_1";
const EXTERNAL_IDENTIFIER = "external-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6_1";
const EXTERNAL_URL = "http://example.com";

beforeEach(() => {
  useWindowStore.getState().cleanState();
});

describe("windowStore setWindowActive with an external URL", () => {
  it("keeps the external URL of a newly opened window", () => {
    useWindowStore.getState().setWindowActive({
      windowIdentifier: EXTERNAL_IDENTIFIER,
      windowData: { title: "TEST External", initialized: true, externalUrl: EXTERNAL_URL },
    });

    expect(useWindowStore.getState().windows[EXTERNAL_IDENTIFIER]).toMatchObject({
      windowId: "external-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6",
      isActive: true,
      externalUrl: EXTERNAL_URL,
    });
  });

  it("leaves the external URL undefined for regular windows", () => {
    useWindowStore.getState().setWindowActive({ windowIdentifier: WINDOW_IDENTIFIER, windowData: { title: "Window" } });

    expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER].externalUrl).toBeUndefined();
  });
});
