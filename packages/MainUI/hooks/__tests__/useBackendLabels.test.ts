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

/**
 * @fileoverview Unit tests for useBackendLabels.
 *
 * Covers the backend label dictionary loading used by the language context so
 * that message keys (e.g. the ones resolved by migrated process scripts through
 * OB.I18N.getLabel) become available, plus its guard conditions and graceful
 * degradation when the fetch fails.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Labels } from "@workspaceui/api-client/src/api/types";
import { useBackendLabels } from "../useBackendLabels";

jest.mock("@workspaceui/api-client/src/api/metadata");

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

const MESSAGE_KEY = "ETVFAC_DATA_ID_ISEMPTY";
const MESSAGE_TEXT = "Texto traducido";
const TOKEN = "test-token";
const LANGUAGE = "es_ES";

/** Renders the hook resolving the given dictionary for the provided preconditions. */
const renderWithLabels = (
  dictionary: Labels = { [MESSAGE_KEY]: MESSAGE_TEXT },
  { token = TOKEN as string | null, language = LANGUAGE as string | null } = {}
) => {
  mockMetadata.getLabels.mockResolvedValue(dictionary);
  return renderHook(() => useBackendLabels(language, token));
};

describe("useBackendLabels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the dictionary when language and token are present", async () => {
    const { result } = renderWithLabels();

    await waitFor(() => expect(result.current[0]).toEqual({ [MESSAGE_KEY]: MESSAGE_TEXT }));
    expect(mockMetadata.getLabels).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when there is no token", async () => {
    const { result } = renderWithLabels({ [MESSAGE_KEY]: MESSAGE_TEXT }, { token: null });

    await Promise.resolve();
    expect(mockMetadata.getLabels).not.toHaveBeenCalled();
    expect(result.current[0]).toEqual({});
  });

  it("does not fetch when there is no language", async () => {
    const { result } = renderWithLabels({ [MESSAGE_KEY]: MESSAGE_TEXT }, { language: null });

    await Promise.resolve();
    expect(mockMetadata.getLabels).not.toHaveBeenCalled();
    expect(result.current[0]).toEqual({});
  });

  it("keeps an empty dictionary when loading fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockMetadata.getLabels.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useBackendLabels(LANGUAGE, TOKEN));

    await waitFor(() => expect(mockMetadata.getLabels).toHaveBeenCalled());
    expect(result.current[0]).toEqual({});

    consoleError.mockRestore();
  });

  it("exposes the setter so the dictionary can be updated", async () => {
    const { result } = renderWithLabels();

    await waitFor(() => expect(result.current[0]).toEqual({ [MESSAGE_KEY]: MESSAGE_TEXT }));
    expect(typeof result.current[1]).toBe("function");
  });
});
