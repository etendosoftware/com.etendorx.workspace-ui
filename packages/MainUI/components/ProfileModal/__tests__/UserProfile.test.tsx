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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserProfile from "../UserProfile";

const logout = jest.fn();
const t = jest.fn((key: string) => key);

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ logout }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t }),
}));

// Avoid pulling in the MUI theme (useStyle reads theme.palette.*).
jest.mock("../styles", () => ({
  useStyle: () => ({ styles: {} }),
  TEXT_LOGO: "Etendo",
}));

// The global IconButton mock drops onClick; override it with a real button
// that forwards the handler so the logout click can be exercised.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    tooltip,
  }: { children?: import("react").ReactNode; onClick?: () => void; tooltip?: string }) => (
    <button type="button" onClick={onClick} aria-label={tooltip}>
      {children}
    </button>
  ),
}));

describe("UserProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls logout when the logout button is clicked", async () => {
    render(<UserProfile name="John Doe" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it("uses the i18n key for the logout tooltip", () => {
    render(<UserProfile name="John Doe" />);

    expect(t).toHaveBeenCalledWith("common.logout");
  });
});
