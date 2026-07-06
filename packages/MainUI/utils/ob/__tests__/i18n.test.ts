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

import { createI18N } from "../i18n";

const SPLIT_KEY = "APRM_Split";
const SPLIT_TEMPLATE = "Split %0 into %1?";

describe("createI18N", () => {
  const dictionary: Record<string, string> = {
    Hello: "Hello world",
    [SPLIT_KEY]: SPLIT_TEMPLATE,
  };
  const getLabel = (key: string) => dictionary[key] ?? key;

  it("returns the template unchanged when there are no params", () => {
    expect(createI18N({ getLabel }).getLabel("Hello")).toBe("Hello world");
  });

  it("applies positional %n substitution", () => {
    expect(createI18N({ getLabel }).getLabel(SPLIT_KEY, [100, "two"])).toBe("Split 100 into two?");
  });

  it("returns the key itself for unknown labels (identity fallback)", () => {
    expect(createI18N({ getLabel }).getLabel("missing.key")).toBe("missing.key");
  });

  it("falls back to identity when no resolver is provided", () => {
    expect(createI18N().getLabel("any.key")).toBe("any.key");
  });
});
