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

const OPTIONS = [
  { id: "1", label: "Acme Corp", value: "1" },
  { id: "2", label: "Beta SA", value: "2" },
];

const field = {
  id: "FIELD-1",
  name: "businessPartner",
  label: "Business Partner",
  type: FieldType.TABLEDIR,
  required: false,
  selector: { datasourceName: "BusinessPartnerSelector" },
} as unknown as Field;

const renderEditor = ({
  value = "",
  loadOptions,
  onChange = jest.fn(),
}: { value?: string; loadOptions: jest.Mock; onChange?: jest.Mock }) =>
  render(
    <TableDirCellEditor
      value={value}
      onChange={onChange}
      onBlur={jest.fn()}
      field={field}
      hasError={false}
      disabled={false}
      loadOptions={loadOptions}
    />
  );

const openAndSearch = async (term: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("combobox"));
  });
  await act(async () => {
    fireEvent.change(screen.getByRole("textbox"), { target: { value: term } });
  });
};

describe("TableDirCellEditor — option list", () => {
  it("lists the options that match once the minimum number of characters is typed", async () => {
    renderEditor({ loadOptions: jest.fn().mockResolvedValue(OPTIONS) });

    await openAndSearch("acm");

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta SA")).not.toBeInTheDocument();
  });

  it("marks the option that is the current value", async () => {
    renderEditor({ value: "2", loadOptions: jest.fn().mockResolvedValue(OPTIONS) });

    await openAndSearch("bet");

    const options = screen.getAllByRole("option");
    const selected = options.filter((option) => option.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("Beta SA");
    expect(screen.getByLabelText("Selected")).toBeInTheDocument();
  });

  it("selects an option with the mouse", async () => {
    const onChange = jest.fn();
    renderEditor({ loadOptions: jest.fn().mockResolvedValue(OPTIONS), onChange });

    await openAndSearch("acm");
    const option = screen.getByText("Acme Corp").closest("[role='option']") as HTMLElement;
    fireEvent.mouseEnter(option);
    await act(async () => {
      fireEvent.mouseDown(option);
    });

    expect(onChange).toHaveBeenCalledWith("1", expect.anything());
  });

  it("says so when nothing matches", async () => {
    renderEditor({ loadOptions: jest.fn().mockResolvedValue([]) });

    await openAndSearch("zzz");

    expect(screen.getByText("No options found")).toBeInTheDocument();
  });
});
