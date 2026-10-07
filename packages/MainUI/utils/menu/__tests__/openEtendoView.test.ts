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

import { CLASSIC_POPUP_FEATURES, CLASSIC_POPUP_NAME, openEtendoViewPopup } from "../openEtendoView";
import { buildEtendoViewUrl } from "@/utils/url/utils";

jest.mock("@/utils/url/utils", () => ({
  buildEtendoViewUrl: jest.fn(() => "http://classic/view-url"),
}));

describe("openEtendoViewPopup", () => {
  it("opens the classic view URL in the menu popup", () => {
    const openSpy = jest.spyOn(window, "open").mockReturnValue(null);
    const options = { baseUrl: "http://classic", viewId: "OBUIAPP_AlertManagement", token: "jwt" };

    openEtendoViewPopup(options);

    expect(buildEtendoViewUrl).toHaveBeenCalledWith(options);
    expect(openSpy).toHaveBeenCalledWith("http://classic/view-url", CLASSIC_POPUP_NAME, CLASSIC_POPUP_FEATURES);
    openSpy.mockRestore();
  });
});
