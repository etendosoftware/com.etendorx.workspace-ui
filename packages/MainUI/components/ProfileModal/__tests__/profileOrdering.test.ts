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

import { compareClassicNames, sortByName, sortRoleTree, toOption } from "../profileOrdering";
import {
  CLASSIC_ORDER_ORGANIZATIONS,
  CLASSIC_ORDER_WAREHOUSES,
  SERVER_ORDER_ORGANIZATIONS,
  createServerOrderRole,
} from "../test-utils/profileModalProps";

const named = (names: string[]) => names.map((name, index) => ({ id: `id-${index}`, name }));
const namesOf = (items: { name: string }[]) => items.map((item) => item.name);

describe("compareClassicNames", () => {
  it("ignores the letter case, as SmartClient sortByProperty does", () => {
    expect(compareClassicNames("alpha", "ALPHA")).toBe(0);
    expect(compareClassicNames("beta", "Alpha")).toBeGreaterThan(0);
  });

  it("puts an accented letter next to its plain letter instead of after z", () => {
    expect(compareClassicNames("Ébano", "Zeta")).toBeLessThan(0);
    expect(compareClassicNames("eagle", "Ébano")).toBeLessThan(0);
  });
});

describe("sortByName", () => {
  it("lists the organizations of the ETP-6332 example as Classic", () => {
    expect(namesOf(sortByName(named(SERVER_ORDER_ORGANIZATIONS)))).toEqual(CLASSIC_ORDER_ORGANIZATIONS);
  });

  it("returns a copy and leaves the given list untouched", () => {
    const items = named(SERVER_ORDER_ORGANIZATIONS);
    const sorted = sortByName(items);

    expect(sorted).not.toBe(items);
    expect(namesOf(items)).toEqual(SERVER_ORDER_ORGANIZATIONS);
  });

  it("keeps the relative order of equal names", () => {
    const sorted = sortByName([
      { id: "first", name: "Same" },
      { id: "second", name: "same" },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["first", "second"]);
  });
});

describe("sortRoleTree", () => {
  it("keeps the server order of the roles", () => {
    const roles = [createServerOrderRole("role-b"), createServerOrderRole("role-a")];

    expect(sortRoleTree(roles).map((role) => role.id)).toEqual(["role-b", "role-a"]);
  });

  it("sorts the organizations of every role and the warehouses of every organization", () => {
    const [role] = sortRoleTree([createServerOrderRole("role-1")]);
    const [firstOrganization] = role.organizations;

    expect(namesOf(role.organizations)).toEqual(CLASSIC_ORDER_ORGANIZATIONS);
    expect(namesOf(firstOrganization.warehouses)).toEqual(
      CLASSIC_ORDER_WAREHOUSES.map((name) => `${firstOrganization.name} ${name}`)
    );
  });

  it("does not change the roles of the session", () => {
    const roles = [createServerOrderRole("role-1")];

    sortRoleTree(roles);

    expect(namesOf(roles[0].organizations)).toEqual(SERVER_ORDER_ORGANIZATIONS);
  });

  it("tolerates a role without organizations and an organization without warehouses", () => {
    const roles = [
      { id: "empty", name: "Empty", client: "client-1", organizations: undefined },
      {
        id: "bare",
        name: "Bare",
        client: "client-1",
        organizations: [{ id: "org", name: "Org", warehouses: undefined }],
      },
    ];

    // biome-ignore lint/suspicious/noExplicitAny: the session can omit the lists the type declares
    const [empty, bare] = sortRoleTree(roles as any);

    expect(empty.organizations).toEqual([]);
    expect(bare.organizations[0].warehouses).toEqual([]);
  });
});

describe("toOption", () => {
  it("builds the select option of an entity", () => {
    expect(toOption({ id: "wh-1", name: "WH 1" })).toEqual({ title: "WH 1", value: "wh-1", id: "wh-1" });
  });
});
