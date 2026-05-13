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

import type { ReactNode } from "react";
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

// `useWindowReferenceGridContext` is mocked via `jest.fn()` so individual
// tests can override its return value (e.g. flipping `fieldReadOnlyMap`)
// without re-mocking the whole module.
const mockUseWindowReferenceGridContext = jest.fn();
jest.mock("../WindowReferenceGridContext", () => ({
  useWindowReferenceGridContext: () => mockUseWindowReferenceGridContext(),
}));

const DEFAULT_GRID_CONTEXT = {
  effectiveRecordValuesRef: { current: {} as Record<string, unknown> },
  parametersRef: { current: {} as Record<string, unknown> },
  tabId: "TAB-001",
  tab: null,
  session: {},
  fieldReadOnlyMap: {} as Record<string, boolean>,
  shouldSendOrg: false,
};
beforeEach(() => {
  mockUseWindowReferenceGridContext.mockReturnValue({ ...DEFAULT_GRID_CONTEXT });
});

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/utils", () => ({
  getFieldReference: jest.fn(() => "STRING"),
}));

jest.mock("@/utils/form/constants", () => ({
  FIELD_REFERENCE_CODES: {},
}));

jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { request: jest.fn() } },
}));

// Mock the SelectorModal so the search-button tests can observe `isOpen` and
// trigger `onSelect(record)` without booting the real modal's data layer.
jest.mock("../../Form/FormView/selectors/SelectorModal", () => ({
  __esModule: true,
  default: ({ isOpen, onSelect }: { isOpen: boolean; onSelect: (record: unknown) => void }) =>
    isOpen ? (
      <div data-testid="probe-selector-modal">
        <button
          type="button"
          data-testid="probe-selector-modal-pick"
          onClick={() => onSelect({ id: "REC-1", _identifier: "Identifier 1", name: "Name 1" })}>
          pick
        </button>
      </div>
    ) : null,
}));

// Stub the componentlibrary icon button + search svg so we don't pull in MUI
// in this lightweight suite.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({
    onClick,
    children,
    "data-testid": testId,
  }: {
    onClick: () => void;
    children: ReactNode;
    "data-testid"?: string;
  }) => (
    <button type="button" onClick={onClick} data-testid={testId}>
      {children}
    </button>
  ),
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/search.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="probe-search-icon" />,
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

describe("GridCellEditor — magnifying-glass search button", () => {
  // Build a field that mirrors the P&E selector metadata shape: the
  // `selector.hasTableRelated` flag is what activates the button.
  const SELECTOR_COLUMN = "c_project_id";
  const SELECTOR_FIELD_NAME = "Project";
  const buildSelectorField = (overrides: Record<string, unknown> = {}) => ({
    name: SELECTOR_FIELD_NAME,
    columnName: SELECTOR_COLUMN,
    column: { reference: "95E2A8B50A254B2AAE6774B8C2F28120" },
    isMandatory: false,
    selector: { hasTableRelated: true, valueField: "id", displayField: "_identifier" },
    ...overrides,
  });

  const buildSelectorProps = (overrides: Partial<Parameters<typeof GridCellEditor>[0]> = {}) =>
    buildProps({
      col: { columnName: SELECTOR_COLUMN, header: SELECTOR_FIELD_NAME, accessorKey: SELECTOR_COLUMN },
      fields: [buildSelectorField()],
      ...overrides,
    });

  it("renders the search button when selector.hasTableRelated is true and the field is editable", () => {
    render(<GridCellEditor {...buildSelectorProps()} />);
    expect(screen.getByTestId(`grid-cell-search-${SELECTOR_COLUMN}`)).toBeInTheDocument();
  });

  it("does NOT render the search button when selector.hasTableRelated is false", () => {
    render(
      <GridCellEditor
        {...buildSelectorProps({
          fields: [buildSelectorField({ selector: { hasTableRelated: false, valueField: "id" } })],
        })}
      />
    );
    expect(screen.queryByTestId(`grid-cell-search-${SELECTOR_COLUMN}`)).toBeNull();
  });

  it("does NOT render the search button when the field has no `selector`", () => {
    render(
      <GridCellEditor
        {...buildSelectorProps({
          fields: [{ name: SELECTOR_FIELD_NAME, columnName: SELECTOR_COLUMN, column: { reference: "10" } }],
        })}
      />
    );
    expect(screen.queryByTestId(`grid-cell-search-${SELECTOR_COLUMN}`)).toBeNull();
  });

  it("does NOT render the search button when the cell is read-only", () => {
    mockUseWindowReferenceGridContext.mockReturnValue({
      ...DEFAULT_GRID_CONTEXT,
      fieldReadOnlyMap: { [SELECTOR_COLUMN]: true },
    });
    render(<GridCellEditor {...buildSelectorProps()} />);
    expect(screen.queryByTestId(`grid-cell-search-${SELECTOR_COLUMN}`)).toBeNull();
  });

  it("opens the SelectorModal when the search button is clicked", () => {
    render(<GridCellEditor {...buildSelectorProps()} />);
    expect(screen.queryByTestId("probe-selector-modal")).toBeNull();
    fireEvent.click(screen.getByTestId(`grid-cell-search-${SELECTOR_COLUMN}`));
    expect(screen.getByTestId("probe-selector-modal")).toBeInTheDocument();
  });

  it("routes the modal's onSelect through handleChange so onRecordChange fires with `${columnName}$_identifier`", () => {
    // The TABLEDIR/SELECTOR branch of handleChange propagates `$_identifier`,
    // so the synthetic option we build inside handleModalSelect must carry
    // the resolved identifier under `label`. Force the field-type mock to
    // return TABLEDIR *before* render so the `useCallback` closure for
    // `handleChange` captures the right value.
    const utils = jest.requireMock("@/utils") as { getFieldReference: jest.Mock };
    utils.getFieldReference.mockReturnValue("TABLEDIR");

    const onRecordChange = jest.fn();
    try {
      render(<GridCellEditor {...buildSelectorProps({ onRecordChange })} />);
      fireEvent.click(screen.getByTestId(`grid-cell-search-${SELECTOR_COLUMN}`));
      fireEvent.click(screen.getByTestId("probe-selector-modal-pick"));

      expect(onRecordChange).toHaveBeenCalledTimes(1);
      const [, payload] = onRecordChange.mock.calls[0];
      expect(payload[SELECTOR_COLUMN]).toBe("REC-1");
      expect(payload[`${SELECTOR_COLUMN}$_identifier`]).toBe("Identifier 1");
    } finally {
      // Restore the suite-wide default so later tests aren't poisoned.
      utils.getFieldReference.mockReturnValue("STRING");
    }
  });
});
