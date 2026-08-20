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
import { AccessDeniedDisplay, AccessDeniedScreen } from "@/components/AccessDeniedDisplay";

const TITLE = "Access Denied";
const DESCRIPTION = "Your role does not have access to this window.";
const TABLE_DESCRIPTION = "Your role does not have permission to view this data.";
const HOME_LABEL = "Home";

jest.mock("@mui/material", () => ({
  Button: function MockButton({ children, onClick, ...props }: any) {
    return (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

jest.mock("next/link", () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errors.accessDenied.title": "Access Denied",
        "errors.accessDenied.description": "Your role does not have access to this window.",
        "navigation.common.home": "Home",
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock("@/components/ErrorDisplay", () => ({
  ErrorDisplay: ({ title, description, children }: any) => (
    <div data-testid="ErrorDisplay">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

describe("AccessDeniedDisplay", () => {
  it("shows the default window-level wording", () => {
    render(<AccessDeniedDisplay />);

    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
  });

  it("lets the caller override the description", () => {
    render(<AccessDeniedDisplay description={TABLE_DESCRIPTION} />);

    expect(screen.getByText(TABLE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(DESCRIPTION)).not.toBeInTheDocument();
  });

  it("renders its children inside the card", () => {
    render(
      <AccessDeniedDisplay>
        <span>Extra action</span>
      </AccessDeniedDisplay>
    );

    expect(screen.getByText("Extra action")).toBeInTheDocument();
  });
});

describe("AccessDeniedScreen", () => {
  it("centers the card and offers a home action", () => {
    const { container } = render(<AccessDeniedScreen onGoHome={jest.fn()} />);

    expect(container.querySelector(".w-full.h-full.flex.items-center.justify-center")).toBeInTheDocument();
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: HOME_LABEL })).toBeInTheDocument();
  });

  it("invokes onGoHome when the action is clicked", () => {
    const onGoHome = jest.fn();
    render(<AccessDeniedScreen onGoHome={onGoHome} />);

    fireEvent.click(screen.getByRole("button", { name: HOME_LABEL }));

    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
