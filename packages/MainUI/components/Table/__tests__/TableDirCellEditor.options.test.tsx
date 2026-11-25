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
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { searchesOnServer, TableDirCellEditor } from "../CellEditors/TableDirCellEditor";

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

describe("TableDirCellEditor — loading while searching (ETP-6431)", () => {
  const NO_OPTIONS = "No options found";
  const LOADING = "Loading...";
  const optionList = () => within(screen.getByRole("listbox"));

  /** A loader whose answer for each term is released by the test. */
  const deferredLoader = () => {
    const releases = new Map<string, (options: typeof OPTIONS) => void>();
    const loadOptions = jest.fn(
      (_field: Field, term = "") =>
        new Promise((resolve) => {
          releases.set(term, resolve);
        })
    );
    const release = async (term: string, options: typeof OPTIONS) => {
      await act(async () => {
        releases.get(term)?.(options);
      });
    };
    return { loadOptions, release };
  };

  it("shows the loading text, not 'No options found', while the search runs", async () => {
    const { loadOptions, release } = deferredLoader();
    renderEditor({ loadOptions });
    await openAndSearch("zzz");

    expect(optionList().getByText(LOADING)).toBeInTheDocument();
    expect(optionList().queryByText(NO_OPTIONS)).not.toBeInTheDocument();

    await release("zzz", []);

    expect(optionList().getByText(NO_OPTIONS)).toBeInTheDocument();
  });

  it("shows 'No options found' when the search fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    renderEditor({ loadOptions: jest.fn().mockRejectedValue(new Error("down")) });

    await openAndSearch("zzz");

    expect(optionList().getByText(NO_OPTIONS)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("keeps the options of the latest search when an older answer arrives later", async () => {
    const { loadOptions, release } = deferredLoader();
    renderEditor({ loadOptions });
    await openAndSearch("acm");
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "bet" } });
    });

    await release("bet", OPTIONS);
    await release("acm", [OPTIONS[0]]);

    expect(optionList().getByText("Beta SA")).toBeInTheDocument();
    expect(optionList().queryByText(LOADING)).not.toBeInTheDocument();
  });
});

describe("searchesOnServer (ETP-6431)", () => {
  const MIN_CHARS = 3;

  it("is true for a term long enough on a TABLEDIR column with a loader", () => {
    expect(searchesOnServer(field, true, "acm", MIN_CHARS)).toBe(true);
  });

  it.each([
    ["there is no loader", field, false, "acm"],
    ["the column has a static list", { ...field, refList: OPTIONS } as unknown as Field, true, "acm"],
    ["the column is not a TABLEDIR", { ...field, type: FieldType.LIST } as unknown as Field, true, "acm"],
    ["the term is empty", field, true, " "],
    ["the term is below the minimum", field, true, "ac"],
  ])("is false when %s", (_case, testField, hasLoader, term) => {
    expect(searchesOnServer(testField, hasLoader, term, MIN_CHARS)).toBe(false);
  });
});
