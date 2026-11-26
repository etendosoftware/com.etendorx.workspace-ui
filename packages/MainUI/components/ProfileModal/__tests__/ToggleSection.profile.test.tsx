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

import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import SelectorList from "../ToggleSection";
import type { SelectorListProps } from "../types";
import { ROLE_ID, createRole } from "../test-utils/profileModalProps";

/** Options each select of the panel received, by select id. */
const mockOptions: Record<string, Option[]> = {};

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ getFlag: () => "", getLabel: (key: string) => key }),
}));

jest.mock("@workspaceui/componentlibrary/src/components/Input/Select", () => ({
  __esModule: true,
  default: ({ id, options }: { id: string; options: Option[] }) => {
    mockOptions[id] = options;
    return null;
  },
}));

const ROLE_OPTION = { id: ROLE_ID, value: ROLE_ID, title: "Role" };

describe("SelectorList — profile panel", () => {
  it("offers the warehouses of every organization in the Classic order when the organization has none", () => {
    const role = {
      ...createRole(ROLE_ID),
      organizations: [
        { id: "org-empty", name: "Empty", warehouses: [] },
        { id: "org-b", name: "B", warehouses: [{ id: "wh-z", name: "Zeta" }] },
        { id: "org-a", name: "A", warehouses: [{ id: "wh-a", name: "almacén" }] },
      ],
    };

    render(
      <ThemeProvider theme={theme}>
        <SelectorList
          {...({
            section: "profile",
            roles: [role],
            languages: [],
            selectedRole: ROLE_OPTION,
            selectedClient: { id: "client-1", value: "client-1", title: "client-1" },
            selectedOrg: { id: "org-empty", value: "org-empty", title: "Empty" },
            selectedWarehouse: null,
            translations: { saveAsDefault: "saveAsDefault" },
            // biome-ignore lint/suspicious/noExplicitAny: the callbacks and password props are not exercised here
          } as any as SelectorListProps)}
        />
      </ThemeProvider>
    );

    expect(mockOptions["warehouse-select"].map((option) => option.title)).toEqual(["almacén", "Zeta"]);
  });
});
