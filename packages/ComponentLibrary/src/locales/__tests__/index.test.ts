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

import translations, { DEFAULT_LANGUAGE } from "../index";

describe("locales/index", () => {
  it("should export DEFAULT_LANGUAGE as en_US", () => {
    expect(DEFAULT_LANGUAGE).toBe("en_US");
  });

  it("should export translations object with es_ES and en_US", () => {
    expect(translations).toHaveProperty("es_ES");
    expect(translations).toHaveProperty("en_US");
  });

  it("should have es_ES translations", () => {
    expect(translations.es_ES).toBeDefined();
    expect(typeof translations.es_ES).toBe("object");
  });

  it("should have en_US translations", () => {
    expect(translations.en_US).toBeDefined();
    expect(typeof translations.en_US).toBe("object");
  });
});
