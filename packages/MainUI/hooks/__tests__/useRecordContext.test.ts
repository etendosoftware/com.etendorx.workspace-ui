/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook } from "@testing-library/react";
import { useRecordContext } from "../useRecordContext";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { buildPayloadByInputName } from "@/utils/index";
import { buildContextString } from "@/utils/contextUtils";
import { useTranslation } from "../useTranslation";

jest.mock("@/contexts/tab");
jest.mock("@/hooks/useSelectedRecords");
jest.mock("../useTranslation");
jest.mock("@/utils/index");
jest.mock("@/utils/contextUtils");

describe("useRecordContext hook", () => {
  const mockTab = { id: "tab1", fields: {}, name: "MyTab" } as any;
  const mockRecord = { id: "rec1", _identifier: "Rec 1" } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab });
    (useSelectedRecords as jest.Mock).mockReturnValue([]);
    (useTranslation as jest.Mock).mockReturnValue({ t: (k: string) => k });
  });

  it("should return empty state when no records are selected", () => {
    (buildContextString as jest.Mock).mockReturnValue("");
    const { result } = renderHook(() => useRecordContext());

    expect(result.current.selectedRecords).toEqual([]);
    expect(result.current.hasSelectedRecords).toBe(false);
    expect(result.current.contextItems).toEqual([]);
  });

  it("should build context items when records are selected", () => {
    (useSelectedRecords as jest.Mock).mockReturnValue([mockRecord]);
    (buildPayloadByInputName as jest.Mock).mockReturnValue({ inp1: "v1" });
    (buildContextString as jest.Mock).mockReturnValue("built context string");

    const { result } = renderHook(() => useRecordContext());

    expect(result.current.hasSelectedRecords).toBe(true);
    expect(result.current.contextItems).toHaveLength(1);
    expect(result.current.contextItems[0]).toEqual({
      id: "tab1-rec1",
      label: "MyTab-Rec 1",
      contextString: JSON.stringify({ inp1: "v1" }, null, 2),
      recordId: "rec1",
    });
    expect(result.current.contextString).toBe("built context string");
  });

  it("should use tab title if available", () => {
    const tabWithTitle = { ...mockTab, title: "Custom Title" };
    (useTabContext as jest.Mock).mockReturnValue({ tab: tabWithTitle });
    (useSelectedRecords as jest.Mock).mockReturnValue([mockRecord]);

    const { result } = renderHook(() => useRecordContext());

    expect(result.current.contextItems[0].label).toContain("Custom Title");
  });
});
