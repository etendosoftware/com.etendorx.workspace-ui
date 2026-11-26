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

import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { RoleList } from "@workspaceui/api-client/src/api/types";

/** Any entity of the profile menu: role, organization or warehouse. */
interface NamedEntity {
  id: string;
  name: string;
}

/**
 * Compares two names as the Classic profile widget orders its lists: `user-info.js.ftl` sorts the
 * organizations and the warehouses with SmartClient `sortByProperty('_identifier', true)`, which
 * lowercases the texts and compares them with `localeCompare` in the browser locale.
 *
 * @param a the first name
 * @param b the second name
 * @returns a negative number when `a` goes first, a positive one when `b` does, 0 when equal
 */
export function compareClassicNames(a: string, b: string): number {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

/**
 * Sorts entities by name with the Classic rule, without changing the given list. Equal names keep
 * their relative order.
 *
 * @param items the entities to sort
 * @returns a sorted copy
 */
export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareClassicNames(a.name, b.name));
}

/**
 * Orders the role tree of the session as Classic shows it in the profile menu: the roles keep the
 * order of the server (Classic does not sort them), while the organizations of each role and the
 * warehouses of each organization are sorted by name. The first organization and warehouse of the
 * result are therefore the ones Classic fills in on a role or organization change.
 *
 * @param roles the roles of the session
 * @returns a copy of the roles with sorted organizations and warehouses
 */
export function sortRoleTree(roles: RoleList): RoleList {
  return roles.map((role) => ({
    ...role,
    organizations: sortByName(role.organizations ?? []).map((organization) => ({
      ...organization,
      warehouses: sortByName(organization.warehouses ?? []),
    })),
  }));
}

/**
 * Builds the select option of an entity of the profile menu.
 *
 * @param entity the role, organization or warehouse
 * @returns its option
 */
export function toOption(entity: NamedEntity): Option {
  return { title: entity.name, value: entity.id, id: entity.id };
}
