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

  it("should provide initial selected record as null", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    expect(result.current.selectedRecord).toBe(null);
  });

  it("should provide setSelectedRecord function", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    expect(typeof result.current.setSelectedRecord).toBe("function");
  });

  it("should provide getFormattedRecord function", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    expect(typeof result.current.getFormattedRecord).toBe("function");
  });

  it("should update selected record when setSelectedRecord is called", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "DOC-001" },
      transactionDocument: { value: "Invoice" },
    };

    act(() => {
      result.current.setSelectedRecord(mockRecord);
    });

    expect(result.current.selectedRecord).toBe(mockRecord);
  });

  it("should clear selected record when setSelectedRecord is called with null", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "DOC-001" },
      transactionDocument: { value: "Invoice" },
    };

    act(() => {
      result.current.setSelectedRecord(mockRecord);
    });

    expect(result.current.selectedRecord).toBe(mockRecord);

    act(() => {
      result.current.setSelectedRecord(null);
    });

    expect(result.current.selectedRecord).toBe(null);
  });

  it("should return null when getFormattedRecord is called with null", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const formatted = result.current.getFormattedRecord(null);

    expect(formatted).toBe(null);
  });

  it("should format record correctly with valid documentNo and transactionDocument", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "DOC-001" },
      transactionDocument: { value: "Invoice" },
    };

    const formatted = result.current.getFormattedRecord(mockRecord);

    expect(formatted).toEqual({
      identifier: "DOC-001",
      type: "Invoice",
    });
  });

  it("should use fallback text when documentNo is missing", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      transactionDocument: { value: "Invoice" },
    };

    const formatted = result.current.getFormattedRecord(mockRecord);

    expect(formatted).toEqual({
      identifier: "No item selected",
      type: "Invoice",
    });
  });

  it("should use fallback text when transactionDocument is missing", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "DOC-001" },
    };

    const formatted = result.current.getFormattedRecord(mockRecord);

    expect(formatted).toEqual({
      identifier: "DOC-001",
      type: "No type",
    });
  });

  it("should use fallback text when both documentNo and transactionDocument are missing", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
    };

    const formatted = result.current.getFormattedRecord(mockRecord);

    expect(formatted).toEqual({
      identifier: "No item selected",
      type: "No type",
    });
  });

  it("should handle empty string values", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "" },
      transactionDocument: { value: "" },
    };

    const formatted = result.current.getFormattedRecord(mockRecord);

    expect(formatted).toEqual({
      identifier: "No item selected",
      type: "No type",
    });
  });

  it("should maintain stable getFormattedRecord reference", () => {
    const { result, rerender } = renderHook(() => useRecordContext(), { wrapper });

    const getFormattedRecordRef = result.current.getFormattedRecord;

    rerender();

    expect(result.current.getFormattedRecord).toBe(getFormattedRecordRef);
  });

  it("should handle multiple record updates", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord1: any = {
      id: "org-1",
      documentNo: { value: "DOC-001" },
      transactionDocument: { value: "Invoice" },
    };

    const mockRecord2: any = {
      id: "org-2",
      documentNo: { value: "DOC-002" },
      transactionDocument: { value: "Order" },
    };

    act(() => {
      result.current.setSelectedRecord(mockRecord1);
    });

    expect(result.current.selectedRecord).toBe(mockRecord1);

    act(() => {
      result.current.setSelectedRecord(mockRecord2);
    });

    expect(result.current.selectedRecord).toBe(mockRecord2);
  });

  it("should work with multiple consumers sharing the same provider", () => {
    // Create a shared provider instance
    let sharedSetSelectedRecord: ((record: any) => void) | null = null;

    const { result: result1 } = renderHook(() => useRecordContext(), { wrapper });

    // Capture the shared function
    sharedSetSelectedRecord = result1.current.setSelectedRecord;

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "DOC-001" },
      transactionDocument: { value: "Invoice" },
    };

    act(() => {
      sharedSetSelectedRecord!(mockRecord);
    });

    expect(result1.current.selectedRecord).toBe(mockRecord);
  });

  it("should handle records with nested properties", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord: any = {
      id: "org-1",
      documentNo: { value: "DOC-001", label: "Document 001" },
      transactionDocument: { value: "Invoice", description: "Sales Invoice" },
      metadata: {
        createdAt: "2025-01-01",
        updatedAt: "2025-01-02",
      },
    };

    act(() => {
      result.current.setSelectedRecord(mockRecord);
    });

    expect(result.current.selectedRecord).toEqual(mockRecord);

    const formatted = result.current.getFormattedRecord(mockRecord);

    expect(formatted).toEqual({
      identifier: "DOC-001",
      type: "Invoice",
    });
  });

  it("should have correct context type structure", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    expect(result.current).toHaveProperty("selectedRecord");
    expect(result.current).toHaveProperty("setSelectedRecord");
    expect(result.current).toHaveProperty("getFormattedRecord");
    expect(Object.keys(result.current).length).toBe(3);
  });

  it("should handle rapid state changes", () => {
    const { result } = renderHook(() => useRecordContext(), { wrapper });

    const mockRecord1: any = { id: "org-1", documentNo: { value: "DOC-001" } };
    const mockRecord2: any = { id: "org-2", documentNo: { value: "DOC-002" } };
    const mockRecord3: any = { id: "org-3", documentNo: { value: "DOC-003" } };

    act(() => {
      result.current.setSelectedRecord(mockRecord1);
      result.current.setSelectedRecord(mockRecord2);
      result.current.setSelectedRecord(mockRecord3);
    });

    expect(result.current.selectedRecord).toBe(mockRecord3);
  });
});
