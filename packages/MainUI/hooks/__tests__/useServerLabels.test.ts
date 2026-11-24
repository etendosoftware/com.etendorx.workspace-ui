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

import { renderHook, waitFor } from "@testing-library/react";
import { fetchServerLabel } from "@workspaceui/api-client/src/api/serverLabel";
import { resetSessionState } from "@/utils/session/resetSessionState";
import { useServerLabels } from "../useServerLabels";

jest.mock("@workspaceui/api-client/src/api/serverLabel", () => ({ fetchServerLabel: jest.fn() }));
jest.mock("@/contexts/language", () => ({ useLanguage: () => ({ language: "en_US" }) }));
jest.mock("@/utils/session/resetSessionState");
jest.mock("@/utils/logger");

const KEY = "OBUIAPP_ClearFilters";
const MISSING_KEY = "OBUIAPP_Missing";
const TEXT = "Click the funnel icon";
const KEYS = [KEY, MISSING_KEY];

describe("useServerLabels", () => {
  beforeEach(() => {
    // The cache belongs to the session: a reset starts every test without texts
    resetSessionState();
    jest.clearAllMocks();
    (fetchServerLabel as jest.Mock).mockImplementation(async (key: string) => (key === KEY ? TEXT : undefined));
  });

  it("answers the texts found, by key", async () => {
    const { result } = renderHook(() => useServerLabels(KEYS));

    await waitFor(() => expect(result.current).toEqual({ [KEY]: TEXT }));
  });

  it("asks for each text once per session", async () => {
    const first = renderHook(() => useServerLabels(KEYS));
    await waitFor(() => expect(first.result.current[KEY]).toBe(TEXT));
    const second = renderHook(() => useServerLabels(KEYS));
    await waitFor(() => expect(second.result.current[KEY]).toBe(TEXT));

    expect(fetchServerLabel).toHaveBeenCalledTimes(KEYS.length);
  });

  it("asks for nothing until the texts are needed", () => {
    renderHook(() => useServerLabels(KEYS, false));

    expect(fetchServerLabel).not.toHaveBeenCalled();
  });

  it("asks again for a text whose request failed", async () => {
    (fetchServerLabel as jest.Mock).mockRejectedValueOnce(new Error("down"));
    const first = renderHook(() => useServerLabels([KEY]));
    await waitFor(() => expect(fetchServerLabel).toHaveBeenCalledTimes(1));
    expect(first.result.current).toEqual({});

    const second = renderHook(() => useServerLabels([KEY]));
    await waitFor(() => expect(second.result.current[KEY]).toBe(TEXT));
  });
});
