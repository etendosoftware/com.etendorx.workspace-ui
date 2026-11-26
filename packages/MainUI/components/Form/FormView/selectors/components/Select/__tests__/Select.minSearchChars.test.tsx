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

import { render, screen } from "@testing-library/react";
import {
  getSelectSearchInput as getSearchInput,
  openSelectDropdown as openDropdown,
  SelectHarness,
  typeInSelectSearch as type,
} from "../../../__testHelpers__/selectTestHarness";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "form.select.minCharsHint" ? "Type at least {{min}} characters to search" : key),
  }),
}));

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

const COLUMNS = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
];
const ROWS = [
  { id: "1", label: "Alpha Corp", data: { id: "1", name: "Alpha Corp", city: "Madrid" } },
  { id: "2", label: "Alpine SA", data: { id: "2", name: "Alpine SA", city: "Lyon" } },
];

function Harness({ minSearchChars, withColumns = false }: { minSearchChars?: number; withColumns?: boolean }) {
  return withColumns ? (
    <SelectHarness options={ROWS} columns={COLUMNS} minSearchChars={minSearchChars} />
  ) : (
    <SelectHarness minSearchChars={minSearchChars} />
  );
}

describe("Select — minimum search characters", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("tells the user how many characters are needed in the search placeholder", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    expect(getSearchInput().placeholder).toBe("Type at least 3 characters to search");
  });

  it("shows the default list for an empty term", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    expect(screen.getByTestId("OptionItem__1")).toBeInTheDocument();
  });

  it("replaces the list with the hint while the term is below the minimum", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    type("al");

    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
    expect(screen.queryByTestId("OptionItem__1")).not.toBeInTheDocument();
    expect(screen.queryByText("No options found")).not.toBeInTheDocument();
  });

  it("shows the options again once the minimum is reached", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    type("al");
    type("alp");

    expect(screen.getByTestId("OptionItem__1")).toBeInTheDocument();
  });

  it("leaves no stale options visible after deleting below the minimum", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    type("alp");
    type("al");

    expect(screen.queryByTestId("OptionItem__1")).not.toBeInTheDocument();
  });

  it("keeps the usual behavior when there is no minimum", () => {
    render(<Harness />);
    openDropdown();

    type("a");

    expect(getSearchInput().placeholder).toBe("Search...");
    expect(screen.getByTestId("OptionItem__1")).toBeInTheDocument();
  });

  it("shows the column headers and the cells of a multi-column selector", () => {
    render(<Harness withColumns />);
    openDropdown();

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByText("Madrid")).toBeInTheDocument();
  });

  it("replaces the headers and the rows with the hint below the minimum on a multi-column selector", () => {
    render(<Harness withColumns minSearchChars={3} />);
    openDropdown();

    type("al");

    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Madrid")).not.toBeInTheDocument();
  });
});
