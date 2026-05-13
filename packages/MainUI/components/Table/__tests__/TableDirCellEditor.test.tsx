/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../utils/keyboardNavigation", () => ({
  useKeyboardNavigation: () => ({
    handleKeyDown: jest.fn().mockResolvedValue(false),
    setFocused: jest.fn(),
  }),
}));

import type React from "react";
import { render, screen } from "@testing-library/react";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TableDirCellEditor } from "../CellEditors/TableDirCellEditor";

const buildField = (overrides: Partial<Field> = {}): Field => ({
  name: "testField",
  label: "Test Field",
  type: FieldType.TABLEDIR,
  required: false,
  ...overrides,
});

const renderEditor = (props: Partial<React.ComponentProps<typeof TableDirCellEditor>> = {}) =>
  render(
    <TableDirCellEditor
      value=""
      onChange={jest.fn()}
      onBlur={jest.fn()}
      field={buildField()}
      hasError={false}
      disabled={false}
      {...props}
    />
  );

describe("TableDirCellEditor — showTooltip prop", () => {
  it("has no title when showTooltip=false and no error", () => {
    renderEditor({ showTooltip: false, hasError: false });
    expect(screen.getByRole("combobox")).not.toHaveAttribute("title");
  });

  it("has no title when showTooltip=false even with error", () => {
    renderEditor({ showTooltip: false, hasError: true });
    expect(screen.getByRole("combobox")).not.toHaveAttribute("title");
  });

  it("sets title when showTooltip=true (default) and hasError=true", () => {
    renderEditor({ hasError: true });
    expect(screen.getByRole("combobox")).toHaveAttribute("title", "This field has validation errors");
  });
});
