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

import { renderHook } from "@testing-library/react";
import useRecordValues from "../useRecordValues";
import { useTabContext } from "@/contexts/tab";
import { buildPayloadByInputName } from "@/utils";

// Mocks
jest.mock("@/contexts/tab");
jest.mock("@/utils");

describe("useRecordValues hook", () => {
  const mockTab = { fields: { field1: {} } } as any;
  const mockRecord = { field1: "val1" } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab, record: null });
  });

  it("should return an empty object when no record is present", () => {
    const { result } = renderHook(() => useRecordValues());
    expect(result.current).toEqual({});
  });

  it("should call buildPayloadByInputName when record is present", () => {
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab, record: mockRecord });
    (buildPayloadByInputName as jest.Mock).mockReturnValue({ inpfield1: "val1" });

    const { result } = renderHook(() => useRecordValues());

    expect(buildPayloadByInputName).toHaveBeenCalledWith(mockRecord, mockTab.fields);
    expect(result.current).toEqual({ inpfield1: "val1" });
  });

  it("should memoize the result", () => {
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab, record: mockRecord });
    (buildPayloadByInputName as jest.Mock).mockReturnValue({ inpfield1: "val1" });

    const { result, rerender } = renderHook(() => useRecordValues());
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
