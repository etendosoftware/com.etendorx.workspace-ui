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

jest.mock("next/cache", () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }));
jest.mock("@/app/actions/revalidate", () => ({ revalidateDopoProcess: jest.fn() }));

import { act, renderHook } from "@testing-library/react";
import { buildFormInitializationParams, fetchFormInitialization } from "@/utils/hooks/useFormInitialization/utils";
import { useWindowStore } from "@/stores/windowStore";
import { TAB_MODES } from "@/utils/url/constants";
import { SELECTION_SETTLE_MS } from "@/hooks/useSettledValue";
import { useToolbar } from "../useToolbar";

jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/utils/hooks/useFormInitialization/utils", () => ({
  ...jest.requireActual("@/utils/hooks/useFormInitialization/utils"),
  fetchFormInitialization: jest.fn(),
  buildFormInitializationParams: jest.fn(() => ({})),
  buildFormInitializationPayload: jest.fn(() => ({})),
}));
jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => "win1",
  useCurrentWindowId: () => "W1",
}));

const mockTab = { id: "tab1", window: "W1", fields: { id: { column: { keyColumn: true }, hqlName: "id" } } };
const mockTabContext = { tab: mockTab, parentRecord: null, parentTab: null, auxiliaryInputs: {} };
jest.mock("@/contexts/tab", () => ({ useTabContext: () => mockTabContext }));

let mockSelected: Array<{ id: string }> = [];
jest.mock("@/hooks/useSelectedRecords", () => ({ useSelectedRecords: () => mockSelected }));

const mockFormFields = {
  fields: {
    actionFields: {
      pay: { columnName: "Pay", displayed: true, displayLogicExpression: "context.APRM_OrderIsPaid !== 'Y'" },
    },
  },
};
jest.mock("@/hooks/useFormFields", () => ({ __esModule: true, default: () => mockFormFields }));

const fetchCount = () => (fetchFormInitialization as jest.Mock).mock.calls.length;

const select = (rerender: () => void, id: string) => {
  mockSelected = [{ id }];
  rerender();
};

describe("useToolbar auxiliary inputs", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (fetchFormInitialization as jest.Mock).mockReset().mockResolvedValue({ auxiliaryInputValues: {} });
    (buildFormInitializationParams as jest.Mock).mockClear();
    useWindowStore.setState({ windows: {} } as never);
    mockSelected = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fetches them once for a single selection", () => {
    const { rerender } = renderHook(() => useToolbar("W1", "tab1"));
    act(() => select(rerender, "R1"));
    expect(fetchCount()).toBe(1);
  });

  it("fetches only the first and the last record of a fast burst of selections", () => {
    const { rerender } = renderHook(() => useToolbar("W1", "tab1"));
    act(() => select(rerender, "R1"));
    act(() => jest.advanceTimersByTime(100));
    act(() => select(rerender, "R2"));
    act(() => jest.advanceTimersByTime(100));
    act(() => select(rerender, "R3"));
    expect(fetchCount()).toBe(1);

    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));

    expect(fetchCount()).toBe(2);
    const fetchedRecordIds = (buildFormInitializationParams as jest.Mock).mock.calls.map(([args]) => args.recordId);
    expect(fetchedRecordIds).toEqual(["R1", "R3"]);
  });

  it("does not apply a late response for a record the user moved past", async () => {
    const pending: Record<string, (value: unknown) => void> = {};
    (fetchFormInitialization as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          const recordId = (buildFormInitializationParams as jest.Mock).mock.calls.at(-1)[0].recordId;
          pending[recordId] = resolve;
        })
    );
    const paid = { auxiliaryInputValues: { APRM_OrderIsPaid: { value: "Y" } } };
    const { result, rerender } = renderHook(() => useToolbar("W1", "tab1"));
    act(() => select(rerender, "R1"));
    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));
    act(() => select(rerender, "R2"));

    // R1's "paid" context arrives after the user moved to R2: the button stays.
    await act(async () => pending.R1(paid));
    expect(result.current.processButtons).toHaveLength(1);

    // R2's own response applies.
    await act(async () => pending.R2(paid));
    expect(result.current.processButtons).toHaveLength(0);
  });

  it("does not fetch them while the tab is in form view", () => {
    useWindowStore.setState({
      windows: { win1: { tabs: { tab1: { form: { mode: TAB_MODES.FORM, recordId: "R1" } } } } },
    } as never);
    const { rerender } = renderHook(() => useToolbar("W1", "tab1"));
    act(() => select(rerender, "R1"));
    expect(fetchCount()).toBe(0);
  });
});
