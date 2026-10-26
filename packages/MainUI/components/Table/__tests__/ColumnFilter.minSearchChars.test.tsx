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
import "@testing-library/jest-dom";
import { ColumnFilter } from "../ColumnFilter";
import type { Column } from "@workspaceui/api-client/src/api/types";

interface MultiSelectProps {
  onSearch?: (term: string) => void;
  minSearchChars?: number;
}

jest.mock("../../Form/FormView/selectors/components/MultiSelect", () => ({
  MultiSelect: ({ onSearch, minSearchChars }: MultiSelectProps) => (
    <input data-testid="search-input" data-min={minSearchChars} onChange={(e) => onSearch?.(e.target.value)} />
  ),
}));

const buildColumn = (selectorDatasourceName?: string): Column =>
  ({
    id: "businessPartner",
    columnName: "businessPartner",
    name: "Business Partner",
    type: "tabledir",
    referencedEntity: "BusinessPartner",
    selectorDatasourceName,
  }) as unknown as Column;

const type = (value: string) => fireEvent.change(screen.getByTestId("search-input"), { target: { value } });

describe("ColumnFilter — minimum search characters", () => {
  const renderFilter = (column: Column, onLoadOptions = jest.fn()) => {
    render(<ColumnFilter column={column} onFilterChange={jest.fn()} onLoadOptions={onLoadOptions} />);
    return onLoadOptions;
  };

  it("requires the minimum on a search selector column", () => {
    renderFilter(buildColumn("BusinessPartnerSelector"));

    expect(screen.getByTestId("search-input")).toHaveAttribute("data-min", "3");
  });

  it("does not load options below the minimum", () => {
    const onLoadOptions = renderFilter(buildColumn("BusinessPartnerSelector"));

    type("ab");

    expect(onLoadOptions).not.toHaveBeenCalled();
  });

  it("loads options once the minimum is reached", () => {
    const onLoadOptions = renderFilter(buildColumn("BusinessPartnerSelector"));

    type("abc");

    expect(onLoadOptions).toHaveBeenCalledWith("abc");
  });

  it("loads the default list when the term is cleared", () => {
    const onLoadOptions = renderFilter(buildColumn("BusinessPartnerSelector"));

    type("abc");
    type("");

    expect(onLoadOptions).toHaveBeenLastCalledWith("");
  });

  it.each(["ComboTableDatasourceService", "ADList", undefined])(
    "keeps loading from the first character when the datasource is %s",
    (name) => {
      const onLoadOptions = renderFilter(buildColumn(name));

      type("a");

      expect(onLoadOptions).toHaveBeenCalledWith("a");
    }
  );
});
