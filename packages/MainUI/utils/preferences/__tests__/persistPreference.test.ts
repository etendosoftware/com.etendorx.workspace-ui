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

import { savePreference } from "@workspaceui/api-client/src/api/getPreferences";
import { getStoredPreferences, savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { persistPreference } from "../persistPreference";

jest.mock("@workspaceui/api-client/src/api/getPreferences", () => ({ savePreference: jest.fn() }));

const PROPERTY = "APRM_ShowNoDistributeMsg";
const WINDOW_ID = "143";

describe("persistPreference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    savePreferences({});
  });

  it("stores the window preference for the session and in the server", async () => {
    (savePreference as jest.Mock).mockResolvedValue(undefined);

    await persistPreference(PROPERTY, "N", WINDOW_ID);

    expect(getStoredPreferences()).toEqual({ [`${PROPERTY}_${WINDOW_ID}`]: "N" });
    expect(savePreference).toHaveBeenCalledWith(PROPERTY, "N", WINDOW_ID);
  });

  it("keeps the session value when the server rejects it", async () => {
    (savePreference as jest.Mock).mockRejectedValue(new Error("HTTP 422"));

    await expect(persistPreference(PROPERTY, "N")).resolves.toBeUndefined();
    expect(getStoredPreferences()).toEqual({ [PROPERTY]: "N" });
  });
});
