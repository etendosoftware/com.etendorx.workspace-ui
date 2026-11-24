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
import { loadServerLabel } from "@/utils/serverLabels";

jest.mock("@/utils/serverLabels", () => ({ loadServerLabel: jest.fn() }));

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

  describe("getLabelFromServer", () => {
    const LANGUAGE = "es_ES";
    const i18n = createI18N({ language: LANGUAGE });

    beforeEach(() => {
      (loadServerLabel as jest.Mock).mockResolvedValue(SPLIT_TEMPLATE);
    });

    it("reads the message in the language of the session and substitutes its params", async () => {
      await expect(i18n.getLabelFromServer(SPLIT_KEY, ["A", "B"])).resolves.toBe("Split A into B?");
      expect(loadServerLabel).toHaveBeenCalledWith(LANGUAGE, SPLIT_KEY);
    });

    it("calls the function of the target, as classic", async () => {
      const show = jest.fn();
      await i18n.getLabelFromServer(SPLIT_KEY, undefined, { show }, "show");
      expect(show).toHaveBeenCalledWith(SPLIT_TEMPLATE);
    });

    it("sets the property of the target when it is not a function", async () => {
      const target: Record<string, unknown> = {};
      await i18n.getLabelFromServer(SPLIT_KEY, undefined, target, "title");
      expect(target.title).toBe(SPLIT_TEMPLATE);
    });

    it("answers undefined and delivers nothing for an unknown message", async () => {
      (loadServerLabel as jest.Mock).mockResolvedValue(undefined);
      const show = jest.fn();
      await expect(i18n.getLabelFromServer("Missing", undefined, { show }, "show")).resolves.toBeUndefined();
      expect(show).not.toHaveBeenCalled();
    });
  });
});
