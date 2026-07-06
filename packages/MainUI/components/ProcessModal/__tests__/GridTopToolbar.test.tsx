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

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

jest.mock("material-react-table", () => ({
  ...jest.requireActual("material-react-table"),
  MRT_ToggleFiltersButton: () => <button type="button">Filters</button>,
  MRT_ShowHideColumnsButton: () => <button type="button">Columns</button>,
  MRT_ToggleDensePaddingButton: () => <button type="button">Padding</button>,
  MRT_ToggleFullScreenButton: () => <button type="button">FullScreen</button>,
}));

import { fireEvent, render, screen } from "@testing-library/react";
import { GridTopToolbar } from "../WindowReferenceGrid";

const ADD_ROW_TESTID = "GridTopToolbar__AddRowButton";
const ADD_ROW_I18N_KEY = "processModal.gridToolbar.addRow";

type TableMock = {
  getSelectedRowModel: () => { rows: unknown[] };
  setCreatingRow: jest.Mock;
};

const buildTableMock = (overrides: Partial<TableMock> = {}): TableMock => ({
  getSelectedRowModel: () => ({ rows: [] }),
  setCreatingRow: jest.fn(),
  ...overrides,
});

const renderToolbar = (props: Record<string, unknown> = {}) =>
  render(
    <GridTopToolbar
      table={buildTableMock()}
      t={(k: string) => k}
      handleClearSelections={jest.fn()}
      setIsImplicitFilterApplied={jest.fn()}
      handleMRTColumnFiltersChange={jest.fn()}
      {...props}
    />
  );

describe("GridTopToolbar — Add row button", () => {
  it("renders the add-row button when canAdd is true", () => {
    renderToolbar({ canAdd: true });
    expect(screen.getByTestId(ADD_ROW_TESTID)).toBeInTheDocument();
  });

  it("does not render the add-row button when canAdd is false", () => {
    renderToolbar({ canAdd: false });
    expect(screen.queryByTestId(ADD_ROW_TESTID)).not.toBeInTheDocument();
  });

  it("does not render the add-row button when canAdd is undefined", () => {
    renderToolbar();
    expect(screen.queryByTestId(ADD_ROW_TESTID)).not.toBeInTheDocument();
  });

  it("click on the add-row button calls table.setCreatingRow(true)", () => {
    const tableMock = buildTableMock();
    renderToolbar({ canAdd: true, table: tableMock });
    fireEvent.click(screen.getByTestId(ADD_ROW_TESTID));
    expect(tableMock.setCreatingRow).toHaveBeenCalledTimes(1);
    expect(tableMock.setCreatingRow).toHaveBeenCalledWith(true);
  });

  it("uses the processModal.gridToolbar.addRow i18n key for the aria-label", () => {
    renderToolbar({ canAdd: true });
    expect(screen.getByTestId(ADD_ROW_TESTID)).toHaveAttribute("aria-label", ADD_ROW_I18N_KEY);
  });
});
