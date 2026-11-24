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

import type { Column } from "../../api/types";
import { LegacyColumnFilterUtils } from "../search-utils";

const FIELD = "product$characteristicDescription";
const EXISTS_QUERY =
  "exists (from ProductCharacteristicValue v where e.product = v.product and v.characteristicValue.id in ($value))";
const FORMATO = "C_FOR";
const CERTIFICACION = "C_CER";

const column = { id: FIELD, columnName: FIELD, name: FIELD } as unknown as Column;

const option = (id: string, characteristic?: string) => ({
  id,
  label: id,
  value: id,
  existsQuery: EXISTS_QUERY,
  characteristic,
});

/** Builds the datasource criteria for the selected options of the characteristics column. */
const buildCriteria = (value: unknown[]) =>
  LegacyColumnFilterUtils.createColumnFilterCriteria([{ id: FIELD, value }], [column]);

const existsCriteria = (ids: string[]) => ({
  fieldName: FIELD,
  operator: "exists",
  value: ids,
  existsQuery: EXISTS_QUERY,
});

describe("LegacyColumnFilterUtils - Product Characteristics filter", () => {
  it("combines values of the same characteristic with OR and characteristics with AND, as Classic", () => {
    const criteria = buildCriteria([
      option("330", FORMATO),
      option("BIO", CERTIFICACION),
      option("VEG", CERTIFICACION),
    ]);

    expect(criteria).toEqual([
      {
        _constructor: "AdvancedCriteria",
        operator: "and",
        isProductCharacteristicsCriteria: true,
        criteria: [existsCriteria(["330"]), existsCriteria(["BIO", "VEG"])],
      },
    ]);
  });

  it("keeps values without characteristic in a single group", () => {
    const [criteria] = buildCriteria([option("A"), option("B")]) as unknown as Array<{ criteria: unknown[] }>;

    expect(criteria.criteria).toEqual([existsCriteria(["A", "B"])]);
  });

  it("ignores characteristic nodes and builds nothing without values", () => {
    expect(buildCriteria([{ ...option("C_FOR"), isCharacteristic: true }])).toEqual([]);
  });
});
