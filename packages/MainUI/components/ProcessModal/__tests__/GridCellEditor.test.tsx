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

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the heavyweight CellEditorFactory with a probe that exposes the
// `hasError` prop and lets us trigger `onChange` from the test.
type ProbeProps = {
  hasError: boolean;
  onChange: (value: unknown) => void;
};
jest.mock("../../Table/CellEditors", () => ({
  CellEditorFactory: ({ hasError, onChange }: ProbeProps) => (
    <div>
      <span data-testid="probe-has-error">{hasError ? "yes" : "no"}</span>
      <button type="button" data-testid="probe-trigger-change" onClick={() => onChange("value-x")}>
        change
      </button>
    </div>
  ),
}));

jest.mock("../WindowReferenceGridContext", () => ({
  useWindowReferenceGridContext: () => ({
    effectiveRecordValuesRef: { current: {} },
    parametersRef: { current: {} },
    tabId: "TAB-001",
    session: {},
    fieldReadOnlyMap: {},
    shouldSendOrg: false,
  }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/utils", () => ({
  getFieldReference: () => "STRING",
}));

jest.mock("@/utils/form/constants", () => ({
  FIELD_REFERENCE_CODES: {},
}));

jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { request: jest.fn() } },
}));

import { GridCellEditor } from "../GridCellEditor";

const COLUMN_NAME = "received_in";
const FIELD_NAME = "Received In";

const buildProps = (overrides: Partial<Parameters<typeof GridCellEditor>[0]> = {}) => ({
  cell: {
    getValue: () => "",
    column: { id: COLUMN_NAME },
    row: { _valuesCache: {} },
  },
  row: { id: "row-1", original: {} },
  col: { columnName: COLUMN_NAME, header: FIELD_NAME, accessorKey: COLUMN_NAME },
  fields: [{ name: FIELD_NAME, columnName: COLUMN_NAME, column: { reference: "10" }, isMandatory: true }],
  onRecordChange: undefined,
  validationError: undefined,
  forceError: false,
  onCellEdit: undefined,
  ...overrides,
});

describe("GridCellEditor — forceError and onCellEdit", () => {
  it("renders without error when forceError=false and no validationError", () => {
    render(<GridCellEditor {...buildProps()} />);
    expect(screen.getByTestId("probe-has-error")).toHaveTextContent("no");
    expect(document.querySelector(".text-red-500")).toBeNull();
  });

  it("paints the cell as errored when forceError=true", () => {
    render(<GridCellEditor {...buildProps({ forceError: true })} />);
    expect(screen.getByTestId("probe-has-error")).toHaveTextContent("yes");
    // No error text should render when there is no validation message.
    expect(screen.queryByText("text-red-500")).toBeNull();
    expect(document.querySelector(".text-red-500")).toBeNull();
  });

  it("renders the error message div only when a validation message exists", () => {
    render(
      <GridCellEditor
        {...buildProps({
          validationError: { message: "fields.required" },
        })}
      />
    );
    expect(screen.getByTestId("probe-has-error")).toHaveTextContent("yes");
    expect(document.querySelector(".text-red-500")).toHaveTextContent("fields.required");
  });

  it("calls onCellEdit with the column name after each change", () => {
    const onCellEdit = jest.fn();
    render(<GridCellEditor {...buildProps({ onCellEdit, forceError: true })} />);
    fireEvent.click(screen.getByTestId("probe-trigger-change"));
    expect(onCellEdit).toHaveBeenCalledWith(COLUMN_NAME);
  });

  it("prefers col.dbColumnName over col.columnName when notifying onCellEdit", () => {
    // The create-row error set is keyed by DB column name. `col.columnName` is
    // the parsed HQL camelCase name (`parseColumns` writes hqlName into
    // columnName and stores the DB name under dbColumnName), so passing
    // columnName would never clear the right error entry.
    const onCellEdit = jest.fn();
    const DB_NAME = "c_received_in";
    const HQL_NAME = "receivedIn";
    render(
      <GridCellEditor
        {...buildProps({
          onCellEdit,
          col: { columnName: HQL_NAME, dbColumnName: DB_NAME, header: FIELD_NAME, accessorKey: HQL_NAME },
        })}
      />
    );
    fireEvent.click(screen.getByTestId("probe-trigger-change"));
    expect(onCellEdit).toHaveBeenCalledWith(DB_NAME);
  });
});
