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

import { act, render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import ProfileModal from "../ProfileModal";
import type { SelectorListProps } from "../types";
import {
  CLASSIC_ORDER_ORGANIZATIONS,
  CLASSIC_ORDER_WAREHOUSES,
  OTHER_ROLE_ID,
  ROLE_ID,
  createProfileModalProps,
  createRole,
  createServerOrderRole,
} from "../test-utils/profileModalProps";

/** Props the modal last passed to the selector panel. */
let mockSelectorProps: SelectorListProps;

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US", getFlag: () => "", getLabel: (key: string) => key }),
}));

jest.mock("@/hooks/useSSO", () => ({
  useSSO: () => ({ config: { enabled: false }, startLink: jest.fn() }),
}));

// Only the selection the modal hands to the selector panel matters here.
jest.mock("../ToggleSection", () => ({
  __esModule: true,
  default: (props: SelectorListProps) => {
    mockSelectorProps = props;
    return null;
  },
}));
jest.mock("../ToggleButton", () => ({ __esModule: true, default: () => null }));
jest.mock("../UserProfile", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const SECOND_ORGANIZATION = CLASSIC_ORDER_ORGANIZATIONS[1];
const LAST_ORGANIZATION = CLASSIC_ORDER_ORGANIZATIONS.at(-1) as string;

/** The option the role or organization select hands to its change handler. */
const optionOf = (id: string, title = id): Option => ({ id, value: id, title });
/** The first warehouse Classic fills in for an organization of `createServerOrderRole`. */
const firstWarehouseOf = (organization: string) => `${organization} ${CLASSIC_ORDER_WAREHOUSES[0]}`;

const renderModal = (extraRoles: ReturnType<typeof createRole>[] = []) =>
  render(
    <ThemeProvider theme={theme}>
      <ProfileModal
        {...createProfileModalProps({
          saveAsDefault: false,
          roles: [createRole(ROLE_ID), createServerOrderRole(OTHER_ROLE_ID), ...extraRoles],
        })}
      />
    </ThemeProvider>
  );

const changeRole = (roleId: string) =>
  act(() => mockSelectorProps.onRoleChange({} as React.SyntheticEvent, optionOf(roleId)));

const changeOrganization = (organization: string) =>
  act(() => mockSelectorProps.onOrgChange({} as React.SyntheticEvent, optionOf(`org-${organization}`, organization)));

describe("ProfileModal — organization and warehouse filled in as Classic", () => {
  it("passes the organizations to the selectors in the Classic order", () => {
    renderModal();

    const role = mockSelectorProps.roles.find((candidate) => candidate.id === OTHER_ROLE_ID);
    expect(role?.organizations.map((organization) => organization.name)).toEqual(CLASSIC_ORDER_ORGANIZATIONS);
  });

  it("fills in the first sorted organization and its first sorted warehouse on a role change", () => {
    renderModal();

    changeRole(OTHER_ROLE_ID);

    expect(mockSelectorProps.selectedOrg.title).toBe(CLASSIC_ORDER_ORGANIZATIONS[0]);
    expect(mockSelectorProps.selectedWarehouse?.title).toBe(firstWarehouseOf(CLASSIC_ORDER_ORGANIZATIONS[0]));
  });

  it("fills in the first sorted warehouse of the organization on an organization change", () => {
    renderModal();
    changeRole(OTHER_ROLE_ID);

    changeOrganization(LAST_ORGANIZATION);

    expect(mockSelectorProps.selectedOrg.title).toBe(LAST_ORGANIZATION);
    expect(mockSelectorProps.selectedWarehouse?.title).toBe(firstWarehouseOf(LAST_ORGANIZATION));
  });

  it("does not keep the selection of the previous role when coming back to it", () => {
    renderModal();
    changeRole(OTHER_ROLE_ID);
    changeOrganization(SECOND_ORGANIZATION);

    changeRole(ROLE_ID);
    changeRole(OTHER_ROLE_ID);

    expect(mockSelectorProps.selectedOrg.title).toBe(CLASSIC_ORDER_ORGANIZATIONS[0]);
  });

  it("falls back to the * organization and no warehouse for a role without organizations", () => {
    renderModal([{ ...createRole("bare"), organizations: [] }]);

    changeRole("bare");

    expect(mockSelectorProps.selectedOrg.value).toBe("0");
    expect(mockSelectorProps.selectedWarehouse).toBeNull();
  });
});
