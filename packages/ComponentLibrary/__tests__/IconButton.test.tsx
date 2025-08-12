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

import { screen, fireEvent } from "@testing-library/react";
import { renderIconButton } from "./test-utils";

// Mock the Tooltip component to simplify testing
jest.mock("../src/components/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("IconButton", () => {
  it("renders with children", () => {
    renderIconButton({
      ariaLabel: "test button",
      children: <svg data-testid="test-icon" />,
    });

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("applies aria-label correctly", () => {
    renderIconButton({ ariaLabel: "Close dialog" });
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Close dialog");
  });

  it("handles click events", async () => {
    const handleClick = jest.fn();
    const { user, getByRole } = renderIconButton({ onClick: handleClick });

    await user.click(getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    const handleClick = jest.fn();
    const { getByRole } = renderIconButton({ disabled: true, onClick: handleClick });

    const button = getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders icon text when provided", () => {
    const { getByText, getByTestId } = renderIconButton({
      iconText: "Save",
      children: <svg data-testid="save-icon" />,
    });

    expect(getByText("Save")).toBeInTheDocument();
    expect(getByTestId("save-icon")).toBeInTheDocument();
  });

  it("passes through additional props", () => {
    renderIconButton({ "data-testid": "custom-button", id: "my-button" });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveAttribute("id", "my-button");
  });

  it("has correct default button type", () => {
    renderIconButton({});
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
