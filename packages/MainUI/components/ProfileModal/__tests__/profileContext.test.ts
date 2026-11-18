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

import { buildProfileContextTooltip, type ProfileContext } from "../profileContext";

const CATALOG: Record<string, string> = {
  UINAVBA_Role: "Role",
  UINAVBA_Client: "Client",
  UINAVBA_Organization: "Organization",
  UINAVBA_Warehouse: "Warehouse",
};
const catalogResolvers = { getLabel: (code: string) => CATALOG[code] ?? code, t: (key: string) => `t:${key}` };

const FULL_CONTEXT: ProfileContext = {
  userName: "John Doe",
  role: { name: "F&B International Group Admin" },
  client: { name: "F&B International Group" },
  organization: { name: "F&B España, S.A" },
  warehouse: { name: "España Región Norte" },
};

describe("buildProfileContextTooltip", () => {
  it("lists the user name and every context item, one per line, with the ERP labels", () => {
    expect(buildProfileContextTooltip(FULL_CONTEXT, catalogResolvers)).toBe(
      [
        "John Doe",
        "Role: F&B International Group Admin",
        "Client: F&B International Group",
        "Organization: F&B España, S.A",
        "Warehouse: España Región Norte",
      ].join("\n")
    );
  });

  it("leaves out the items without a value", () => {
    const context = { ...FULL_CONTEXT, warehouse: undefined, userName: "" };
    expect(buildProfileContextTooltip(context, catalogResolvers).split("\n")).toEqual([
      "Role: F&B International Group Admin",
      "Client: F&B International Group",
      "Organization: F&B España, S.A",
    ]);
  });

  it("uses the local translations when the catalog does not define the labels", () => {
    const resolvers = { ...catalogResolvers, getLabel: (code: string) => code };
    expect(buildProfileContextTooltip({ role: { name: "Admin" } }, resolvers)).toBe(
      "t:navigation.profile.contextRole: Admin"
    );
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(buildProfileContextTooltip({}, catalogResolvers)).toBe("");
  });
});
