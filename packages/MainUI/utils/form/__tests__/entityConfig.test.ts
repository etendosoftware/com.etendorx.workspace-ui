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
  getEntityConfig,
  shouldRemoveIdFields,
  getFieldsToRemove,
  getFieldsToAdd,
  ENTITY_CONFIGURATIONS,
} from "../entityConfig";
import type { FormMode } from "@workspaceui/api-client/src/api/types";

describe("entityConfig", () => {
  // ============================================================================
  // getEntityConfig Tests
  // ============================================================================

  describe("getEntityConfig", () => {
    it.each([
      { entityName: "UOM", shouldExist: true },
      { entityName: "ADUser", shouldExist: true },
      { entityName: "BusinessPartner", shouldExist: true },
    ])("should find config for $entityName", ({ entityName, shouldExist }) => {
      const config = getEntityConfig(entityName);
      expect(config !== undefined).toBe(shouldExist);
      if (shouldExist) {
        expect(config?.entityName).toBe(entityName);
      }
    });

    it.each([
      { entityName: "NonExistentEntity" },
      { entityName: "" },
      { entityName: "uom" }, // Case sensitive
    ])("should return undefined for '$entityName'", ({ entityName }) => {
      expect(getEntityConfig(entityName)).toBeUndefined();
    });
  });

  // ============================================================================
  // shouldRemoveIdFields Tests
  // ============================================================================

  describe("shouldRemoveIdFields", () => {
    describe("entity with removeIdOnCreate", () => {
      const entityName = "UOM";

      it.each<{ mode: FormMode; expected: boolean }>([
        { mode: "NEW", expected: true },
        { mode: "EDIT", expected: false },
      ])("should return $expected for mode $mode", ({ mode, expected }) => {
        expect(shouldRemoveIdFields(entityName, mode)).toBe(expected);
      });
    });

    describe("entity without removeId configuration", () => {
      it.each<{ mode: FormMode }>([{ mode: "NEW" }, { mode: "EDIT" }])(
        "should return false for ADUser in $mode mode",
        ({ mode }) => {
          expect(shouldRemoveIdFields("ADUser", mode)).toBe(false);
        }
      );
    });

    describe("unknown entity", () => {
      it.each<{ mode: FormMode }>([{ mode: "NEW" }, { mode: "EDIT" }])(
        "should return false for unknown entity in $mode mode",
        ({ mode }) => {
          expect(shouldRemoveIdFields("UnknownEntity", mode)).toBe(false);
        }
      );
    });
  });

  // ============================================================================
  // getFieldsToRemove Tests
  // ============================================================================

  describe("getFieldsToRemove", () => {
    it("should return empty array for entity without removeFields config", () => {
      expect(getFieldsToRemove("UOM", "NEW")).toEqual([]);
      expect(getFieldsToRemove("ADUser", "EDIT")).toEqual([]);
    });

    it("should return empty array for unknown entity", () => {
      expect(getFieldsToRemove("UnknownEntity", "NEW")).toEqual([]);
    });

    it("should return empty array for mode without removeFields", () => {
      expect(getFieldsToRemove("BusinessPartner", "EDIT")).toEqual([]);
    });
  });

  // ============================================================================
  // getFieldsToAdd Tests
  // ============================================================================

  describe("getFieldsToAdd", () => {
    it("should return fields to add for ADUser EDIT mode", () => {
      const fields = getFieldsToAdd("ADUser", "EDIT");

      expect(fields).toHaveProperty("inppassword", "***");
      expect(fields).toHaveProperty("_gridVisibleProperties");
      expect(Array.isArray(fields._gridVisibleProperties)).toBe(true);
    });

    it("should return fields to add for BusinessPartner NEW mode", () => {
      const fields = getFieldsToAdd("BusinessPartner", "NEW");

      expect(fields).toHaveProperty("inplastDays", 1000);
    });

    it("should return empty object for entity without addFields config", () => {
      expect(getFieldsToAdd("UOM", "NEW")).toEqual({});
    });

    it("should return empty object for unknown entity", () => {
      expect(getFieldsToAdd("UnknownEntity", "NEW")).toEqual({});
    });

    it("should return empty object for mode without addFields", () => {
      expect(getFieldsToAdd("ADUser", "NEW")).toEqual({});
      expect(getFieldsToAdd("BusinessPartner", "EDIT")).toEqual({});
    });
  });

  // ============================================================================
  // ENTITY_CONFIGURATIONS Structure Tests
  // ============================================================================

  describe("ENTITY_CONFIGURATIONS structure", () => {
    it("should be an array", () => {
      expect(Array.isArray(ENTITY_CONFIGURATIONS)).toBe(true);
    });

    it("should have unique entity names", () => {
      const entityNames = ENTITY_CONFIGURATIONS.map((c) => c.entityName);
      const uniqueNames = new Set(entityNames);
      expect(uniqueNames.size).toBe(entityNames.length);
    });

    it("should have valid structure for all configurations", () => {
      for (const config of ENTITY_CONFIGURATIONS) {
        expect(typeof config.entityName).toBe("string");
        expect(config.entityName.length).toBeGreaterThan(0);

        if (config.removeIdOnCreate !== undefined) {
          expect(typeof config.removeIdOnCreate).toBe("boolean");
        }

        if (config.removeIdOnEdit !== undefined) {
          expect(typeof config.removeIdOnEdit).toBe("boolean");
        }

        if (config.customBehaviors) {
          expect(typeof config.customBehaviors).toBe("object");
        }
      }
    });
  });
});
