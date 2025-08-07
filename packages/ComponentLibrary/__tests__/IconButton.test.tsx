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
import userEvent from "@testing-library/user-event";
import IconButton from "../src/components/IconButton/index";

// Mock the Tooltip component to simplify testing
jest.mock("../src/components/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("IconButton", () => {
  it("renders with children", () => {
    render(
      <IconButton ariaLabel="test button">
        <svg data-testid="test-icon" />
      </IconButton>
    );

    expect(screen.getByRole("button")).toBeDefined();
    expect(screen.getByTestId("test-icon")).toBeDefined();
  });

  it("applies aria-label correctly", () => {
    render(
      <IconButton ariaLabel="Close dialog">
        <span>X</span>
      </IconButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Close dialog");
  });

  it("handles click events", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <IconButton onClick={handleClick} ariaLabel="click me">
        <span>Click</span>
      </IconButton>
    );

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    const handleClick = jest.fn();

    render(
      <IconButton disabled onClick={handleClick} ariaLabel="disabled button">
        <span>Disabled</span>
      </IconButton>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders icon text when provided", () => {
    render(
      <IconButton iconText="Save" ariaLabel="save button">
        <svg data-testid="save-icon" />
      </IconButton>
    );

    expect(screen.getByText("Save")).toBeDefined();
    expect(screen.getByTestId("save-icon")).toBeDefined();
  });

  it("passes through additional props", () => {
    render(
      <IconButton data-testid="custom-button" id="my-button" ariaLabel="button with props">
        <span>Props</span>
      </IconButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveAttribute("id", "my-button");
  });

  it("has correct default button type", () => {
    render(
      <IconButton ariaLabel="default type">
        <span>Default</span>
      </IconButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
