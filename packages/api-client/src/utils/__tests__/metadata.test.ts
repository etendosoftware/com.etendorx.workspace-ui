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

import {
  groupTabsByLevel,
  buildFormState,
  isEntityReference,
  getFieldsByColumnName,
  getFieldsByInputName,
  getFieldsByHqlName,
} from "../metadata";
import { FieldType } from "../../api/types";

describe("Metadata Utils", () => {
  describe("groupTabsByLevel", () => {
    it("should group tabs by level correctly", () => {
      const windowData = {
        tabs: [
          { id: "tab1", tabLevel: 0 },
          { id: "tab2", tabLevel: 1 },
          { id: "tab3", tabLevel: 0 },
        ],
      } as any;

      const grouped = groupTabsByLevel(windowData);
      expect(grouped[0]).toHaveLength(2);
      expect(grouped[0][0].id).toBe("tab1");
      expect(grouped[0][1].id).toBe("tab3");
      expect(grouped[1]).toHaveLength(1);
      expect(grouped[1][0].id).toBe("tab2");
    });

    it("should return empty array if no tabs", () => {
      expect(groupTabsByLevel({} as any)).toEqual([]);
      expect(groupTabsByLevel()).toEqual([]);
    });
  });

  describe("buildFormState", () => {
    it("should build form state from fields and record", () => {
      const fields = {
        f1: { inputName: "input1", hqlName: "prop1" },
        f2: { inputName: "input2", hqlName: "prop2" },
      } as any;
      const record = { prop1: "val1", prop2: "val2" };

      const state = buildFormState(fields, record, {});
      expect(state).toEqual({
        input1: "val1",
        input2: "val2",
      });
    });

    it("should include auxiliary inputs", () => {
      const fields = {
        f1: { inputName: "input1", hqlName: "prop1" },
      } as any;
      const record = { prop1: "val1" };
      const formState = {
        auxiliaryInputValues: {
          aux1: { value: "auxVal1" },
        },
      } as any;

      const state = buildFormState(fields, record, formState);
      expect(state).toEqual({
        input1: "val1",
        aux1: "auxVal1",
      });
    });
  });

  describe("isEntityReference", () => {
    it("should identify entity references", () => {
      expect(isEntityReference(FieldType.SELECT)).toBe(true);
      expect(isEntityReference(FieldType.TABLEDIR)).toBe(true);
    });
  });

  describe("Field mapping utils", () => {
    const mockTab = {
      fields: {
        f1: { columnName: "col1", inputName: "in1", hqlName: "hql1" },
        f2: { columnName: "col2", inputName: "in2", hqlName: "hql2" },
      },
    } as any;

    it("getFieldsByColumnName", () => {
      const mapping = getFieldsByColumnName(mockTab);
      expect(mapping.col1.inputName).toBe("in1");
      expect(mapping.col2.inputName).toBe("in2");
    });

    it("getFieldsByInputName", () => {
      const mapping = getFieldsByInputName(mockTab);
      expect(mapping.in1.columnName).toBe("col1");
      expect(mapping.in2.columnName).toBe("col2");
    });

    it("getFieldsByHqlName", () => {
      const mapping = getFieldsByHqlName(mockTab);
      expect(mapping.hql1.columnName).toBe("col1");
      expect(mapping.hql2.columnName).toBe("col2");
    });
  });
});
