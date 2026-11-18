/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { getAutosavePolicy } from "../autosave";
import { resolvePreference } from "@/utils/propertyStore";

jest.mock("@/utils/propertyStore", () => ({ resolvePreference: jest.fn() }));

const setPreferences = (prefs: Record<string, unknown>) => {
  (resolvePreference as jest.Mock).mockImplementation((key: string) => prefs[key]);
};

describe("getAutosavePolicy", () => {
  it("autosaves without asking when there are no preferences, like Classic", () => {
    setPreferences({});
    expect(getAutosavePolicy("143")).toEqual({ autosave: true, confirm: false });
  });

  it("asks first when Show Confirmation Default is Y", () => {
    setPreferences({ Autosave: "Y", ShowConfirmationDefault: "Y" });
    expect(getAutosavePolicy("143")).toEqual({ autosave: true, confirm: true });
  });

  it("does not autosave when Autosave is N, and then there is nothing to confirm", () => {
    setPreferences({ Autosave: "N", ShowConfirmationDefault: "Y" });
    expect(getAutosavePolicy("143")).toEqual({ autosave: false, confirm: false });
  });

  it("takes any value other than Y as off, as Classic does", () => {
    setPreferences({ Autosave: "false", ShowConfirmationDefault: "yes" });
    expect(getAutosavePolicy("143")).toEqual({ autosave: false, confirm: false });
  });

  it("resolves the preferences for the window it is asked about", () => {
    setPreferences({});
    getAutosavePolicy("143");
    expect(resolvePreference).toHaveBeenCalledWith("Autosave", "143");
    expect(resolvePreference).toHaveBeenCalledWith("ShowConfirmationDefault", "143");
  });
});
