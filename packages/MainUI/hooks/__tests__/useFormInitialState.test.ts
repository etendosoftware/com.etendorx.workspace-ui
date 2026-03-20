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
import { useFormInitialState } from "../useFormInitialState";
import { useTabContext } from "@/contexts/tab";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import useFormParent from "../useFormParent";

jest.mock("@/contexts/tab");
jest.mock("@workspaceui/api-client/src/utils/metadata");
jest.mock("../useFormParent");

describe("useFormInitialState", () => {
  const mockTab = {
    id: "tabId",
    fields: {
      field1: { hqlName: "field1", columnName: "COL1" },
      propField: {
        hqlName: "propField",
        inputName: "inp_propertyField_type_Type",
        column: { propertyPath: "file.type" },
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab });
    (getFieldsByColumnName as jest.Mock).mockReturnValue({
      COL1: mockTab.fields.field1,
    });
    (useFormParent as jest.Mock).mockReturnValue({ parentId: "123" });
  });

  it("should return null if no formInitialization", () => {
    const { result } = renderHook(() => useFormInitialState(null));
    expect(result.current).toBeNull();
  });

  it("should process column values correctly", () => {
    const formInit = {
      columnValues: {
        COL1: { value: "val1", identifier: "ID1" },
      },
    } as any;

    const { result } = renderHook(() => useFormInitialState(formInit));

    expect(result.current).toEqual(
      expect.objectContaining({
        field1: "val1",
        field1$_identifier: "ID1",
        parentId: "123",
      })
    );
  });

  it("should handle property fields by stripping 'inp' prefix", () => {
    const formInit = {
      columnValues: {
        _propertyField_type_Type: { value: "propVal", identifier: "PropID" },
      },
    } as any;

    const { result } = renderHook(() => useFormInitialState(formInit));

    expect(result.current).toEqual(
      expect.objectContaining({
        propField: "propVal",
        propField$_identifier: "PropID",
      })
    );
  });

  it("should convert boolean values from Etendo format", () => {
    (getFieldsByColumnName as jest.Mock).mockReturnValue({
      BOOL_COL: {
        hqlName: "boolField",
        column: { reference: "20" }, // Boolean reference
      },
    });

    const formInit = {
      columnValues: {
        BOOL_COL: { value: "Y" },
      },
    } as any;

    const { result } = renderHook(() => useFormInitialState(formInit));
    expect(result.current?.boolField).toBe(true);

    const formInit2 = {
      columnValues: {
        BOOL_COL: { value: "" },
      },
    } as any;

    const { result: result2 } = renderHook(() => useFormInitialState(formInit2));
    expect(result2.current?.boolField).toBe(false);
  });

  it("should handle entries for dropdown fields", () => {
    const formInit = {
      columnValues: {
        COL1: {
          value: "val1",
          entries: [{ id: "e1", _identifier: "Entry 1" }],
        },
      },
    } as any;

    const { result } = renderHook(() => useFormInitialState(formInit));

    expect(result.current?.field1$_entries).toEqual([{ id: "e1", label: "Entry 1" }]);
  });

  it("should merge session attributes", () => {
    const formInit = {
      sessionAttributes: { sessionKey: "sessionVal" },
      columnValues: {},
    } as any;

    const { result } = renderHook(() => useFormInitialState(formInit));
    expect(result.current?.sessionKey).toBe("sessionVal");
  });
});
