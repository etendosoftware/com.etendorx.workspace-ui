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

/**
 * @fileoverview Unit tests for LanguageProvider.
 *
 * Covers the backend message dictionary it exposes through getLabel — the resolution Classic
 * performs with OB.I18N.getLabel — and the order in which it aligns the metadata client with the
 * active language, which decides the cache key the dictionary is stored under.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useUserStore } from "@/stores/userStore";
import LanguageProvider, { useLanguage } from "../language";

// ── Mocks ─────────────────────────────────────────────────────────────────

// jest.setup.js stubs this context for every suite; here the real implementation is the subject.
jest.unmock("@/contexts/language");
jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@workspaceui/componentlibrary/src/hooks/useLocalStorage", () => ({
  __esModule: true,
  default: () => [mockStoredLanguage, jest.fn()],
}));

const LANGUAGE = "es_ES";
const MESSAGE_KEY = "ETAS_PasswordAlreadyUsed";
const MESSAGE_TEXT = "Password has been used already. Try another";
const UNKNOWN_KEY = "UINAVBA_IncorrectPwd";

let mockStoredLanguage: string | null = LANGUAGE;

// ── Helpers ─────────────────────────────────────────────────────────────────

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

/** Records the order in which the provider drives the metadata client. */
const callOrder: string[] = [];

/** Reads a code through the provider so the resolved text can be asserted. */
function LabelProbe({ code }: { code: string }) {
  const { getLabel } = useLanguage();
  return <span data-testid="label">{getLabel(code)}</span>;
}

/** Renders the provider around a probe reading the given code. */
const renderWithLabel = (code: string) =>
  render(
    <LanguageProvider>
      <LabelProbe code={code} />
    </LanguageProvider>
  );

describe("LanguageProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callOrder.length = 0;
    mockStoredLanguage = LANGUAGE;
    useUserStore.setState({ token: "jwt-token" });

    mockMetadata.setLanguage.mockImplementation(() => {
      callOrder.push("setLanguage");
      return Metadata;
    });
    mockMetadata.getLabels.mockImplementation(async () => {
      callOrder.push("getLabels");
      return { [MESSAGE_KEY]: MESSAGE_TEXT };
    });
  });

  it("resolves a message code against the backend catalog", async () => {
    renderWithLabel(MESSAGE_KEY);

    await waitFor(() => expect(screen.getByTestId("label")).toHaveTextContent(MESSAGE_TEXT));
  });

  it("echoes the code back when the catalog does not define it", async () => {
    renderWithLabel(UNKNOWN_KEY);

    await waitFor(() => expect(mockMetadata.getLabels).toHaveBeenCalled());
    expect(screen.getByTestId("label")).toHaveTextContent(UNKNOWN_KEY);
  });

  it("aligns the metadata client with the language before loading the dictionary", async () => {
    // setLanguage wipes the metadata cache, so fetching first would store the dictionary under the
    // previous language key and have it dropped right after.
    renderWithLabel(MESSAGE_KEY);

    await waitFor(() => expect(mockMetadata.getLabels).toHaveBeenCalled());
    expect(callOrder).toEqual(["setLanguage", "getLabels"]);
  });

  it("does not touch the metadata client while there is no language", async () => {
    mockStoredLanguage = null;

    renderWithLabel(MESSAGE_KEY);

    await waitFor(() => expect(screen.getByTestId("label")).toHaveTextContent(MESSAGE_KEY));
    expect(mockMetadata.setLanguage).not.toHaveBeenCalled();
    expect(mockMetadata.getLabels).not.toHaveBeenCalled();
  });
});
