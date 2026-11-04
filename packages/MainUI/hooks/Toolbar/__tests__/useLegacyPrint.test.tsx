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

import { act, renderHook } from "@testing-library/react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useUserStore } from "@/stores/userStore";
import { useLegacyPrint } from "../useLegacyPrint";
import { BPARTNER_TAB, NO_PRINT_TAB, OTHER_SAVED_RECORD, SAVED_RECORD } from "@/utils/toolbar/test-utils/printFixtures";

const mockNotifyPopupBlocked = jest.fn();
jest.mock("@/utils/reportPopup", () => ({
  notifyReportPopupBlocked: (...args: unknown[]) => mockNotifyPopupBlocked(...args),
}));

const DEFAULT_RUNTIME_CONFIG = { config: { etendoClassicHost: "https://host/etendo" }, loading: false };
const mockUseRuntimeConfig = jest.fn(() => DEFAULT_RUNTIME_CONFIG);
jest.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => mockUseRuntimeConfig(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const openSpy = jest.spyOn(window, "open");
const openedUrl = () => new URL(String(openSpy.mock.calls[0][0]));

const renderLegacyPrint = (tab: Tab = BPARTNER_TAB, selectedRecords: EntityData[] = [SAVED_RECORD]) =>
  renderHook(() => useLegacyPrint({ tab, selectedRecords }));

const print = (tab?: Tab, selectedRecords?: EntityData[]) => {
  const { result } = renderLegacyPrint(tab, selectedRecords);
  act(() => result.current.printLegacy());
};

describe("useLegacyPrint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openSpy.mockReturnValue({} as Window);
    useUserStore.setState({ token: "jwt" });
  });

  afterAll(() => openSpy.mockRestore());

  it("opens the classic print page with the selected records", () => {
    print(BPARTNER_TAB, [SAVED_RECORD, OTHER_SAVED_RECORD]);

    const url = openedUrl();
    expect(url.pathname).toContain("/meta/legacy/businessUtility/PrinterReports.html");
    expect(url.searchParams.get("inphiddenvalue")).toBe(`${SAVED_RECORD.id},${OTHER_SAVED_RECORD.id}`);
    expect(url.searchParams.get("token")).toBe("jwt");
    expect(mockNotifyPopupBlocked).not.toHaveBeenCalled();
  });

  it("builds a host-relative URL while the runtime config is not loaded", () => {
    mockUseRuntimeConfig.mockReturnValueOnce({ config: null, loading: true } as never);

    print();

    expect(String(openSpy.mock.calls[0][0]).startsWith("/meta/legacy/")).toBe(true);
  });

  it("offers to retry when the browser blocks the window", () => {
    openSpy.mockReturnValue(null);

    print();

    expect(mockNotifyPopupBlocked).toHaveBeenCalledWith(expect.any(Function), {
      title: "print.popupBlocked",
      openLabel: "print.openPopup",
    });
    const retry = mockNotifyPopupBlocked.mock.calls[0][0] as () => void;
    retry();
    expect(openSpy).toHaveBeenCalledTimes(2);
  });

  it.each<[string, Tab, EntityData[]]>([
    ["the tab has no print process", NO_PRINT_TAB, [SAVED_RECORD]],
    ["nothing is selected", BPARTNER_TAB, []],
  ])("does nothing when %s", (_label, tab, selectedRecords) => {
    print(tab, selectedRecords);

    expect(openSpy).not.toHaveBeenCalled();
  });
});
