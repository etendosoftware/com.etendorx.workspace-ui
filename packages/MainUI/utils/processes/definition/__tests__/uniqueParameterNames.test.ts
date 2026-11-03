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

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { parameterLabel, withUniqueParameterNames } from "../uniqueParameterNames";

const SHARED_NAME = "There is a difference of";

const param = (name: string, dBColumnName: string, sequenceNumber?: number): ProcessParameter =>
  ({ name, dBColumnName, sequenceNumber }) as unknown as ProcessParameter;

describe("withUniqueParameterNames", () => {
  it("returns the same parameters when every name is unique", () => {
    const parameters = { a: param("Amount", "amount"), b: param("Total", "total") };

    expect(withUniqueParameterNames(parameters)).toBe(parameters);
  });

  it("keeps the shared name for the first by sequence and keys the others by column name", () => {
    const parameters = {
      expectedDifference: param(SHARED_NAME, "expectedDifference", 1110),
      difference: param(SHARED_NAME, "difference", 200),
    };

    const unique = withUniqueParameterNames(parameters);

    expect(unique.difference).toBe(parameters.difference);
    expect(unique.expectedDifference.name).toBe("expectedDifference");
    expect(unique.expectedDifference.label).toBe(SHARED_NAME);
  });

  it("keeps the map order when the parameters have no sequence", () => {
    const parameters = { first: param(SHARED_NAME, "first"), second: param(SHARED_NAME, "second") };

    const unique = withUniqueParameterNames(parameters);

    expect(unique.first.name).toBe(SHARED_NAME);
    expect(unique.second.name).toBe("second");
  });
});

describe("parameterLabel", () => {
  it("captions a renamed parameter with its shared name, any other with its name", () => {
    expect(parameterLabel({ name: "expectedDifference", label: SHARED_NAME })).toBe(SHARED_NAME);
    expect(parameterLabel({ name: "Amount" })).toBe("Amount");
  });
});
