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
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TableDirCellEditor } from "../CellEditors/TableDirCellEditor";

const HINT = "Type at least 3 characters to search";

const buildField = (datasourceName: string): Field =>
  ({
    name: "businessPartner",
    label: "Business Partner",
    type: FieldType.TABLEDIR,
    required: false,
    selector: { datasourceName },
  }) as unknown as Field;

const renderEditor = (datasourceName: string, loadOptions: jest.Mock) =>
  render(
    <TableDirCellEditor
      value=""
      onChange={jest.fn()}
      onBlur={jest.fn()}
      field={buildField(datasourceName)}
      hasError={false}
      disabled={false}
      loadOptions={loadOptions}
    />
  );

const open = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("combobox"));
  });
};

const type = async (value: string) => {
  await act(async () => {
    fireEvent.change(screen.getByRole("textbox"), { target: { value } });
  });
};

describe("TableDirCellEditor — minimum search characters", () => {
  let loadOptions: jest.Mock;

  beforeEach(() => {
    loadOptions = jest.fn().mockResolvedValue([]);
  });

  it("tells the user how many characters a search selector needs", async () => {
    renderEditor("BusinessPartnerSelector", loadOptions);
    await open();

    expect(screen.getByPlaceholderText(HINT)).toBeInTheDocument();
  });

  it("does not query the backend below the minimum and shows the hint", async () => {
    renderEditor("BusinessPartnerSelector", loadOptions);
    await open();
    loadOptions.mockClear();

    await type("ab");

    expect(loadOptions).not.toHaveBeenCalled();
    expect(screen.getAllByText(HINT).length).toBeGreaterThan(0);
    expect(screen.queryByText("No options found")).not.toBeInTheDocument();
  });

  it("queries once the minimum is reached", async () => {
    renderEditor("BusinessPartnerSelector", loadOptions);
    await open();
    loadOptions.mockClear();

    await type("abc");

    expect(loadOptions).toHaveBeenCalledTimes(1);
    expect(loadOptions).toHaveBeenCalledWith(expect.anything(), "abc");
  });

  it.each(["ComboTableDatasourceService", "ADList"])("keeps querying from the first character on %s", async (name) => {
    renderEditor(name, loadOptions);
    await open();
    loadOptions.mockClear();

    await type("a");

    expect(loadOptions).toHaveBeenCalledWith(expect.anything(), "a");
    expect(screen.queryByPlaceholderText(HINT)).not.toBeInTheDocument();
  });
});
