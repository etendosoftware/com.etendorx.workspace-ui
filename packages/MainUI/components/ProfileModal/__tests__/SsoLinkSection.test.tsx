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

import { fireEvent, render, screen } from "@testing-library/react";
import type { SSOConfig } from "@/hooks/useSSO";
import { useServerLabels } from "@/hooks/useServerLabels";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import SsoLinkSection, { SSO_LINK_ACCOUNT_LABEL } from "../SsoLinkSection";

jest.mock("@/hooks/useServerLabels", () => ({ useServerLabels: jest.fn() }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../../SSO/ProviderIconButtons", () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (provider: string) => void }) => (
    <button type="button" data-testid="provider-google" onClick={() => onSelect("google-oauth2")} />
  ),
}));
jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, ...rest }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick} data-testid={(rest as Record<string, string>)["data-testid"]}>
      {children}
    </button>
  ),
}));

const AUTH0: SSOConfig = { enabled: true, authType: "Auth0", domain: "d", clientId: "c", callbackUrl: "" };
const MIDDLEWARE: SSOConfig = {
  enabled: true,
  authType: "Middleware",
  middlewareUrl: "m",
  redirectUri: "",
  accountId: "a",
  providers: [{ id: "google-oauth2", name: "Google" }],
};
const AUTH0_BUTTON = "profile-sso-link-auth0";
const LINK_LABEL = "Link SSO account";

describe("SsoLinkSection", () => {
  const onLinkProvider = jest.fn();
  const onLinkAuth0 = jest.fn();
  const renderSection = (config: SSOConfig | null) =>
    render(<SsoLinkSection config={config} onLinkProvider={onLinkProvider} onLinkAuth0={onLinkAuth0} />);

  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    savePreferences({ ETRX_AllowSSOLogin: "Y" });
    (useServerLabels as jest.Mock).mockReturnValue({ [SSO_LINK_ACCOUNT_LABEL]: LINK_LABEL });
  });

  it("offers the Auth0 account linking with the classic label", () => {
    renderSection(AUTH0);

    fireEvent.click(screen.getByTestId(AUTH0_BUTTON));

    expect(screen.getByTestId(AUTH0_BUTTON)).toHaveTextContent(LINK_LABEL);
    expect(onLinkAuth0).toHaveBeenCalled();
  });

  it("falls back to the local text while the classic label is not loaded", () => {
    (useServerLabels as jest.Mock).mockReturnValue({});
    renderSection(AUTH0);

    expect(screen.getByTestId(AUTH0_BUTTON)).toHaveTextContent("navigation.profile.linkWith");
  });

  it("offers the middleware providers", () => {
    renderSection(MIDDLEWARE);

    fireEvent.click(screen.getByTestId("provider-google"));

    expect(onLinkProvider).toHaveBeenCalledWith("google-oauth2");
  });

  it("offers nothing without ETRX_AllowSSOLogin = Y or without single sign-on", () => {
    savePreferences({});
    const { container, rerender } = renderSection(MIDDLEWARE);
    expect(container).toBeEmptyDOMElement();

    savePreferences({ ETRX_AllowSSOLogin: "Y" });
    rerender(<SsoLinkSection config={{ enabled: false }} onLinkProvider={onLinkProvider} onLinkAuth0={onLinkAuth0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
