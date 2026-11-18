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

import { resolveCatalogLabel } from "../catalogLabel";

const CODE = "UINAVBA_PasswordChanged";
const FALLBACK_KEY = "navigation.profile.passwordChangedSuccess";
const t = (key: string) => `t:${key}`;

describe("resolveCatalogLabel", () => {
  it("returns the backend catalog text when the code is defined", () => {
    const getLabel = () => "Your password has been changed!";
    expect(resolveCatalogLabel(CODE, FALLBACK_KEY, { getLabel, t })).toBe("Your password has been changed!");
  });

  it("falls back to the local translation when the catalog returns the code itself", () => {
    const getLabel = (code: string) => code;
    expect(resolveCatalogLabel(CODE, FALLBACK_KEY, { getLabel, t })).toBe(`t:${FALLBACK_KEY}`);
  });

  it("falls back to the local translation when the catalog text is empty", () => {
    const getLabel = () => "";
    expect(resolveCatalogLabel(CODE, FALLBACK_KEY, { getLabel, t })).toBe(`t:${FALLBACK_KEY}`);
  });
});
