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

import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  CHARACTERISTICS_EXISTS_QUERY,
  buildCharacteristicsExistsQuery,
  buildCharacteristicsLabel,
  buildCharacteristicsTreeParams,
  buildChildrenMap,
  buildGridCharacteristicsContext,
  buildLeafIdsIndex,
  buildProcessCharacteristicsContext,
  getCheckState,
  resolveProductPath,
  stripCharacteristicsCriteria,
  toAppliedFilterOptions,
  toggleLeafSelection,
} from "../characteristicsFilter";
import { VALUE_IDS, buildCharacteristicsTreeOptions, pickOptions } from "../test-utils/characteristicsTree";

const DESCRIPTION_FIELD = "characteristicDescription";
const LINE_PRODUCT_FIELD = "product$characteristicDescription";
const PRODUCT_ENTITY = "Product";
const NAME_CRITERIA = { fieldName: "name", operator: "iContains", value: "Cola" };
const CHARACTERISTICS_CRITERIA = { operator: "and", isProductCharacteristicsCriteria: true, criteria: [] };

const BOTTLE_LEAVES = [VALUE_IDS.VIDRIO, VALUE_IDS.PET, VALUE_IDS.VIDRIO_RETORNABLE];

const buildIndex = () => {
  const nodes = buildCharacteristicsTreeOptions();
  return buildLeafIdsIndex(nodes, buildChildrenMap(nodes));
};

describe("characteristicsFilter", () => {
  describe("resolveProductPath", () => {
    it.each([
      [DESCRIPTION_FIELD, undefined, undefined, "e"],
      [LINE_PRODUCT_FIELD, undefined, undefined, "e.product"],
      ["relatedProduct$characteristicDescription", undefined, undefined, "e.relatedProduct"],
      [DESCRIPTION_FIELD, PRODUCT_ENTITY, "e", "e"],
      [DESCRIPTION_FIELD, "ProductWithCharacteristics", "e", "e.product"],
      [LINE_PRODUCT_FIELD, "CreatePOLinesPE", "e", "e.product"],
    ])("resolves %s of %s with alias %s to %s", (fieldName, entityName, alias, expected) => {
      expect(resolveProductPath(fieldName, entityName, alias)).toBe(expected);
    });
  });

  it("builds the Classic exists query for a product path", () => {
    const query = buildCharacteristicsExistsQuery("e.product");

    expect(query).toBe(CHARACTERISTICS_EXISTS_QUERY.replace("{productInEntity}", "e.product"));
    expect(query).toContain("where e.product = v.product");
    expect(query).toContain("in ($value)");
  });

  describe("tree selection", () => {
    it("maps groups and characteristics to all the leaves below them, and a leaf to itself", () => {
      const index = buildIndex();

      expect(index.get(VALUE_IDS.BOTELLA)).toEqual(BOTTLE_LEAVES);
      expect(index.get("C_ENV")).toEqual([...BOTTLE_LEAVES, VALUE_IDS.LATA]);
      expect(index.get(VALUE_IDS.LATA)).toEqual([VALUE_IDS.LATA]);
    });

    it("does not loop on a circular reference", () => {
      const nodes = [
        { id: "a", label: "A", parentId: "b" },
        { id: "b", label: "B", parentId: "a" },
      ];

      expect(buildLeafIdsIndex(nodes, buildChildrenMap(nodes)).get("a")).toEqual(["a"]);
    });

    it("reports checked, partially checked and unchecked groups", () => {
      const leaves = buildIndex().get(VALUE_IDS.BOTELLA) ?? [];

      expect(getCheckState(leaves, new Set())).toBe("unchecked");
      expect(getCheckState(leaves, new Set([VALUE_IDS.VIDRIO]))).toBe("indeterminate");
      expect(getCheckState(leaves, new Set(BOTTLE_LEAVES))).toBe("checked");
    });

    it("selects every value of a group, completes a partial group and unselects a full one", () => {
      const selected = toggleLeafSelection([VALUE_IDS.BIO], BOTTLE_LEAVES);
      expect(selected).toEqual([VALUE_IDS.BIO, ...BOTTLE_LEAVES]);

      expect(toggleLeafSelection([VALUE_IDS.PET], BOTTLE_LEAVES)).toEqual([
        VALUE_IDS.PET,
        VALUE_IDS.VIDRIO,
        VALUE_IDS.VIDRIO_RETORNABLE,
      ]);
      expect(toggleLeafSelection(selected, BOTTLE_LEAVES)).toEqual([VALUE_IDS.BIO]);
    });
  });

  describe("buildCharacteristicsLabel", () => {
    const label = (selected: string[]) => buildCharacteristicsLabel(buildCharacteristicsTreeOptions(), selected);

    it("lists the values of each characteristic as Classic", () => {
      expect(label([VALUE_IDS.ML_330, VALUE_IDS.BIO, VALUE_IDS.VEGANO])).toBe(
        "Formato:[330 ml], Certificación:[Vegano - Bio]"
      );
    });

    it("shows a complete group without inner groups by its name", () => {
      expect(label([VALUE_IDS.VIDRIO_RETORNABLE])).toBe("Envase:[Retornable]");
    });

    it("shows the values of a complete group that has inner groups", () => {
      expect(label(BOTTLE_LEAVES)).toBe("Envase:[Vidrio - PET - Retornable]");
    });

    it("lists the applied values when the tree is not loaded", () => {
      expect(
        buildCharacteristicsLabel(pickOptions([VALUE_IDS.LATA, VALUE_IDS.ML_500]), [VALUE_IDS.LATA, VALUE_IDS.ML_500])
      ).toBe("Envase:[Lata], Formato:[500 ml]");
    });

    it("is empty without selection", () => {
      expect(label([])).toBe("");
    });
  });

  describe("stripCharacteristicsCriteria", () => {
    it("removes the characteristics criteria from a list", () => {
      expect(stripCharacteristicsCriteria([NAME_CRITERIA, CHARACTERISTICS_CRITERIA])).toEqual([NAME_CRITERIA]);
    });

    it("accepts a single criteria, JSON strings and nothing", () => {
      expect(stripCharacteristicsCriteria(NAME_CRITERIA)).toEqual([NAME_CRITERIA]);
      expect(stripCharacteristicsCriteria([JSON.stringify(NAME_CRITERIA), "{not json"])).toEqual([NAME_CRITERIA]);
      expect(stripCharacteristicsCriteria(undefined)).toEqual([]);
    });
  });

  describe("contexts", () => {
    it("restricts the tree of a standard window to the grid records and criteria", () => {
      const context = buildGridCharacteristicsContext(
        FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id,
        PRODUCT_ENTITY,
        () => ({ criteria: [NAME_CRITERIA, CHARACTERISTICS_CRITERIA] })
      );

      expect(context).toBeDefined();
      expect(buildCharacteristicsTreeParams(context ?? {}, "e")).toEqual({
        _parentDSIdentifier: PRODUCT_ENTITY,
        _propertyPath: "e",
        _processId: undefined,
        _buttonOwnerContextInfo: undefined,
        criteria: [NAME_CRITERIA],
      });
    });

    it("has no context for other references", () => {
      expect(
        buildGridCharacteristicsContext(FIELD_REFERENCE_CODES.TREE_REFERENCE.id, PRODUCT_ENTITY, () => ({}))
      ).toBeUndefined();
    });

    it("sends the process and the launching record in a Pick and Execute grid", () => {
      const context = buildProcessCharacteristicsContext("ManageVariants", "process-1", { inpmProductId: "P1" });

      expect(context).toEqual({
        entityName: "ManageVariants",
        alias: "e",
        processId: "process-1",
        buttonOwnerContextInfo: JSON.stringify({ inpmProductId: "P1" }),
      });
      expect(buildCharacteristicsTreeParams(context, "e.product").criteria).toEqual([]);
      expect(buildProcessCharacteristicsContext(undefined, undefined, undefined).buttonOwnerContextInfo).toBe("{}");
    });
  });

  it("reads the options of an applied filter", () => {
    const options = pickOptions([VALUE_IDS.BIO]);

    expect(toAppliedFilterOptions(options)).toBe(options);
    expect(toAppliedFilterOptions("Bio")).toEqual([]);
  });
});
