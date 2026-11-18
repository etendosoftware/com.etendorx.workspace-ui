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

import { act, render, screen } from "@testing-library/react";
import Login from "../Login";
import { useUserStore } from "@/stores/userStore";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useSSO", () => ({
  useSSO: () => ({ config: null, startAuth0: jest.fn(), startMiddleware: jest.fn() }),
}));

jest.mock("@/components/SSO/ProviderIconButtons", () => ({
  __esModule: true,
  default: () => null,
}));

const ERROR_TEXT = "Login failed";

describe("Login layout", () => {
  afterEach(() => {
    act(() => useUserStore.setState({ loginErrorText: "", loginErrorDescription: "" }));
  });

  it("hangs the error below the card, so the card does not move when it appears", () => {
    render(<Login title="Etendo" onSubmit={jest.fn()} />);
    act(() => useUserStore.setState({ loginErrorText: ERROR_TEXT, loginErrorDescription: "Wrong password" }));

    const error = screen.getByText(ERROR_TEXT).parentElement as HTMLElement;
    expect(error).toHaveClass("absolute", "top-full");
    expect(screen.getByTestId("Login__cardAnchor")).toContainElement(error);
  });
});
