/**
 * Tests for the multi-select branch of SelectorModal: footer (Cancel/Confirm),
 * row-selection state initialization from `initialSelectedIds`, behavior of
 * `onMultiSelect` (with stub synthesis for IDs not currently loaded), and
 * non-regression of single-select behavior.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SelectorModal from "../SelectorModal";
import { useFormContext } from "react-hook-form";
import {
  createMockField,
  createMockGridColumnsForSelector,
  createMockFormContext,
  createMockTabContext,
  createMockUserContext,
  createMockLanguageContext,
  createMockTranslationFunction,
} from "../__testHelpers__/selectorModalTestHelpers";

let lastTableOptions: Record<string, unknown> | null = null;

jest.mock("react-hook-form");
jest.mock("@/hooks/useDatasource", () => ({ useDatasource: jest.fn() }));
jest.mock("@/contexts/tab", () => ({ useTabContext: jest.fn() }));
jest.mock("@/contexts/language", () => ({ useLanguage: jest.fn() }));
jest.mock("@/hooks/useUserContext", () => ({ useUserContext: jest.fn() }));
jest.mock("@/hooks/useSelected", () => ({ useSelected: jest.fn() }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: jest.fn() }));
jest.mock("@/components/Table/styles", () => ({ useStyle: jest.fn() }));
jest.mock("@/utils/contextUtils", () => ({ buildEtendoContext: jest.fn() }));
jest.mock("@/utils/form/selectors/selectorColumns", () => ({
  buildDatasourceColumns: jest.fn(),
  buildSelectorColumnDefs: jest.fn(),
  buildSelectorDatasourceParams: jest.fn(),
  getFilterType: jest.fn(),
}));
jest.mock("../hooks/useSelectorDefaultCriteria", () => ({
  useSelectorDefaultCriteria: jest.fn(),
}));
jest.mock("../hooks/useSelectorFilterHandlers", () => ({
  useSelectorFilterHandlers: jest.fn(),
}));
jest.mock("material-react-table", () => ({
  MaterialReactTable: () => <div data-testid="table" />,
  useMaterialReactTable: jest.fn((opts) => {
    lastTableOptions = opts;
    return {};
  }),
}));

const setupCommonMocks = (overrides: { records?: unknown[]; idFilters?: unknown[] } = {}) => {
  (useFormContext as jest.Mock).mockReturnValue(createMockFormContext());
  require("@/contexts/tab").useTabContext.mockReturnValue(createMockTabContext());
  require("@/contexts/language").useLanguage.mockReturnValue(createMockLanguageContext());
  require("@/hooks/useUserContext").useUserContext.mockReturnValue(createMockUserContext());
  require("@/hooks/useSelected").useSelected.mockReturnValue({ graph: {} });
  require("@/hooks/useTranslation").useTranslation.mockReturnValue({
    t: createMockTranslationFunction(),
  });
  require("@/components/Table/styles").useStyle.mockReturnValue({ sx: {} });
  require("@/hooks/useDatasource").useDatasource.mockReturnValue({
    records: overrides.records ?? [],
    loading: false,
    error: null,
    fetchMore: jest.fn(),
    hasMoreRecords: false,
  });
  require("../hooks/useSelectorDefaultCriteria").useSelectorDefaultCriteria.mockReturnValue({
    defaultCriteria: [],
    defaultFilterResponse: { idFilters: overrides.idFilters ?? [] },
    selectorDefinitionId: "sel-1",
  });
  require("../hooks/useSelectorFilterHandlers").useSelectorFilterHandlers.mockReturnValue({
    handleTextFilterChange: jest.fn(),
    handleBooleanFilterChange: jest.fn(),
    handleDropdownFilterChange: jest.fn(),
    handleLoadFilterOptions: jest.fn(),
    handleLoadMoreFilterOptions: jest.fn(),
    advancedColumnFilters: [],
  });
  const cols = require("@/utils/form/selectors/selectorColumns");
  cols.buildDatasourceColumns.mockReturnValue([]);
  cols.buildSelectorColumnDefs.mockReturnValue([]);
  cols.buildSelectorDatasourceParams.mockReturnValue({});
  require("@/utils/contextUtils").buildEtendoContext.mockReturnValue({});
};

const FIELD = createMockField({
  selector: { datasourceName: "Status", gridColumns: createMockGridColumnsForSelector() },
});

describe("SelectorModal — multi-select branch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastTableOptions = null;
  });

  it("renders no footer when multiSelect is false (regression: single-select unchanged)", () => {
    setupCommonMocks();
    render(<SelectorModal field={FIELD} isOpen={true} onClose={jest.fn()} onSelect={jest.fn()} />);
    expect(screen.queryByTestId(`SelectorModalConfirm__${FIELD.id}`)).toBeNull();
    expect(screen.queryByTestId(`SelectorModalCancel__${FIELD.id}`)).toBeNull();
  });

  it("renders Cancel/Confirm footer when multiSelect is true", () => {
    setupCommonMocks();
    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        multiSelect
        onMultiSelect={jest.fn()}
      />
    );
    expect(screen.getByTestId(`SelectorModalConfirm__${FIELD.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`SelectorModalCancel__${FIELD.id}`)).toBeInTheDocument();
  });

  it("Cancel button calls onClose without invoking onMultiSelect", () => {
    setupCommonMocks();
    const onClose = jest.fn();
    const onMultiSelect = jest.fn();
    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={onClose}
        onSelect={jest.fn()}
        multiSelect
        onMultiSelect={onMultiSelect}
      />
    );
    fireEvent.click(screen.getByTestId(`SelectorModalCancel__${FIELD.id}`));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onMultiSelect).not.toHaveBeenCalled();
  });

  it("Confirm passes loaded records matching the rowSelection state, then calls onClose", () => {
    const loaded = [
      { id: "a", _identifier: "A-label" },
      { id: "b", _identifier: "B-label" },
      { id: "c", _identifier: "C-label" },
    ];
    setupCommonMocks({ records: loaded });
    const onClose = jest.fn();
    const onMultiSelect = jest.fn();

    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={onClose}
        onSelect={jest.fn()}
        multiSelect
        initialSelectedIds={["a", "c"]}
        onMultiSelect={onMultiSelect}
      />
    );

    fireEvent.click(screen.getByTestId(`SelectorModalConfirm__${FIELD.id}`));

    expect(onMultiSelect).toHaveBeenCalledTimes(1);
    expect(onMultiSelect.mock.calls[0][0]).toEqual([
      { id: "a", _identifier: "A-label" },
      { id: "c", _identifier: "C-label" },
    ]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Confirm synthesizes stubs for pre-selected IDs that are not currently loaded, using the caller-provided id→identifier map", () => {
    setupCommonMocks({ records: [] });
    const onMultiSelect = jest.fn();
    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        multiSelect
        initialSelectedIds={["missing-1"]}
        initialSelectedIdentifiersById={{ "missing-1": "Drafted" }}
        onMultiSelect={onMultiSelect}
      />
    );
    fireEvent.click(screen.getByTestId(`SelectorModalConfirm__${FIELD.id}`));

    expect(onMultiSelect).toHaveBeenCalledWith([{ id: "missing-1", _identifier: "Drafted" }]);
  });

  it("Confirm stub falls back to raw ID when no id→identifier map is provided", () => {
    setupCommonMocks({ records: [] });
    const onMultiSelect = jest.fn();
    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        multiSelect
        initialSelectedIds={["missing-1"]}
        onMultiSelect={onMultiSelect}
      />
    );
    fireEvent.click(screen.getByTestId(`SelectorModalConfirm__${FIELD.id}`));

    expect(onMultiSelect).toHaveBeenCalledWith([{ id: "missing-1", _identifier: "missing-1" }]);
  });

  it("passes enableRowSelection/enableMultiRowSelection to MRT when multiSelect is true", () => {
    setupCommonMocks();
    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        multiSelect
        onMultiSelect={jest.fn()}
      />
    );
    expect(lastTableOptions?.enableRowSelection).toBe(true);
    expect(lastTableOptions?.enableMultiRowSelection).toBe(true);
    expect(typeof lastTableOptions?.getRowId).toBe("function");
  });

  it("passes enableRowSelection=false to MRT when multiSelect is false (regression)", () => {
    setupCommonMocks();
    render(<SelectorModal field={FIELD} isOpen={true} onClose={jest.fn()} onSelect={jest.fn()} />);
    expect(lastTableOptions?.enableRowSelection).toBe(false);
    expect(lastTableOptions?.enableMultiRowSelection).toBe(false);
  });

  it("initial rowSelection state seeds from initialSelectedIds", () => {
    setupCommonMocks();
    render(
      <SelectorModal
        field={FIELD}
        isOpen={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        multiSelect
        initialSelectedIds={["x", "y"]}
        onMultiSelect={jest.fn()}
      />
    );
    expect(lastTableOptions?.state).toMatchObject({ rowSelection: { x: true, y: true } });
  });
});
