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

import { renderHook, act } from "@testing-library/react";
import { RecordProvider, RecordContext } from "../record";
import { useContext } from "react";
import type { ReactNode } from "react";

// Mock the ensureString helper
jest.mock("@workspaceui/componentlibrary/src/helpers/ensureString", () => ({
  ensureString: (value: any) => (value ? String(value) : ""),
}));

describe("RecordContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => <RecordProvider>{children}</RecordProvider>;

  const useRecordContext = () => useContext(RecordContext);

  // Helper: Create mock record
  const createMockRecord = (overrides?: Partial<any>) => ({
    id: "org-1",
    documentNo: { value: "DOC-001" },
    transactionDocument: { value: "Invoice" },
    ...overrides,
  });

  // Helper: Render hook with context
  const renderRecordHook = () => renderHook(() => useRecordContext(), { wrapper });

  // Helper: Set and verify record
  const setAndVerifyRecord = (result: any, record: any) => {
    act(() => {
      result.current.setSelectedRecord(record);
    });
    expect(result.current.selectedRecord).toBe(record);
  };

  // Helper: Expect formatted result
  const expectFormattedResult = (result: any, record: any, expected: { identifier: string; type: string }) => {
    const formatted = result.current.getFormattedRecord(record);
    expect(formatted).toEqual(expected);
  };

  it("should provide initial selected record as null", () => {
    const { result } = renderRecordHook();

    expect(result.current.selectedRecord).toBe(null);
  });

  it("should provide setSelectedRecord function", () => {
    const { result } = renderRecordHook();

    expect(typeof result.current.setSelectedRecord).toBe("function");
  });

  it("should provide getFormattedRecord function", () => {
    const { result } = renderRecordHook();

    expect(typeof result.current.getFormattedRecord).toBe("function");
  });

  it("should update selected record when setSelectedRecord is called", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord();

    setAndVerifyRecord(result, mockRecord);
  });

  it("should clear selected record when setSelectedRecord is called with null", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord();

    setAndVerifyRecord(result, mockRecord);

    act(() => {
      result.current.setSelectedRecord(null);
    });

    expect(result.current.selectedRecord).toBe(null);
  });

  it("should return null when getFormattedRecord is called with null", () => {
    const { result } = renderRecordHook();

    const formatted = result.current.getFormattedRecord(null);

    expect(formatted).toBe(null);
  });

  it("should format record correctly with valid documentNo and transactionDocument", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord();

    expectFormattedResult(result, mockRecord, {
      identifier: "DOC-001",
      type: "Invoice",
    });
  });

  it("should use fallback text when documentNo is missing", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord({ documentNo: undefined });

    expectFormattedResult(result, mockRecord, {
      identifier: "No item selected",
      type: "Invoice",
    });
  });

  it("should use fallback text when transactionDocument is missing", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord({ transactionDocument: undefined });

    expectFormattedResult(result, mockRecord, {
      identifier: "DOC-001",
      type: "No type",
    });
  });

  it("should use fallback text when both documentNo and transactionDocument are missing", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord({ documentNo: undefined, transactionDocument: undefined });

    expectFormattedResult(result, mockRecord, {
      identifier: "No item selected",
      type: "No type",
    });
  });

  it("should handle empty string values", () => {
    const { result } = renderRecordHook();
    const mockRecord = createMockRecord({
      documentNo: { value: "" },
      transactionDocument: { value: "" },
    });

    expectFormattedResult(result, mockRecord, {
      identifier: "No item selected",
      type: "No type",
    });
  });

  it("should maintain stable getFormattedRecord reference", () => {
    const { result, rerender } = renderRecordHook();

    const getFormattedRecordRef = result.current.getFormattedRecord;

    rerender();

    expect(result.current.getFormattedRecord).toBe(getFormattedRecordRef);
  });

  it("should handle multiple record updates", () => {
    const { result } = renderRecordHook();

    const mockRecord1 = createMockRecord({ id: "org-1", documentNo: { value: "DOC-001" } });
    const mockRecord2 = createMockRecord({ id: "org-2", documentNo: { value: "DOC-002" }, transactionDocument: { value: "Order" } });

    setAndVerifyRecord(result, mockRecord1);
    setAndVerifyRecord(result, mockRecord2);
  });

  it("should work with multiple consumers sharing the same provider", () => {
    let sharedSetSelectedRecord: ((record: any) => void) | null = null;

    const { result: result1 } = renderRecordHook();

    sharedSetSelectedRecord = result1.current.setSelectedRecord;

    const mockRecord = createMockRecord();

    act(() => {
      sharedSetSelectedRecord!(mockRecord);
    });

    expect(result1.current.selectedRecord).toBe(mockRecord);
  });

  it("should handle records with nested properties", () => {
    const { result } = renderRecordHook();

    const mockRecord = createMockRecord({
      documentNo: { value: "DOC-001", label: "Document 001" },
      transactionDocument: { value: "Invoice", description: "Sales Invoice" },
      metadata: {
        createdAt: "2025-01-01",
        updatedAt: "2025-01-02",
      },
    });

    setAndVerifyRecord(result, mockRecord);

    expectFormattedResult(result, mockRecord, {
      identifier: "DOC-001",
      type: "Invoice",
    });
  });

  it("should have correct context type structure", () => {
    const { result } = renderRecordHook();

    expect(result.current).toHaveProperty("selectedRecord");
    expect(result.current).toHaveProperty("setSelectedRecord");
    expect(result.current).toHaveProperty("getFormattedRecord");
    expect(Object.keys(result.current).length).toBe(3);
  });

  it("should handle rapid state changes", () => {
    const { result } = renderRecordHook();

    const mockRecord1 = createMockRecord({ id: "org-1", documentNo: { value: "DOC-001" } });
    const mockRecord2 = createMockRecord({ id: "org-2", documentNo: { value: "DOC-002" } });
    const mockRecord3 = createMockRecord({ id: "org-3", documentNo: { value: "DOC-003" } });

    act(() => {
      result.current.setSelectedRecord(mockRecord1);
      result.current.setSelectedRecord(mockRecord2);
      result.current.setSelectedRecord(mockRecord3);
    });

    expect(result.current.selectedRecord).toBe(mockRecord3);
  });
});
