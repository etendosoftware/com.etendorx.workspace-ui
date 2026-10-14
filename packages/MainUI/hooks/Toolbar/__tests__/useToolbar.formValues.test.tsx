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
import { createSmartContext } from "@/utils/expressions";
import { createFormValuesStore } from "@/contexts/tabFormValuesStore";
import { useToolbar } from "../useToolbar";

jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/utils/expressions", () => {
  const actual = jest.requireActual("@/utils/expressions");
  return { ...actual, createSmartContext: jest.fn(actual.createSmartContext) };
});

const mockStore = createFormValuesStore();
const mockTab = { id: "tab1", window: "W1", fields: {} };
const mockTabContext = {
  tab: mockTab,
  parentRecord: null,
  parentTab: null,
  auxiliaryInputs: {},
  formValuesStore: mockStore,
};
jest.mock("@/contexts/tab", () => ({ useTabContext: () => mockTabContext }));

const mockSelected = [{ id: "R1", docStatus: "DR", cBpartnerId: "A1B2C3D4E5F60718293A4B5C6D7E8F90" }];
jest.mock("@/hooks/useSelectedRecords", () => ({ useSelectedRecords: () => mockSelected }));

const mockFormFields = {
  fields: {
    actionFields: {
      complete: {
        columnName: "DocAction",
        displayed: true,
        displayLogicExpression: "OB.Utilities.getValue(currentValues,'docStatus') === 'DR'",
      },
      post: {
        columnName: "Posted",
        displayed: true,
        displayLogicExpression: "OB.Utilities.getValue(currentValues,'cBpartnerId') !== ''",
      },
    },
  },
};
jest.mock("@/hooks/useFormFields", () => ({ __esModule: true, default: () => mockFormFields }));

describe("useToolbar process buttons and form values", () => {
  beforeEach(() => {
    act(() => mockStore.set({}));
    (createSmartContext as jest.Mock).mockClear();
  });

  it("does not re-evaluate the buttons when a field they do not read changes", () => {
    const { result } = renderHook(() => useToolbar("W1", "tab1"));
    expect(result.current.processButtons).toHaveLength(2);
    const builds = (createSmartContext as jest.Mock).mock.calls.length;

    act(() => mockStore.set((prev) => ({ ...prev, description: "perf" })));
    act(() => mockStore.set((prev) => ({ ...prev, description: "perf-check" })));

    expect((createSmartContext as jest.Mock).mock.calls.length).toBe(builds);
  });

  it("re-evaluates the buttons with the edited value when a field they read changes", () => {
    const { result } = renderHook(() => useToolbar("W1", "tab1"));
    expect(result.current.processButtons).toHaveLength(2);

    act(() => mockStore.set((prev) => ({ ...prev, docStatus: "CO" })));

    expect(result.current.processButtons.map((b) => b.columnName)).toEqual(["Posted"]);
  });

  it("re-evaluates the buttons when only the identifier of a field they read is cleared", () => {
    const { result } = renderHook(() => useToolbar("W1", "tab1"));
    expect(result.current.processButtons).toHaveLength(2);

    act(() => mockStore.set((prev) => ({ ...prev, cBpartnerId$_identifier: "" })));

    expect(result.current.processButtons.map((b) => b.columnName)).toEqual(["DocAction"]);
  });
});
