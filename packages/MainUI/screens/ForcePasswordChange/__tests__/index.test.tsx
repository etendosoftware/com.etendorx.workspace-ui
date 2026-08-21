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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ForcePasswordChangeScreen from "..";
import { useUserStore } from "@/stores/userStore";

// ── Mocks ─────────────────────────────────────────────────────────────────

const completeExpiredPasswordChange = jest.fn();
const hasPendingLoginPassword = jest.fn();
const logout = jest.fn();

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({
    completeExpiredPasswordChange: (...args: unknown[]) => completeExpiredPasswordChange(...args),
    hasPendingLoginPassword: () => hasPendingLoginPassword(),
    logout: () => logout(),
  }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/contexts/language", () => ({
  // Mimics the backend message catalog: known codes resolve, unknown ones echo back.
  useLanguage: () => ({ getLabel: (code: string) => mockErpCatalog[code as keyof typeof mockErpCatalog] ?? code }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const NEW_PASSWORD = "Str0ng-P4ss!";
const ALREADY_USED_CODE = "ETAS_PasswordAlreadyUsed";
const mockErpCatalog = { [ALREADY_USED_CODE]: "Password has been used already. Try another" };
const TEST_IDS = {
  newPassword: "ForcePasswordChange__newPassword",
  confirmPassword: "ForcePasswordChange__confirmPassword",
  submit: "ForcePasswordChange__submit",
  logout: "ForcePasswordChange__logout",
  error: "ForcePasswordChange__error",
};

/** Fills both password fields and submits the form. */
const submitPasswords = (newPwd: string, confirmPwd: string) => {
  fireEvent.change(screen.getByTestId(TEST_IDS.newPassword), { target: { value: newPwd } });
  fireEvent.change(screen.getByTestId(TEST_IDS.confirmPassword), { target: { value: confirmPwd } });
  fireEvent.click(screen.getByTestId(TEST_IDS.submit));
};

describe("ForcePasswordChangeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasPendingLoginPassword.mockReturnValue(true);
    completeExpiredPasswordChange.mockResolvedValue(undefined);
    logout.mockResolvedValue(undefined);
    useUserStore.setState({ loginErrorText: "", loginErrorDescription: "" });
  });

  it("asks only for the new password and its confirmation, like the classic flow", () => {
    render(<ForcePasswordChangeScreen />);

    expect(screen.getByTestId(TEST_IDS.newPassword)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.confirmPassword)).toBeInTheDocument();
    expect(screen.getByText("login.passwordExpired.title")).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.error)).toBeNull();
  });

  it("submits the change with the matching pair", async () => {
    render(<ForcePasswordChangeScreen />);

    submitPasswords(NEW_PASSWORD, NEW_PASSWORD);

    await waitFor(() =>
      expect(completeExpiredPasswordChange).toHaveBeenCalledWith({
        newPwd: NEW_PASSWORD,
        confirmPwd: NEW_PASSWORD,
      })
    );
    expect(screen.queryByTestId(TEST_IDS.error)).toBeNull();
  });

  it("rejects a non-matching confirmation without calling the backend", async () => {
    render(<ForcePasswordChangeScreen />);

    submitPasswords(NEW_PASSWORD, "something-else");

    expect(await screen.findByTestId(TEST_IDS.error)).toHaveTextContent("navigation.profile.passwordMismatch");
    expect(completeExpiredPasswordChange).not.toHaveBeenCalled();
  });

  it("keeps the flow open and shows the ERP message when it rejects the password", async () => {
    completeExpiredPasswordChange.mockRejectedValue(new Error(ALREADY_USED_CODE));

    render(<ForcePasswordChangeScreen />);

    submitPasswords(NEW_PASSWORD, NEW_PASSWORD);

    expect(await screen.findByTestId(TEST_IDS.error)).toHaveTextContent(mockErpCatalog[ALREADY_USED_CODE]);
    expect(screen.getByTestId(TEST_IDS.newPassword)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.submit)).not.toBeDisabled();
  });

  it("falls back to the local translation for a code the ERP catalog does not define", async () => {
    completeExpiredPasswordChange.mockRejectedValue(new Error("CPPasswordNotStrongEnough"));

    render(<ForcePasswordChangeScreen />);

    submitPasswords(NEW_PASSWORD, NEW_PASSWORD);

    expect(await screen.findByTestId(TEST_IDS.error)).toHaveTextContent("navigation.profile.errorNotStrongEnough");
  });

  it("shows a generic error for an unknown failure", async () => {
    completeExpiredPasswordChange.mockRejectedValue(new Error("HTTP error! status: 500"));

    render(<ForcePasswordChangeScreen />);

    submitPasswords(NEW_PASSWORD, NEW_PASSWORD);

    expect(await screen.findByTestId(TEST_IDS.error)).toHaveTextContent("navigation.profile.errorGeneric");
  });

  it("logs out on demand so a user who cannot meet the policy is never trapped", async () => {
    render(<ForcePasswordChangeScreen />);

    fireEvent.click(screen.getByTestId(TEST_IDS.logout));

    await waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it("sends the user back to the login screen when the login password is no longer in memory", async () => {
    hasPendingLoginPassword.mockReturnValue(false);
    // logout() wipes the store, so the message must survive it: it is written afterwards.
    logout.mockImplementation(async () => {
      useUserStore.setState({ loginErrorText: "", loginErrorDescription: "" });
    });

    render(<ForcePasswordChangeScreen />);

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(useUserStore.getState().loginErrorText).toBe("login.errors.passwordExpired.title");
    expect(useUserStore.getState().loginErrorDescription).toBe("login.errors.passwordExpired.description");
  });

  it("keeps the submit button disabled until both fields are filled", () => {
    render(<ForcePasswordChangeScreen />);

    expect(screen.getByTestId(TEST_IDS.submit)).toBeDisabled();

    fireEvent.change(screen.getByTestId(TEST_IDS.newPassword), { target: { value: NEW_PASSWORD } });
    expect(screen.getByTestId(TEST_IDS.submit)).toBeDisabled();

    fireEvent.change(screen.getByTestId(TEST_IDS.confirmPassword), { target: { value: NEW_PASSWORD } });
    expect(screen.getByTestId(TEST_IDS.submit)).not.toBeDisabled();
  });
});
