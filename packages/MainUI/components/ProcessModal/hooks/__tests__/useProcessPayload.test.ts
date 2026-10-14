/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { renderHook } from "@testing-library/react";
import type { UseFormReturn } from "react-hook-form";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { toMultiSelectorPayloadValue, useProcessPayload } from "../useProcessPayload";

const MULTI_SELECTOR_COLUMN = "BusinessPartner";
const STRING_COLUMN = "RecOrPay";

const PARAMETERS = {
  [MULTI_SELECTOR_COLUMN]: {
    name: MULTI_SELECTOR_COLUMN,
    dBColumnName: MULTI_SELECTOR_COLUMN,
    reference: FIELD_REFERENCE_CODES.MULTI_SELECTOR.id,
  },
  [STRING_COLUMN]: {
    name: STRING_COLUMN,
    dBColumnName: STRING_COLUMN,
    reference: FIELD_REFERENCE_CODES.STRING.id,
  },
} as unknown as Record<string, ProcessParameter>;

/** Renders the hook over a form holding `values` and returns the mapped payload values. */
const mapFormValues = (values: Record<string, unknown>) => {
  const form = { getValues: () => values } as unknown as UseFormReturn;
  const { result } = renderHook(() =>
    useProcessPayload({
      form,
      parameters: PARAMETERS,
      gridSelection: {},
      record: undefined,
      recordValues: undefined,
      processId: "PROC-1",
      selectedRecords: [],
    })
  );
  return result.current.getMappedFormValues();
};

describe("toMultiSelectorPayloadValue", () => {
  it.each([
    ["undefined", undefined, []],
    ["null", null, []],
    ["an empty string", "", []],
    ["a single id", "ID1", ["ID1"]],
    ["a comma-separated id list", "ID1,ID2", ["ID1", "ID2"]],
    ["an array with empty entries", ["ID1", "", 3], ["ID1"]],
  ])("converts %s into the classic id array", (_label, value, expected) => {
    expect(toMultiSelectorPayloadValue(value)).toEqual(expected);
  });
});

describe("useProcessPayload — getMappedFormValues", () => {
  it("sends an empty multi-selector as [] like Classic", () => {
    expect(mapFormValues({ [STRING_COLUMN]: "RECEIVABLES" })[MULTI_SELECTOR_COLUMN]).toEqual([]);
  });

  it("sends a selected multi-selector as an id array", () => {
    expect(mapFormValues({ [MULTI_SELECTOR_COLUMN]: "ID1,ID2" })[MULTI_SELECTOR_COLUMN]).toEqual(["ID1", "ID2"]);
  });

  it("leaves non multi-selector values untouched", () => {
    expect(mapFormValues({ [STRING_COLUMN]: "RECEIVABLES" })[STRING_COLUMN]).toBe("RECEIVABLES");
  });
});
