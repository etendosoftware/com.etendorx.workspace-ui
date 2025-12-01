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
import * as utils from "@/utils";

// Mock dependencies
jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(),
}));

jest.mock("@/utils", () => ({
  buildPayloadByInputName: jest.fn(),
}));

// Import after mocking
import { useTabContext } from "@/contexts/tab";

const mockUseTabContext = useTabContext as jest.MockedFunction<typeof useTabContext>;
const mockBuildPayloadByInputName = utils.buildPayloadByInputName as jest.MockedFunction<
  typeof utils.buildPayloadByInputName
>;

describe("useRecordValues", () => {
  const mockTab = {
    id: "test-tab",
    fields: {
      name: { id: "name", inputName: "name", columnName: "name" },
      description: { id: "description", inputName: "description", columnName: "description" },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty object when record is null", () => {
    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: null,
    } as any);

    const { result } = renderHook(() => useRecordValues());

    expect(result.current).toEqual({});
    expect(mockBuildPayloadByInputName).not.toHaveBeenCalled();
  });

  it("should return empty object when record is undefined", () => {
    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: undefined,
    } as any);

    const { result } = renderHook(() => useRecordValues());

    expect(result.current).toEqual({});
    expect(mockBuildPayloadByInputName).not.toHaveBeenCalled();
  });

  it("should call buildPayloadByInputName when record exists", () => {
    const mockRecord = {
      id: "record-1",
      name: "Test Record",
      description: "Test Description",
    };

    const mockPayload = {
      name: "Test Record",
      description: "Test Description",
    };

    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: mockRecord,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue(mockPayload);

    const { result } = renderHook(() => useRecordValues());

    expect(mockBuildPayloadByInputName).toHaveBeenCalledWith(mockRecord, mockTab.fields);
    expect(result.current).toEqual(mockPayload);
  });

  it("should memoize result when record and fields do not change", () => {
    const mockRecord = {
      id: "record-1",
      name: "Test Record",
    };

    const mockPayload = { name: "Test Record" };

    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: mockRecord,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue(mockPayload);

    const { result, rerender } = renderHook(() => useRecordValues());

    const firstResult = result.current;
    expect(mockBuildPayloadByInputName).toHaveBeenCalledTimes(1);

    // Rerender without changing dependencies
    rerender();

    expect(result.current).toBe(firstResult);
    expect(mockBuildPayloadByInputName).toHaveBeenCalledTimes(1);
  });

  it("should recompute when record changes", () => {
    const mockRecord1 = {
      id: "record-1",
      name: "Record 1",
    };

    const mockRecord2 = {
      id: "record-2",
      name: "Record 2",
    };

    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: mockRecord1,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue({ name: "Record 1" });

    const { result, rerender } = renderHook(() => useRecordValues());

    expect(result.current).toEqual({ name: "Record 1" });
    expect(mockBuildPayloadByInputName).toHaveBeenCalledWith(mockRecord1, mockTab.fields);

    // Change record
    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: mockRecord2,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue({ name: "Record 2" });

    rerender();

    expect(result.current).toEqual({ name: "Record 2" });
    expect(mockBuildPayloadByInputName).toHaveBeenCalledWith(mockRecord2, mockTab.fields);
    expect(mockBuildPayloadByInputName).toHaveBeenCalledTimes(2);
  });

  it("should recompute when tab fields change", () => {
    const mockRecord = {
      id: "record-1",
      name: "Test Record",
    };

    const mockTab1 = {
      id: "test-tab",
      fields: {
        name: { id: "name", inputName: "name" },
      },
    };

    const mockTab2 = {
      id: "test-tab",
      fields: {
        name: { id: "name", inputName: "name" },
        description: { id: "description", inputName: "description" },
      },
    };

    mockUseTabContext.mockReturnValue({
      tab: mockTab1,
      record: mockRecord,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue({ name: "Test Record" });

    const { result, rerender } = renderHook(() => useRecordValues());

    expect(mockBuildPayloadByInputName).toHaveBeenCalledWith(mockRecord, mockTab1.fields);

    // Change tab fields
    mockUseTabContext.mockReturnValue({
      tab: mockTab2,
      record: mockRecord,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue({
      name: "Test Record",
      description: undefined,
    });

    rerender();

    expect(mockBuildPayloadByInputName).toHaveBeenCalledWith(mockRecord, mockTab2.fields);
    expect(mockBuildPayloadByInputName).toHaveBeenCalledTimes(2);
  });

  it("should handle complex record objects", () => {
    const mockRecord = {
      id: "record-1",
      name: "Test Record",
      description: "Description",
      nested: {
        value: "nested value",
      },
      array: [1, 2, 3],
    };

    const mockPayload = {
      name: "Test Record",
      description: "Description",
      nested: { value: "nested value" },
      array: [1, 2, 3],
    };

    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: mockRecord,
    } as any);

    mockBuildPayloadByInputName.mockReturnValue(mockPayload);

    const { result } = renderHook(() => useRecordValues());

    expect(result.current).toEqual(mockPayload);
    expect(mockBuildPayloadByInputName).toHaveBeenCalledWith(mockRecord, mockTab.fields);
  });

  it("should return same empty object reference for consecutive null records", () => {
    mockUseTabContext.mockReturnValue({
      tab: mockTab,
      record: null,
    } as any);

    const { result, rerender } = renderHook(() => useRecordValues());

    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
