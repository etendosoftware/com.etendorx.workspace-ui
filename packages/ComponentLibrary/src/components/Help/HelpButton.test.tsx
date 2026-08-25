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
import HelpButton from "./HelpButton";

jest.mock("../../assets/icons/help-circle.svg", () => {
  return function HelpIcon() {
    return <svg data-testid="help-icon" />;
  };
});

describe("HelpButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders with default props", () => {
    render(<HelpButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Help");
  });

  it("calls onClick when clicked", () => {
    render(<HelpButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("renders the help icon", () => {
    render(<HelpButton onClick={mockOnClick} />);
    expect(screen.getByTestId("help-icon")).toBeInTheDocument();
  });

  it("applies custom tooltip", () => {
    render(<HelpButton onClick={mockOnClick} tooltip="Custom Tooltip" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Custom Tooltip");
  });

  it("respects disabled prop", () => {
    render(<HelpButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<HelpButton onClick={mockOnClick} iconButtonClassName="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
