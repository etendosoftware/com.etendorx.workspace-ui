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

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import { toast } from "sonner";
import ProfileModal from "../ProfileModal";
import type { ProfileModalProps } from "../types";
import { createProfileModalProps } from "../test-utils/profileModalProps";

const NEW_PASSWORD = "New1234!";
const PASSWORD_CHANGED_TEXT = "Your password has been changed!";
const FALLBACK_KEY = "navigation.profile.passwordChangedSuccess";
const PROFILE_BUTTON = "profile-menu-button";
const TOOLTIP_DELAY_MS = 600;

let mockCatalog: Record<string, string> = {};

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US", getFlag: () => "", getLabel: (key: string) => mockCatalog[key] ?? key }),
}));

jest.mock("@/hooks/useSSO", () => ({
  useSSO: () => ({ config: { enabled: false }, startLink: jest.fn() }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

// Only the password panel matters here: it is reduced to its three inputs and the inline error.
jest.mock("../ToggleSection", () => ({
  __esModule: true,
  default: ({
    onCurrentPwdChange,
    onNewPwdChange,
    onConfirmPwdChange,
    passwordError,
  }: {
    onCurrentPwdChange: (value: string) => void;
    onNewPwdChange: (value: string) => void;
    onConfirmPwdChange: (value: string) => void;
    passwordError: string;
  }) => (
    <div>
      <input aria-label="current" onChange={(event) => onCurrentPwdChange(event.target.value)} />
      <input aria-label="new" onChange={(event) => onNewPwdChange(event.target.value)} />
      <input aria-label="confirm" onChange={(event) => onConfirmPwdChange(event.target.value)} />
      <span data-testid="password-error">{passwordError}</span>
    </div>
  ),
}));
jest.mock("../ToggleButton", () => ({
  __esModule: true,
  default: ({ onToggle }: { onToggle: (section: string) => void }) => (
    <button type="button" onClick={() => onToggle("password")}>
      password section
    </button>
  ),
}));
jest.mock("../UserProfile", () => ({ __esModule: true, default: () => null }));

jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
  }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// The global IconButton mock drops the click handler and the accessible name this suite asserts on.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    ariaLabel,
    "data-testid": testId,
  }: {
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    ariaLabel?: string;
    "data-testid"?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const renderModal = (overrides: Partial<ProfileModalProps> = {}) => {
  const view = render(
    <ThemeProvider theme={theme}>
      <ProfileModal {...createProfileModalProps(overrides)} />
    </ThemeProvider>
  );
  const rerender = (next: Partial<ProfileModalProps>) =>
    view.rerender(
      <ThemeProvider theme={theme}>
        <ProfileModal {...createProfileModalProps({ ...overrides, ...next })} />
      </ThemeProvider>
    );
  return { ...view, rerender };
};

/** Opens the password panel, fills its three fields and saves. */
const submitPasswordChange = () => {
  fireEvent.click(screen.getByText("password section"));
  fireEvent.change(screen.getByLabelText("current"), { target: { value: "old" } });
  fireEvent.change(screen.getByLabelText("new"), { target: { value: NEW_PASSWORD } });
  fireEvent.change(screen.getByLabelText("confirm"), { target: { value: NEW_PASSWORD } });
  fireEvent.click(screen.getByText("common.save"));
};

/**
 * Hovers the profile button until its tooltip shows.
 *
 * @returns the tooltip text
 */
const hoverProfileButton = () => {
  fireEvent.mouseEnter(screen.getByTestId(PROFILE_BUTTON).parentElement as HTMLElement);
  act(() => {
    jest.advanceTimersByTime(TOOLTIP_DELAY_MS);
  });
  return screen.getByRole("tooltip").textContent;
};

describe("ProfileModal — password change confirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCatalog = {};
  });

  it("confirms a successful change with the ERP message, as Classic does", async () => {
    mockCatalog = { UINAVBA_PasswordChanged: PASSWORD_CHANGED_TEXT };
    const onPasswordChange = jest.fn().mockResolvedValue(undefined);
    renderModal({ onPasswordChange });

    submitPasswordChange();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(PASSWORD_CHANGED_TEXT));
    expect(onPasswordChange).toHaveBeenCalledWith({
      currentPwd: "old",
      newPwd: NEW_PASSWORD,
      confirmPwd: NEW_PASSWORD,
    });
  });

  it("falls back to the local text when the catalog has no message", async () => {
    renderModal({ onPasswordChange: jest.fn().mockResolvedValue(undefined) });

    submitPasswordChange();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(FALLBACK_KEY));
  });

  it("shows only the inline error when the change fails", async () => {
    renderModal({ onPasswordChange: jest.fn().mockRejectedValue(new Error("UINAVBA_CurrentPwdIncorrect")) });

    submitPasswordChange();

    await waitFor(() =>
      expect(screen.getByTestId("password-error")).toHaveTextContent("navigation.profile.errorCurrentPwdIncorrect")
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("ProfileModal — current context tooltip", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCatalog = { UINAVBA_Role: "Role", UINAVBA_Organization: "Organization" };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the user name, role, client, organization and warehouse on hover", () => {
    renderModal();

    expect(hoverProfileButton()).toBe(
      [
        "John Doe",
        "Role: Role 1",
        "navigation.profile.contextClient: Client 1",
        "Organization: Org 1",
        "navigation.profile.contextWarehouse: WH 1",
      ].join("\n")
    );
    expect(screen.getByTestId(PROFILE_BUTTON)).toHaveAttribute("aria-label", "John Doe");
  });

  it("shows the new values after the role or organization changes", () => {
    const { rerender } = renderModal();

    rerender({
      currentRole: { id: "role-2", name: "Role 2", client: "client-1" },
      currentOrganization: { id: "org-2", name: "Org 2" },
      currentWarehouse: undefined,
    } as Partial<ProfileModalProps>);

    const text = hoverProfileButton();
    expect(text).toContain("Role: Role 2");
    expect(text).toContain("Organization: Org 2");
    expect(text).not.toContain("WH 1");
  });

  it("hides the tooltip while the menu is open", () => {
    renderModal();
    fireEvent.click(screen.getByTestId(PROFILE_BUTTON));

    fireEvent.mouseEnter(screen.getByTestId(PROFILE_BUTTON).parentElement as HTMLElement);
    act(() => {
      jest.advanceTimersByTime(TOOLTIP_DELAY_MS);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
