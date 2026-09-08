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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import ProfileModal from "../ProfileModal";
import type { ProfileModalProps } from "../types";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

const WINDOW_IDENTIFIER = "143_1000";
const FORM_SOURCE_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, "header");
const SAVE_LABEL = "common.save";
const ROLE_ID = "role-1";
const OTHER_ROLE_ID = "role-2";
const RELOAD_LANGUAGE = "es_ES";

const mockChangeProfile = jest.fn();
const mockSetDefaultConfiguration = jest.fn();
const mockCleanState = jest.fn();
const mockReload = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US", getFlag: () => "", getLabel: (key: string) => key }),
}));

jest.mock("@/hooks/useSSO", () => ({
  useSSO: () => ({ config: { enabled: false }, startLink: jest.fn() }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

// The selector panel and the surrounding chrome are irrelevant here: this suite only
// exercises the Save handler and its unsaved-changes guard. The language selector is
// reduced to a single button so the reload path can be reached.
jest.mock("../ToggleSection", () => ({
  __esModule: true,
  default: ({
    onLanguageChange,
    languages,
  }: {
    onLanguageChange: (event: never, option: { title: string; value: string; id: string }) => void;
    languages: Array<{ id: string; language: string; name: string }>;
  }) => (
    <button
      type="button"
      data-testid="pick-language"
      onClick={() =>
        onLanguageChange({} as never, { title: languages[1].name, value: languages[1].language, id: languages[1].id })
      }>
      pick language
    </button>
  ),
}));
jest.mock("../ToggleButton", () => ({ __esModule: true, default: () => null }));
jest.mock("../UserProfile", () => ({ __esModule: true, default: () => null }));

jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
  }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const createRole = (id: string) => ({
  id,
  name: `Role ${id}`,
  client: "client-1",
  organizations: [{ id: "org-1", name: "Org 1", warehouses: [{ id: "wh-1", name: "WH 1" }] }],
});

const createProps = (overrides: Partial<ProfileModalProps> = {}): ProfileModalProps =>
  ({
    icon: null,
    userPhotoUrl: "",
    userName: "John Doe",
    userEmail: "john@example.com",
    sections: [],
    section: "profile",
    translations: { saveAsDefault: "saveAsDefault" },
    saveAsDefault: true,
    onSaveAsDefaultChange: jest.fn(),
    onSetDefaultConfiguration: mockSetDefaultConfiguration,
    onPasswordChange: jest.fn(),
    currentRole: { id: ROLE_ID, name: "Role 1", client: "client-1" },
    currentWarehouse: { id: "wh-1", name: "WH 1" },
    currentOrganization: { id: "org-1", name: "Org 1" },
    currentClient: { id: "client-1", name: "Client 1" },
    roles: [createRole(ROLE_ID), createRole(OTHER_ROLE_ID)],
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
    onLanguageChange: jest.fn(),
    language: "en_US",
    languages: [
      { id: "lang-en", language: "en_US", name: "English" },
      { id: "lang-es", language: RELOAD_LANGUAGE, name: "Spanish" },
    ],
    languagesFlags: "",
    changeProfile: mockChangeProfile,
    ...overrides,
    // biome-ignore lint/suspicious/noExplicitAny: the untested props are stubbed above
  }) as any;

describe("ProfileModal — unsaved-changes guard", () => {
  const renderModal = (overrides: Partial<ProfileModalProps> = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <ProfileModal {...createProps(overrides)} />
      </ThemeProvider>
    );

  const pressSave = () => fireEvent.click(screen.getByText(SAVE_LABEL));

  const markWindowDirty = () => {
    useWindowStore.setState({ dirtyWindows: { [WINDOW_IDENTIFIER]: { [FORM_SOURCE_KEY]: true } } });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChangeProfile.mockResolvedValue(undefined);
    mockSetDefaultConfiguration.mockResolvedValue(undefined);
    useWindowStore.setState({ dirtyWindows: {}, cleanState: mockCleanState });
    useUnsavedChangesStore.setState({ request: null, bypassUnloadWarning: false });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: mockReload },
    });
  });

  it("applies the configuration right away when nothing is dirty", async () => {
    renderModal();

    pressSave();

    await waitFor(() => expect(mockCleanState).toHaveBeenCalledTimes(1));
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });

  it("does not touch the profile while a window holds unsaved changes", async () => {
    markWindowDirty();
    renderModal();

    pressSave();

    await waitFor(() => expect(useUnsavedChangesStore.getState().request).not.toBeNull());
    expect(mockChangeProfile).not.toHaveBeenCalled();
    expect(mockCleanState).not.toHaveBeenCalled();
  });

  it("applies the configuration once the pending request proceeds", async () => {
    markWindowDirty();
    renderModal();
    pressSave();
    await waitFor(() => expect(useUnsavedChangesStore.getState().request).not.toBeNull());

    useUnsavedChangesStore.getState().request?.onProceed();

    await waitFor(() => expect(mockCleanState).toHaveBeenCalledTimes(1));
  });

  it("does not reload while the language is untouched", async () => {
    renderModal();

    pressSave();

    await waitFor(() => expect(mockCleanState).toHaveBeenCalled());
    expect(mockReload).not.toHaveBeenCalled();
    expect(useUnsavedChangesStore.getState().bypassUnloadWarning).toBe(false);
  });

  it("bypasses the native unload warning before the language reload", async () => {
    renderModal();

    fireEvent.click(screen.getByTestId("pick-language"));
    pressSave();

    await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1));
    expect(useUnsavedChangesStore.getState().bypassUnloadWarning).toBe(true);
  });
});
