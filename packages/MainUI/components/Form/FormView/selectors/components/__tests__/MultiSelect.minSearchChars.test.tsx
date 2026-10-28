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
import { MultiSelect } from "../MultiSelect";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "form.select.minCharsHint" ? "Type at least {{min}} characters to search" : key),
  }),
}));

const OPTIONS = [
  { id: "1", label: "Alpha Corp" },
  { id: "2", label: "Alpine SA" },
];

const renderSelect = (minSearchChars?: number) =>
  render(
    <MultiSelect
      options={OPTIONS}
      selectedValues={[]}
      onSelectionChange={jest.fn()}
      onSearch={jest.fn()}
      minSearchChars={minSearchChars}
      placeholder="Filter Partner..."
    />
  );

const open = () => fireEvent.click(screen.getByText("Filter Partner..."));
const searchInput = () => document.querySelector("[data-dropdown-portal] input, input") as HTMLInputElement;
const type = (value: string) => fireEvent.change(searchInput(), { target: { value } });

describe("MultiSelect — minimum search characters", () => {
  it("tells the user how many characters are needed in the search placeholder", () => {
    renderSelect(3);
    open();

    expect(screen.getByPlaceholderText("Type at least 3 characters to search")).toBeInTheDocument();
  });

  it("replaces the list with the hint while the term is below the minimum", () => {
    renderSelect(3);
    open();

    type("al");

    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Corp")).not.toBeInTheDocument();
  });

  it("shows the options once the minimum is reached", () => {
    renderSelect(3);
    open();

    type("alp");

    expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
  });

  it("keeps the usual behavior when there is no minimum", () => {
    renderSelect();
    open();

    type("a");

    expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
  });
});
