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

import { screen } from "@testing-library/react";
import { useUserStore } from "@/stores/userStore";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import type { CurrentRole } from "@workspaceui/api-client/src/api/types";
import { renderSaveViewMenu, resetToStandardView, SAVE_VIEW_MENU_TAB_ID } from "../test-utils/saveViewMenu";

const WINDOW_ID = "143";
const PREFERENCE_KEY = `OBUIAPP_WindowPersonalization_Override_${WINDOW_ID}`;
const SAVE_BUTTON_ID = "SaveViewMenu__save-button";
const DELETE_BUTTON_ID = "SaveViewMenu__view-delete";
const SET_DEFAULT_BUTTON_ID = "SaveViewMenu__view-set-default";

const OWN_VIEW = {
  id: "view-1",
  name: "My columns",
  tabId: SAVE_VIEW_MENU_TAB_ID,
  isDefault: false,
  scope: "USER" as const,
  editable: true,
  filterClause: "",
  config: null,
};

const mockUnsetDefaultView = jest.fn().mockResolvedValue(undefined);
const mockApplyView = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/hooks/useSavedViews", () => ({
  useSavedViews: () =>
    jest.requireActual("../test-utils/saveViewMenu").buildSavedViewsHookMock({
      views: [OWN_VIEW],
      unsetDefaultView: mockUnsetDefaultView,
      applyView: mockApplyView,
    }),
}));

/** Sets the user level of the current role (" CO" for a client administrator). */
const setUserLevel = (userLevel: string) =>
  useUserStore.setState({ currentRole: { userLevel } as unknown as CurrentRole });

describe("SaveViewMenu and OBUIAPP_WindowPersonalization_Override", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    setUserLevel("  O");
  });

  it("lets a regular user manage views without the preference", () => {
    savePreferences({});
    renderSaveViewMenu({ windowId: WINDOW_ID });

    expect(screen.getByTestId(SAVE_BUTTON_ID)).toBeInTheDocument();
    expect(screen.getByTestId(DELETE_BUTTON_ID)).toBeInTheDocument();
    expect(screen.getByTestId(SET_DEFAULT_BUTTON_ID)).not.toBeDisabled();
  });

  it("only lets a regular user pick views when the preference is No", () => {
    savePreferences({ [PREFERENCE_KEY]: "N" });
    renderSaveViewMenu({ windowId: WINDOW_ID });

    expect(screen.queryByTestId(SAVE_BUTTON_ID)).not.toBeInTheDocument();
    expect(screen.queryByTestId(DELETE_BUTTON_ID)).not.toBeInTheDocument();
    expect(screen.getByTestId(SET_DEFAULT_BUTTON_ID)).toBeDisabled();
    expect(screen.getByTestId("SaveViewMenu__view-apply")).toBeInTheDocument();
  });

  it("goes back to the standard view without clearing the stored default when blocked", async () => {
    savePreferences({ [PREFERENCE_KEY]: "false" });
    const props = renderSaveViewMenu({ windowId: WINDOW_ID });

    await resetToStandardView();

    expect(mockUnsetDefaultView).not.toHaveBeenCalled();
    expect(props.onApplyView).toHaveBeenCalled();
  });

  it("keeps an administrator managing views with the preference set to No", () => {
    setUserLevel(" CO");
    savePreferences({ [PREFERENCE_KEY]: "N" });
    renderSaveViewMenu({ windowId: WINDOW_ID });

    expect(screen.getByTestId(SAVE_BUTTON_ID)).toBeInTheDocument();
    expect(screen.getByTestId(DELETE_BUTTON_ID)).toBeInTheDocument();
  });
});
