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

import { render, screen, fireEvent } from "@testing-library/react";
import HelpAccess from "../HelpAccess";
import { createMockWindowMetadata } from "@/utils/tests/mockHelpers";

const mockUseMetadataContext = jest.fn();
jest.mock("@/contexts/metadata", () => ({
  useMetadataContext: () => mockUseMetadataContext(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/help-circle.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="help-icon" />,
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="close-icon" />,
}));
jest.mock("../../Modal", () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="mock-modal">{children}</div> : null,
}));

describe("HelpAccess", () => {
  beforeEach(() => {
    mockUseMetadataContext.mockReset();
  });

  it("renders nothing when the active window has no helpComment", () => {
    mockUseMetadataContext.mockReturnValue({ windowId: "w1", window: createMockWindowMetadata("w1") });
    render(<HelpAccess />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the trigger when the active window has helpComment", () => {
    mockUseMetadataContext.mockReturnValue({
      windowId: "w1",
      window: { ...createMockWindowMetadata("w1"), helpComment: "Some help" },
    });
    render(<HelpAccess />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("opens the drawer when the trigger is clicked", () => {
    mockUseMetadataContext.mockReturnValue({
      windowId: "w1",
      window: { ...createMockWindowMetadata("w1"), helpComment: "Some help" },
    });
    render(<HelpAccess />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
  });

  it("closes the drawer when the active window changes", () => {
    mockUseMetadataContext.mockReturnValue({
      windowId: "w1",
      window: { ...createMockWindowMetadata("w1"), helpComment: "Some help" },
    });
    const { rerender } = render(<HelpAccess />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();

    mockUseMetadataContext.mockReturnValue({
      windowId: "w2",
      window: { ...createMockWindowMetadata("w2"), helpComment: "Other help" },
    });
    rerender(<HelpAccess />);

    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });
});
