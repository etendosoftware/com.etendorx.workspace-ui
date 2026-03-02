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

/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import ToggleChip from "../ToggleChip";

jest.mock("../styles", () => ({
  useStyle: () => ({
    sx: {
      switch: {
        // dummy styles for testing
      },
    },
  }),
}));

describe("ToggleChip Component", () => {
  it("renders correctly", () => {
    const { getByRole } = render(<ToggleChip isActive={false} onToggle={() => {}} />);
    const switchElement = getByRole("checkbox");
    expect(switchElement).toBeInTheDocument();
  });

  it("reflects the isActive state when false", () => {
    const { getByRole } = render(<ToggleChip isActive={false} onToggle={() => {}} />);
    const switchElement = getByRole("checkbox") as HTMLInputElement;
    expect(switchElement.checked).toBe(false);
  });

  it("reflects the isActive state when true", () => {
    const { getByRole } = render(<ToggleChip isActive={true} onToggle={() => {}} />);
    const switchElement = getByRole("checkbox") as HTMLInputElement;
    expect(switchElement.checked).toBe(true);
  });

  it("calls onToggle when clicked", () => {
    const onToggleMock = jest.fn();
    const { getByRole } = render(<ToggleChip isActive={false} onToggle={onToggleMock} />);
    const switchElement = getByRole("checkbox");

    fireEvent.click(switchElement);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});
