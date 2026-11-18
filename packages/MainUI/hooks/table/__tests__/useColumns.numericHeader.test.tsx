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

import { render, renderHook, screen } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { NUMERIC_HEADER_CELL_PROPS, useColumns } from "@/hooks/table/useColumns";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

jest.mock("@/hooks/navigation/useRedirect", () => ({
  useRedirect: () => ({
    handleClickRedirect: jest.fn(),
    handleKeyDownRedirect: jest.fn(),
    handleClientclassNavigation: jest.fn(),
  }),
}));

/** Builds a tab with one grid column of the given reference. */
const buildTab = (reference: string): Tab =>
  ({
    fields: {
      lineNo: {
        showInGridView: true,
        name: "Line No.",
        hqlName: "lineNo",
        columnName: "Line",
        column: { reference },
      },
    },
  }) as unknown as Tab;

/** Header props of the only column built for the given reference. */
const getHeaderProps = (reference: string) => {
  const { result } = renderHook(() => useColumns(buildTab(reference)));
  return (result.current[0] as { muiTableHeadCellProps?: unknown }).muiTableHeadCellProps;
};

describe("useColumns - numeric header alignment", () => {
  it("right-aligns the header of a numeric column", () => {
    expect(getHeaderProps(FIELD_REFERENCE_CODES.INTEGER.id)).toEqual(NUMERIC_HEADER_CELL_PROPS);
  });

  it("leaves the header of a text column untouched", () => {
    expect(getHeaderProps("10")).toBeUndefined();
  });

  it("puts the value of a column without its own renderer in a span that can end in an ellipsis", () => {
    const { result } = renderHook(() => useColumns(buildTab("UNKNOWN_REFERENCE")));
    const Cell = (result.current[0] as unknown as { Cell: React.FC<Record<string, unknown>> }).Cell;
    const value = "F&B International Group Account Account";

    render(<Cell row={{ original: {} }} cell={{ getValue: () => value }} renderedCellValue={value} />);

    expect(screen.getByText(value)).toHaveClass("block", "min-w-0", "truncate");
  });
});
