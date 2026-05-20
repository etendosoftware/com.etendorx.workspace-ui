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
type ProbeLoadOptions = (field: unknown, searchQuery?: string) => Promise<unknown>;
type ProbeProps = {
  hasError: boolean;
  onChange: (value: unknown) => void;
  loadOptions?: ProbeLoadOptions;
};
const capturedLoadOptionsRef: { current: ProbeLoadOptions | null } = { current: null };
jest.mock("../../Table/CellEditors", () => ({
  CellEditorFactory: ({ hasError, onChange, loadOptions }: ProbeProps) => {
    // Capture the inline `loadOptions` callback so tests can invoke it directly,
    // bypassing the dropdown UI that lives inside the real cell editor.
    capturedLoadOptionsRef.current = loadOptions ?? null;
    return (
      <div>
        <span data-testid="probe-has-error">{hasError ? "yes" : "no"}</span>
        <button type="button" data-testid="probe-trigger-change" onClick={() => onChange("value-x")}>
          change
        </button>
      </div>
    );
  },
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
  datasource: { client: { request: jest.fn() }, get: jest.fn() },
}));

// Selector-definition path mocks. These let the inline selector-definition
// branch of `loadOptions` run end-to-end against fakes that record their
// arguments so tests can assert on the request that would have been built.
jest.mock("@/utils/form/selectors/defaultFilters", () => ({
  fetchSelectorDefaultFilters: jest.fn(),
  buildCriteriaFromDefaults: jest.fn(),
}));
jest.mock("@/utils/form/selectors/selectorColumns", () => ({
  buildSelectorDatasourceParams: jest.fn(),
}));
jest.mock("@/utils/form/selectors/utils", () => ({
  buildSelectorDefaultContext: jest.fn(() => ({})),
}));
jest.mock("@/utils/contextUtils", () => ({
  buildEtendoContext: jest.fn(() => ({})),
}));
jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ graph: { getParent: () => null } }),
}));
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
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

  it("does NOT render an error message below the input even when validationError has a message", () => {
    // Workaround behavior: the red border (forwarded via `hasError` to the
    // inner editor) is the only validation indicator. The legacy `<div>`
    // that printed the translated message below the cell was removed —
    // having two indicators (border + text) looked cluttered inside grid
    // rows, and the text translation pipeline is not yet wired up for the
    // payscript-emitted messages.
    render(
      <GridCellEditor
        {...buildProps({
          validationError: { message: "fields.required" },
        })}
      />
    );
    expect(screen.getByTestId("probe-has-error")).toHaveTextContent("yes");
    expect(screen.queryByText("fields.required")).toBeNull();
    expect(document.querySelector(".text-red-500")).toBeNull();
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

describe("GridCellEditor — loadOptions selector-definition branch", () => {
  // Field that mirrors a BusinessPartner-style selector field: TABLEDIR
  // reference but `field.selector` carries a `_selectorDefinitionId` from the
  // backend, which is the trigger for the new branch.
  const SELECTOR_DEFINITION_ID = "A98899B1C75A4F4EBD3414F1B654EFAB";
  const SELECTOR_COLUMN = "c_bpartner_id";
  const SELECTOR_FIELD_NAME = "Business Partner";
  const ENTITY = "BusinessPartner";
  const FIELD_ID = "82DD3C7755B049EA9D180845CA244600";

  const buildDefinitionField = (overrides: Record<string, unknown> = {}) => ({
    id: FIELD_ID,
    name: SELECTOR_FIELD_NAME,
    columnName: SELECTOR_COLUMN,
    column: { reference: "19" }, // TABLEDIR — not SELECTOR
    referencedEntity: ENTITY,
    selector: {
      _selectorDefinitionId: SELECTOR_DEFINITION_ID,
      datasourceName: ENTITY,
      hasTableRelated: true,
      valueField: "id",
      displayField: "_identifier",
      gridColumns: [],
    },
    ...overrides,
  });

  const buildPropsForLoad = (field: ReturnType<typeof buildDefinitionField>) =>
    buildProps({
      col: { columnName: SELECTOR_COLUMN, header: SELECTOR_FIELD_NAME, accessorKey: SELECTOR_COLUMN },
      fields: [field],
    });

  const renderAndGetLoadOptions = (field: ReturnType<typeof buildDefinitionField>) => {
    capturedLoadOptionsRef.current = null;
    render(<GridCellEditor {...buildPropsForLoad(field)} />);
    const fn = capturedLoadOptionsRef.current;
    if (!fn) throw new Error("loadOptions was not captured by the CellEditorFactory probe");
    return fn;
  };

  // Fakes for the helpers — reset before each test so call counts don't leak.
  const mockFetchSelectorDefaultFilters = jest.requireMock("@/utils/form/selectors/defaultFilters")
    .fetchSelectorDefaultFilters as jest.Mock;
  const mockBuildCriteriaFromDefaults = jest.requireMock("@/utils/form/selectors/defaultFilters")
    .buildCriteriaFromDefaults as jest.Mock;
  const mockBuildSelectorDatasourceParams = jest.requireMock("@/utils/form/selectors/selectorColumns")
    .buildSelectorDatasourceParams as jest.Mock;
  const mockDatasourceGet = jest.requireMock("@workspaceui/api-client/src/api/datasource").datasource.get as jest.Mock;
  const mockDatasourceRequest = jest.requireMock("@workspaceui/api-client/src/api/datasource").datasource.client
    .request as jest.Mock;

  const DEFAULTS_RESPONSE = { filterExpression: "e.active=true", customer: "true", idFilters: [] };
  const DEFAULT_CRITERIA = [
    { fieldName: "filterExpression", operator: "iContains", value: "e.active=true" },
    { fieldName: "customer", operator: "equals", value: true },
    { fieldName: "_selectorDefinitionId", operator: "iContains", value: SELECTOR_DEFINITION_ID },
  ];

  beforeEach(() => {
    mockFetchSelectorDefaultFilters.mockReset().mockResolvedValue(DEFAULTS_RESPONSE);
    mockBuildCriteriaFromDefaults.mockReset().mockReturnValue(DEFAULT_CRITERIA);
    mockBuildSelectorDatasourceParams.mockReset().mockImplementation(({ defaultCriteria }) => ({
      // Mirror the real helper closely enough: include the criteria array so
      // the search-query criteria appending logic has something to extend.
      criteria: [...(defaultCriteria ?? [])],
      IsSelectorItem: "true",
      _selectorDefinitionId: SELECTOR_DEFINITION_ID,
    }));
    mockDatasourceGet.mockReset().mockResolvedValue({
      ok: true,
      data: {
        response: {
          data: [{ id: "BP-1", _identifier: "Customer A", name: "Customer A" }],
        },
      },
    });
    mockDatasourceRequest.mockReset();
  });

  it("calls fetchSelectorDefaultFilters and datasource.get with the selector criteria + search query", async () => {
    const loadOptions = renderAndGetLoadOptions(buildDefinitionField());

    const options = await loadOptions(buildDefinitionField(), "cust");

    expect(mockFetchSelectorDefaultFilters).toHaveBeenCalledTimes(1);
    expect(mockFetchSelectorDefaultFilters).toHaveBeenCalledWith(SELECTOR_DEFINITION_ID, expect.any(Object));

    expect(mockBuildCriteriaFromDefaults).toHaveBeenCalledWith(DEFAULTS_RESPONSE, SELECTOR_DEFINITION_ID);

    expect(mockDatasourceGet).toHaveBeenCalledTimes(1);
    const [entityArg, paramsArg] = mockDatasourceGet.mock.calls[0];
    expect(entityArg).toBe(ENTITY);
    expect(paramsArg.criteria).toEqual([
      ...DEFAULT_CRITERIA,
      { fieldName: "_identifier", operator: "iContains", value: "cust" },
    ]);
    // Pagination + textMatch params injected before `datasource.get`. Without
    // these the backend aborts with "Data was tried to be fetched ... without
    // pagination". `buildParams` auto-prefixes them with `_` on the wire.
    expect(paramsArg.startRow).toBe(0);
    expect(paramsArg.endRow).toBe(100);
    expect(paramsArg.textMatchStyle).toBe("substring");
    expect(paramsArg.noActiveFilter).toBe(true);

    // gridColumns MUST be empty when building inline params. Otherwise
    // `getHiddenDefaultCriteria` drops criteria whose fieldName matches a
    // visible column (e.g. `customer` for the BP selector), leaving the inline
    // request unfiltered.
    expect(mockBuildSelectorDatasourceParams).toHaveBeenCalledWith(expect.objectContaining({ gridColumns: [] }));

    // mapResponseToOptions transforms { id, _identifier } into { id, value, label, ... }
    expect(options).toEqual([expect.objectContaining({ id: "BP-1", value: "BP-1", label: "Customer A" })]);
  });

  it("does NOT call fetchSelectorDefaultFilters when the field has no _selectorDefinitionId (legacy GET path)", async () => {
    // No `selector` at all → legacy branch.
    const legacyField = {
      id: "F-LEGACY",
      name: SELECTOR_FIELD_NAME,
      columnName: SELECTOR_COLUMN,
      column: { reference: "19", table: "T-1" },
      referencedEntity: ENTITY,
    } as ReturnType<typeof buildDefinitionField>;
    mockDatasourceRequest.mockResolvedValue({ data: { response: { data: [] } } });

    const loadOptions = renderAndGetLoadOptions(legacyField);
    await loadOptions(legacyField, "x");

    expect(mockFetchSelectorDefaultFilters).not.toHaveBeenCalled();
    expect(mockDatasourceGet).not.toHaveBeenCalled();
    expect(mockDatasourceRequest).toHaveBeenCalledTimes(1);
    const [url, opts] = mockDatasourceRequest.mock.calls[0];
    expect(typeof url).toBe("string");
    expect(url).toContain("/datasource/");
    expect(opts.method).toBe("GET");
  });

  it("caches the SelectorDefaultFilterActionHandler response across searchQuery changes", async () => {
    const field = buildDefinitionField();
    const loadOptions = renderAndGetLoadOptions(field);

    await loadOptions(field, "a");
    await loadOptions(field, "ab");
    await loadOptions(field, "abc");

    // Defaults fetched once and reused for the 3 searchQuery variants.
    expect(mockFetchSelectorDefaultFilters).toHaveBeenCalledTimes(1);
    expect(mockDatasourceGet).toHaveBeenCalledTimes(3);
  });

  it("maps the datasource response to options with id, value and label", async () => {
    mockDatasourceGet.mockResolvedValueOnce({
      ok: true,
      data: {
        response: {
          data: [
            { id: "BP-1", _identifier: "Customer A", customer: true },
            { id: "BP-2", name: "Customer B" }, // no _identifier → falls back to name
            { id: "BP-3" }, // no name/_identifier → falls back to id
          ],
        },
      },
    });
    const field = buildDefinitionField();
    const loadOptions = renderAndGetLoadOptions(field);

    const options = (await loadOptions(field, "")) as Array<Record<string, unknown>>;

    expect(options).toEqual([
      expect.objectContaining({ id: "BP-1", value: "BP-1", label: "Customer A", customer: true }),
      expect.objectContaining({ id: "BP-2", value: "BP-2", label: "Customer B" }),
      expect.objectContaining({ id: "BP-3", value: "BP-3", label: "BP-3" }),
    ]);
  });
});
