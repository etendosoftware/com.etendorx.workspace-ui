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

import type { ProfileModalProps } from "../types";

export const ROLE_ID = "role-1";
export const OTHER_ROLE_ID = "role-2";
export const RELOAD_LANGUAGE = "es_ES";

/**
 * Builds a role as listed in the session, with one organization and one warehouse.
 *
 * @param id the role id
 * @returns the role
 */
export const createRole = (id: string) => ({
  id,
  name: `Role ${id}`,
  client: "client-1",
  organizations: [{ id: "org-1", name: "Org 1", warehouses: [{ id: "wh-1", name: "WH 1" }] }],
});

/**
 * Builds the props of `ProfileModal` for a session on `ROLE_ID`, with every callback stubbed.
 *
 * @param overrides props replacing the defaults
 * @returns the props
 */
export const createProfileModalProps = (overrides: Partial<ProfileModalProps> = {}): ProfileModalProps =>
  ({
    icon: null,
    userPhotoUrl: "",
    userName: "John Doe",
    userEmail: "john@example.com",
    sections: [],
    section: "profile",
    translations: { saveAsDefault: "saveAsDefault" },
    saveAsDefault: true,
    onSaveAsDefaultChange: jest.fn(),
    onSetDefaultConfiguration: jest.fn(),
    onPasswordChange: jest.fn(),
    currentRole: { id: ROLE_ID, name: "Role 1", client: "client-1" },
    currentWarehouse: { id: "wh-1", name: "WH 1" },
    currentOrganization: { id: "org-1", name: "Org 1" },
    currentClient: { id: "client-1", name: "Client 1" },
    roles: [createRole(ROLE_ID), createRole(OTHER_ROLE_ID)],
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
    onLanguageChange: jest.fn(),
    language: "en_US",
    languages: [
      { id: "lang-en", language: "en_US", name: "English" },
      { id: "lang-es", language: RELOAD_LANGUAGE, name: "Spanish" },
    ],
    languagesFlags: "",
    changeProfile: jest.fn(),
    ...overrides,
    // biome-ignore lint/suspicious/noExplicitAny: the untested props are stubbed above
  }) as any;
