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

import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import SelectorList from "../ToggleSection";
import type { SelectorListProps } from "../types";

let mockCatalog: Record<string, string> = {};

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ getFlag: () => "", getLabel: (key: string) => mockCatalog[key] ?? key }),
}));

const renderPasswordPanel = (overrides: Partial<SelectorListProps> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SelectorList
        {...({
          section: "password",
          roles: [],
          languages: [],
          currentPwd: "",
          newPwd: "",
          confirmPwd: "",
          onCurrentPwdChange: jest.fn(),
          onNewPwdChange: jest.fn(),
          onConfirmPwdChange: jest.fn(),
          passwordError: "",
          ...overrides,
          // biome-ignore lint/suspicious/noExplicitAny: the profile-section props are not rendered here
        } as any)}
      />
    </ThemeProvider>
  );

describe("SelectorList — password panel", () => {
  beforeEach(() => {
    mockCatalog = {};
  });

  it("labels the fields with the Classic messages from the ERP catalog", () => {
    mockCatalog = {
      UINAVBA_CurrentPwd: "Current Password",
      UINAVBA_NewPwd: "New Password",
      UINAVBA_ConfirmPwd: "Confirm Password",
    };
    renderPasswordPanel();

    for (const label of ["Current Password", "New Password", "Confirm Password"]) {
      expect(screen.getByLabelText(new RegExp(label), { selector: "input" })).toHaveAttribute("type", "password");
    }
  });

  it("falls back to the local translations when the catalog has no labels", () => {
    renderPasswordPanel();

    expect(screen.getByText("navigation.profile.currentPasswordLabel")).toBeInTheDocument();
    expect(screen.getByText("navigation.profile.confirmPasswordLabel")).toBeInTheDocument();
  });

  it("gives every visibility toggle a translated name and keeps the lock icons out of the tab order", () => {
    renderPasswordPanel();

    expect(screen.getAllByRole("button", { name: "navigation.profile.showPassword" })).toHaveLength(3);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("announces the error", () => {
    renderPasswordPanel({ passwordError: "Current password is incorrect" });

    expect(screen.getByRole("alert")).toHaveTextContent("Current password is incorrect");
  });
});
