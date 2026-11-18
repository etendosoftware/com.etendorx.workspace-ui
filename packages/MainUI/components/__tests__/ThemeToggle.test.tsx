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
import ThemeToggle from "../ThemeToggle";

const mockSetThemeMode = jest.fn();
let mockMode = "light";

jest.mock("@workspaceui/componentlibrary/src/theme/mode", () => ({
  setThemeMode: (mode: string) => mockSetThemeMode(mode),
  useThemeMode: () => mockMode,
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetThemeMode.mockClear();
    mockMode = "light";
  });

  it("has the same 40px size as the other top bar buttons", () => {
    render(<ThemeToggle />);

    expect(screen.getByTestId("ThemeToggle__button")).toHaveClass("h-10", "w-10");
  });

  it("switches to the opposite mode", () => {
    mockMode = "dark";
    render(<ThemeToggle />);

    fireEvent.click(screen.getByTestId("ThemeToggle__button"));

    expect(mockSetThemeMode).toHaveBeenCalledWith("light");
  });
});
