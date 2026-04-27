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
 * All portions are Copyright © 2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { extractDependenciesFromExpression } from "../../expressions/dependencies";
import type { Field } from "@workspaceui/api-client/src/api/types";

describe("extractDependenciesFromExpression", () => {
  describe("Token extraction without field metadata", () => {
    it("extracts a simple camelCase @fieldName@ token", () => {
      expect(extractDependenciesFromExpression("@fieldName@='Y'")).toEqual(["fieldName"]);
    });

    it("extracts snake_case @field_name@ token as-is when no fields map", () => {
      expect(extractDependenciesFromExpression("@trxtype_display_logic@='Y'")).toEqual(["trxtype_display_logic"]);
    });

    it("extracts UPPER_SNAKE @FIELD_NAME@ token as-is when no fields map", () => {
      expect(extractDependenciesFromExpression("@FIELD_NAME@='Y'")).toEqual(["FIELD_NAME"]);
    });

    it("extracts multiple unique deps from a complex expression", () => {
      const deps = extractDependenciesFromExpression("@fieldA@='Y' & @fieldB@='N' | @fieldC@='X'");
      expect(new Set(deps)).toEqual(new Set(["fieldA", "fieldB", "fieldC"]));
    });

    it("returns unique deps when the same field appears multiple times", () => {
      const deps = extractDependenciesFromExpression("@fieldA@='Y' & @fieldA@='Z'");
      expect(deps).toEqual(["fieldA"]);
    });
  });

  describe("# and $ prefixed session/context tokens are excluded", () => {
    it("does NOT include #-prefixed session tokens", () => {
      const deps = extractDependenciesFromExpression("@#AD_Org_ID@='1'");
      expect(deps).toEqual([]);
    });

    it("does NOT include $-prefixed context tokens", () => {
      const deps = extractDependenciesFromExpression("@$contextVar@='X'");
      expect(deps).toEqual([]);
    });

    it("extracts field deps but excludes session deps in mixed expression", () => {
      const deps = extractDependenciesFromExpression("@fieldA@='Y' & @#AD_Org_ID@='1'");
      expect(deps).toEqual(["fieldA"]);
    });
  });

  describe("DB column → HQL name mapping via field metadata", () => {
    const fields: Record<string, Field> = {
      trxtypeDisplayLogic: {
        hqlName: "trxtypeDisplayLogic",
        columnName: "TRXTYPE_DISPLAY_LOGIC",
        column: { dBColumnName: "TRXTYPE_DISPLAY_LOGIC" },
      } as any,
      cBpartner: {
        hqlName: "cBpartner",
        columnName: "C_BPARTNER_ID",
        column: { dBColumnName: "C_BPARTNER_ID" },
      } as any,
    };

    it("maps DB column name to HQL name when metadata is provided", () => {
      const deps = extractDependenciesFromExpression("@TRXTYPE_DISPLAY_LOGIC@='Y'", fields);
      expect(deps).toEqual(["trxtypeDisplayLogic"]);
    });

    it("maps underscore DB column (lowercase token) to HQL name", () => {
      const deps = extractDependenciesFromExpression("@trxtype_display_logic@='Y'", fields);
      expect(deps).toEqual(["trxtypeDisplayLogic"]);
    });

    it("maps C_BPARTNER_ID token to cBpartner HQL name", () => {
      const deps = extractDependenciesFromExpression("@C_BPartner_ID@!=''", fields);
      expect(deps).toEqual(["cBpartner"]);
    });

    it("falls back to the raw token when DB column not found in fields", () => {
      const deps = extractDependenciesFromExpression("@unknownField@='Y'", fields);
      expect(deps).toEqual(["unknownField"]);
    });
  });

  describe("Edge cases", () => {
    it("returns empty array for undefined expression", () => {
      expect(extractDependenciesFromExpression(undefined)).toEqual([]);
    });

    it("returns empty array for empty string", () => {
      expect(extractDependenciesFromExpression("")).toEqual([]);
    });

    it("returns empty array for expression with no @field@ tokens", () => {
      expect(extractDependenciesFromExpression("true")).toEqual([]);
    });
  });
});
