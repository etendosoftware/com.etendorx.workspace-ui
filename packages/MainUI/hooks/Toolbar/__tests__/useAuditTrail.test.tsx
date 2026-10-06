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
    useUserStore.setState({ token: "jwt" });
  });

  it("starts with the viewer closed", () => {
    const { result } = renderAuditTrail();
    expect(result.current.modalProps.isOpen).toBe(false);
    expect(result.current.modalProps.url).toBe("");
  });

  it("opens the classic popup for the selected record", () => {
    const { result } = renderAuditTrail();

    act(() => result.current.openAuditTrail());

    const url = new URL(result.current.modalProps.url);
    expect(result.current.modalProps.isOpen).toBe(true);
    expect(url.searchParams.get("inpTabId")).toBe(AUDITED_TAB.id);
    expect(url.searchParams.get("inpTableId")).toBe(AUDITED_TAB.table);
    expect(url.searchParams.get("inpRecordId")).toBe(String(MODIFIED_RECORD.id));
    expect(url.searchParams.get("token")).toBe("jwt");
  });

  it("builds a host-relative URL while the runtime config is not loaded", () => {
    mockUseRuntimeConfig.mockReturnValueOnce({ config: null, loading: true } as never);
    const { result } = renderAuditTrail();

    act(() => result.current.openAuditTrail());

    expect(result.current.modalProps.url.startsWith("/meta/legacy/")).toBe(true);
  });

  it("closes the viewer", () => {
    const { result } = renderAuditTrail();

    act(() => result.current.openAuditTrail());
    act(() => result.current.modalProps.onClose());

    expect(result.current.modalProps.isOpen).toBe(false);
  });

  it("warns instead of opening when several records are selected", () => {
    const { result } = renderAuditTrail({ selectedRecords: [MODIFIED_RECORD, UNMODIFIED_RECORD] });

    act(() => result.current.openAuditTrail());

    expect(toast.warning).toHaveBeenCalledWith("auditTrail.selectOneRecord");
    expect(result.current.modalProps.isOpen).toBe(false);
  });

  const expectNothingOpened = (result: { current: ReturnType<typeof useAuditTrail> }) => {
    act(() => result.current.openAuditTrail());

    expect(result.current.modalProps.isOpen).toBe(false);
    expect(toast.warning).not.toHaveBeenCalled();
  };

  it.each<[string, HookParams]>([
    ["the record was never modified", { selectedRecords: [UNMODIFIED_RECORD] }],
    ["the record is new", { isNewRecord: true }],
  ])("does nothing when %s", (_label, params) => {
    expectNothingOpened(renderAuditTrail(params).result);
  });

  it("does nothing when there is no tab", () => {
    const { result } = renderHook(() => useAuditTrail({ selectedRecords: [MODIFIED_RECORD], isNewRecord: false }));
    expectNothingOpened(result);
  });

  it(`opens the viewer with ${AUDIT_TRAIL_SHORTCUT} when the audited tab is focused`, () => {
    const { result } = renderAuditTrail({ isFocused: true });

    act(() => {
      pressAuditShortcut();
    });

    expect(result.current.modalProps.isOpen).toBe(true);
  });

  it.each<[string, HookParams]>([
    ["the tab is not focused", { isFocused: false }],
    ["the table is not audited", { isFocused: true, tab: NOT_AUDITED_TAB }],
  ])("ignores the shortcut when %s", (_label, params) => {
    const { result } = renderAuditTrail(params);

    act(() => {
      pressAuditShortcut();
    });

    expect(result.current.modalProps.isOpen).toBe(false);
  });

  it("ignores the shortcut when there is no tab", () => {
    const { result } = renderHook(() =>
      useAuditTrail({ selectedRecords: [MODIFIED_RECORD], isNewRecord: false, isFocused: true })
    );

    act(() => {
      pressAuditShortcut();
    });

    expect(result.current.modalProps.isOpen).toBe(false);
  });
});
