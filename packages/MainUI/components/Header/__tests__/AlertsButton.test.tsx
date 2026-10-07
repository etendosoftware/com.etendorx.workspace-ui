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

import { fireEvent, render, screen } from "@testing-library/react";
import AlertsButton, { formatAlertCount, hasPendingAlerts } from "../AlertsButton";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useUserStore } from "@/stores/userStore";
import { openEtendoViewPopup } from "@/utils/menu/openEtendoView";
import { ALERT_MANAGEMENT_VIEW_ID } from "@/utils/alerts/constants";

// The global manual mock renders IconButton as a plain <div>; the real button is needed here.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () =>
  jest.requireActual("@workspaceui/componentlibrary/src/components/IconButton")
);

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ getLabel: (key: string) => (key === "UINAVBA_Alerts" ? "Alerts (%0)" : key) }),
}));

const CLASSIC_HOST = "http://classic";

let mockRuntimeConfig: { etendoClassicHost: string } | null = { etendoClassicHost: CLASSIC_HOST };
jest.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => ({ config: mockRuntimeConfig }),
}));

jest.mock("@/hooks/useAlertCount", () => ({
  useAlertCount: jest.fn(),
}));

jest.mock("@/utils/alerts/resolveAlertShortcut", () => ({
  resolveAlertShortcut: () => "F8",
}));

jest.mock("@/utils/menu/openEtendoView", () => ({
  openEtendoViewPopup: jest.fn(),
}));

const mockUseAlertCount = useAlertCount as jest.Mock;

const TOKEN = "jwt";

const renderWithCount = (count: number | null) => {
  mockUseAlertCount.mockReturnValue(count);
  return render(<AlertsButton />);
};

const getButton = () => screen.getByRole("button");

const expectAlertManagementOpened = (baseUrl = CLASSIC_HOST) => {
  expect(openEtendoViewPopup).toHaveBeenCalledWith({
    baseUrl,
    viewId: ALERT_MANAGEMENT_VIEW_ID,
    token: TOKEN,
  });
};

describe("AlertsButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRuntimeConfig = { etendoClassicHost: CLASSIC_HOST };
    useUserStore.setState({
      token: TOKEN,
      currentRole: { id: "role-1" } as never,
      passwordExpired: false,
    });
  });

  it.each([
    [null, "Alerts (-)"],
    [1, "Alerts (1)"],
    [0, "Alerts (0)"],
  ])("labels the bell for a count of %p as %p", (count, expected) => {
    renderWithCount(count);

    expect(getButton()).toHaveAttribute("aria-label", expected);
    expect(screen.getByTestId("mock-svg")).toBeInTheDocument();
  });

  it("polls while a session is active, for the current role", () => {
    renderWithCount(null);

    expect(mockUseAlertCount).toHaveBeenCalledWith(true, "role-1", CLASSIC_HOST);
  });

  it.each([
    ["the password is expired", { passwordExpired: true }, "role-1"],
    ["there is no token", { token: null }, "role-1"],
    ["there is no role", { currentRole: undefined }, undefined],
  ])("does not poll when %s", (_case, state, roleId) => {
    useUserStore.setState(state);
    renderWithCount(null);

    expect(mockUseAlertCount).toHaveBeenCalledWith(false, roleId, CLASSIC_HOST);
  });

  it("opens Alert Management on click", () => {
    renderWithCount(1);

    fireEvent.click(getButton());

    expectAlertManagementOpened();
  });

  it("opens Alert Management with the keyboard shortcut", () => {
    renderWithCount(1);

    fireEvent.keyDown(document, { key: "F8" });

    expectAlertManagementOpened();
  });

  it("opens Alert Management with an empty base URL while the runtime config is not loaded", () => {
    mockRuntimeConfig = null;
    renderWithCount(1);

    fireEvent.click(getButton());

    expectAlertManagementOpened("");
    expect(mockUseAlertCount).toHaveBeenCalledWith(true, "role-1", undefined);
  });
});

describe("formatAlertCount", () => {
  it.each([
    [null, "-"],
    [0, "0"],
    [4, "4"],
  ])("formats %p as %p", (count, expected) => {
    expect(formatAlertCount(count)).toBe(expected);
  });
});

describe("hasPendingAlerts", () => {
  it.each([
    [null, false],
    [0, false],
    [1, true],
  ])("for a count of %p returns %p", (count, expected) => {
    expect(hasPendingAlerts(count)).toBe(expected);
  });
});
