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

import { act, fireEvent, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useUserStore } from "@/stores/userStore";
import { AUDIT_TRAIL_SHORTCUT, useAuditTrail } from "../useAuditTrail";
import {
  AUDITED_TAB,
  MODIFIED_RECORD,
  NOT_AUDITED_TAB,
  UNMODIFIED_RECORD,
} from "@/utils/toolbar/test-utils/auditTrailFixtures";

jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }));

const mockNotifyPopupBlocked = jest.fn();
jest.mock("@/utils/reportPopup", () => ({
  notifyReportPopupBlocked: (...args: unknown[]) => mockNotifyPopupBlocked(...args),
}));

const openSpy = jest.spyOn(window, "open");
const openedUrl = () => new URL(String(openSpy.mock.calls[0][0]));

const DEFAULT_RUNTIME_CONFIG = { config: { etendoClassicHost: "http://host/etendo" }, loading: false };
const mockUseRuntimeConfig = jest.fn(() => DEFAULT_RUNTIME_CONFIG);
jest.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => mockUseRuntimeConfig(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

interface HookParams {
  tab?: Tab;
  selectedRecords?: EntityData[];
  isNewRecord?: boolean;
  isFocused?: boolean;
}

const renderAuditTrail = ({
  tab = AUDITED_TAB,
  selectedRecords = [MODIFIED_RECORD],
  isNewRecord = false,
  isFocused = false,
}: HookParams = {}) => renderHook(() => useAuditTrail({ tab, selectedRecords, isNewRecord, isFocused }));

const pressAuditShortcut = () => fireEvent.keyDown(document, { key: "Y", ctrlKey: true, shiftKey: true });

describe("useAuditTrail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openSpy.mockReturnValue({} as Window);
    useUserStore.setState({ token: "jwt" });
  });

  afterAll(() => openSpy.mockRestore());

  const expectNothingOpened = () => {
    expect(openSpy).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  };

  it("opens the classic popup for the selected record", () => {
    const { result } = renderAuditTrail();

    act(() => result.current.openAuditTrail());

    const url = openedUrl();
    expect(url.searchParams.get("inpTabId")).toBe(AUDITED_TAB.id);
    expect(url.searchParams.get("inpTableId")).toBe(AUDITED_TAB.table);
    expect(url.searchParams.get("inpRecordId")).toBe(String(MODIFIED_RECORD.id));
    expect(url.searchParams.get("token")).toBe("jwt");
    expect(mockNotifyPopupBlocked).not.toHaveBeenCalled();
  });

  it("opens the popup without a record when nothing is selected", () => {
    const { result } = renderAuditTrail({ selectedRecords: [] });

    act(() => result.current.openAuditTrail());

    expect(openedUrl().searchParams.has("inpRecordId")).toBe(false);
  });

  it("builds a host-relative URL while the runtime config is not loaded", () => {
    mockUseRuntimeConfig.mockReturnValueOnce({ config: null, loading: true } as never);
    const { result } = renderAuditTrail();

    act(() => result.current.openAuditTrail());

    expect(String(openSpy.mock.calls[0][0]).startsWith("/meta/legacy/")).toBe(true);
  });

  it("offers to retry when the browser blocks the popup", () => {
    openSpy.mockReturnValue(null);
    const { result } = renderAuditTrail();

    act(() => result.current.openAuditTrail());

    expect(mockNotifyPopupBlocked).toHaveBeenCalledWith(expect.any(Function), {
      title: "auditTrail.popupBlocked",
      openLabel: "auditTrail.openPopup",
    });
    const retry = mockNotifyPopupBlocked.mock.calls[0][0] as () => void;
    retry();
    expect(openSpy).toHaveBeenCalledTimes(2);
  });

  it("warns instead of opening when several records are selected", () => {
    const { result } = renderAuditTrail({ selectedRecords: [MODIFIED_RECORD, UNMODIFIED_RECORD] });

    act(() => result.current.openAuditTrail());

    expect(toast.warning).toHaveBeenCalledWith("auditTrail.selectOneRecord");
    expect(openSpy).not.toHaveBeenCalled();
  });

  it.each<[string, HookParams]>([
    ["the record was never modified", { selectedRecords: [UNMODIFIED_RECORD] }],
    ["the record is new", { isNewRecord: true }],
  ])("does nothing when %s", (_label, params) => {
    const { result } = renderAuditTrail(params);
    act(() => result.current.openAuditTrail());
    expectNothingOpened();
  });

  it("does nothing when there is no tab", () => {
    const { result } = renderHook(() => useAuditTrail({ selectedRecords: [MODIFIED_RECORD], isNewRecord: false }));
    act(() => result.current.openAuditTrail());
    expectNothingOpened();
  });

  it(`opens the popup with ${AUDIT_TRAIL_SHORTCUT} when the audited tab is focused`, () => {
    renderAuditTrail({ isFocused: true });

    pressAuditShortcut();

    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it.each<[string, HookParams]>([
    ["the tab is not focused", { isFocused: false }],
    ["the table is not audited", { isFocused: true, tab: NOT_AUDITED_TAB }],
  ])("ignores the shortcut when %s", (_label, params) => {
    renderAuditTrail(params);

    pressAuditShortcut();

    expectNothingOpened();
  });

  it("ignores the shortcut when there is no tab", () => {
    renderHook(() => useAuditTrail({ selectedRecords: [MODIFIED_RECORD], isNewRecord: false, isFocused: true }));

    pressAuditShortcut();

    expectNothingOpened();
  });
});
