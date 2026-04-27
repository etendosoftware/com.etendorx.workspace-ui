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

import { buildSelectorContextFormValues } from "../useTableDirDatasource";

jest.mock("@/contexts/tab", () => ({ useTabContext: jest.fn() }));
jest.mock("react-hook-form", () => ({ useFormContext: jest.fn() }));
jest.mock("@/hooks/useFormParent", () => ({ __esModule: true, default: jest.fn(() => ({})) }));
jest.mock("@/hooks/useUserContext", () => ({ useUserContext: jest.fn(() => ({ currentWarehouse: null })) }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({ datasource: { client: { post: jest.fn() } } }));

describe("buildSelectorContextFormValues", () => {
  const formValues = {
    inpadOrgId: "org1",
    inpcBpartnerId: "bp1",
    myParam: "val1",
    isConverted: "Y",
    "Lead Status": "open",
    $Element_PJ: "something",
    UPPERCASE_KEY: "x",
    inpadClientId: "client1",
  } as Record<string, any>;

  describe("when hqlSources is empty (no HQL available)", () => {
    it("includes inp* fields", () => {
      const result = buildSelectorContextFormValues("", formValues);
      expect(result).toHaveProperty("inpadOrgId", "org1");
      expect(result).toHaveProperty("inpcBpartnerId", "bp1");
      expect(result).toHaveProperty("inpadClientId", "client1");
    });

    it("includes lowercase camelCase process param keys", () => {
      const result = buildSelectorContextFormValues("", formValues);
      expect(result).toHaveProperty("isConverted", "Y");
    });

    it("excludes keys with spaces", () => {
      const result = buildSelectorContextFormValues("", formValues);
      expect(result).not.toHaveProperty("Lead Status");
    });

    it("excludes $ prefixed keys", () => {
      const result = buildSelectorContextFormValues("", formValues);
      expect(result).not.toHaveProperty("$Element_PJ");
    });

    it("excludes UPPERCASE keys", () => {
      const result = buildSelectorContextFormValues("", formValues);
      expect(result).not.toHaveProperty("UPPERCASE_KEY");
    });
  });

  describe("when hqlSources contains HQL with @param@ placeholders", () => {
    it("includes only @param@ referenced keys and inpad* fields", () => {
      const hql = "e.businessPartner.id = @myParam@ AND e.isActive = 'Y'";
      const result = buildSelectorContextFormValues(hql, formValues);
      expect(result).toHaveProperty("myParam", "val1");
      expect(result).toHaveProperty("inpadOrgId", "org1");
      expect(result).toHaveProperty("inpadClientId", "client1");
    });

    it("excludes inp* fields not in @param@ placeholders", () => {
      const hql = "e.id = @myParam@";
      const result = buildSelectorContextFormValues(hql, formValues);
      expect(result).not.toHaveProperty("inpcBpartnerId");
    });

    it("handles multiple @param@ placeholders", () => {
      const hql = "e.status = @isConverted@ AND e.org.id = @myParam@";
      const result = buildSelectorContextFormValues(hql, formValues);
      expect(result).toHaveProperty("isConverted", "Y");
      expect(result).toHaveProperty("myParam", "val1");
    });

    it("returns empty object when no params match", () => {
      const hql = "e.status = @nonExistentParam@";
      const result = buildSelectorContextFormValues(hql, formValues);
      expect(Object.keys(result).filter((k) => !k.startsWith("inpad"))).toHaveLength(0);
    });
  });
});
