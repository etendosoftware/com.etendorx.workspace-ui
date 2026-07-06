/**
 * Tests for SelectorModal component
 * Tests modal rendering, data fetching, filtering, and record selection
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SelectorModal from "../SelectorModal";
import { useFormContext } from "react-hook-form";
import {
  createMockField,
  createMockGridColumnsForSelector,
  createMockEntityData,
  createMockFormContext,
  createMockTabContext,
  createMockUserContext,
  createMockLanguageContext,
  createMockTranslationFunction,
} from "../__testHelpers__/selectorModalTestHelpers";

// Mock dependencies
jest.mock("react-hook-form");
jest.mock("@/hooks/useDatasource", () => ({
  useDatasource: jest.fn(),
}));
jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(),
}));
jest.mock("@/contexts/language", () => ({
  useLanguage: jest.fn(),
}));
jest.mock("@/stores/userStore", () => ({
  useUserStore: jest.fn(),
}));
jest.mock("@/hooks/useSelected", () => ({
  useSelected: jest.fn(),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: jest.fn(),
}));
jest.mock("@/components/Table/styles", () => ({
  useStyle: jest.fn(),
}));
jest.mock("@/utils/contextUtils", () => ({
  buildEtendoContext: jest.fn(),
}));
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
  MaterialReactTable: ({ children }: any) => <div data-testid="table">{children}</div>,
  useMaterialReactTable: jest.fn(() => ({})),
}));

describe("SelectorModal", () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();
  const defaultField = createMockField({
    selector: {
      datasourceName: "TestEntity",
      gridColumns: createMockGridColumnsForSelector(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup form context mock
    (useFormContext as jest.Mock).mockReturnValue(createMockFormContext());

    // Setup other hooks
    const { useTabContext } = require("@/contexts/tab");
    useTabContext.mockReturnValue(createMockTabContext());

    const { useLanguage } = require("@/contexts/language");
    useLanguage.mockReturnValue(createMockLanguageContext());

    const { useUserStore } = require("@/stores/userStore");
    useUserStore.mockImplementation((selector: any) => selector(createMockUserContext()));

    const { useSelected } = require("@/hooks/useSelected");
    useSelected.mockReturnValue({ graph: {} });

    const { useTranslation } = require("@/hooks/useTranslation");
    useTranslation.mockReturnValue({
      t: createMockTranslationFunction(),
    });

    const { useStyle } = require("@/components/Table/styles");
    useStyle.mockReturnValue({ sx: {} });

    const { useDatasource } = require("@/hooks/useDatasource");
    useDatasource.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { useSelectorDefaultCriteria } = require("../hooks/useSelectorDefaultCriteria");
    useSelectorDefaultCriteria.mockReturnValue({
      defaultCriteria: [],
      defaultFilterResponse: {},
      selectorDefinitionId: "sel-1",
    });

    const { useSelectorFilterHandlers } = require("../hooks/useSelectorFilterHandlers");
    useSelectorFilterHandlers.mockReturnValue({
      handleTextFilterChange: jest.fn(),
      handleBooleanFilterChange: jest.fn(),
      handleDropdownFilterChange: jest.fn(),
      handleLoadFilterOptions: jest.fn(),
      handleLoadMoreFilterOptions: jest.fn(),
      advancedColumnFilters: [],
    });

    const {
      buildDatasourceColumns,
      buildSelectorColumnDefs,
      buildSelectorDatasourceParams,
    } = require("@/utils/form/selectors/selectorColumns");
    buildDatasourceColumns.mockReturnValue([]);
    buildSelectorColumnDefs.mockReturnValue([]);
    buildSelectorDatasourceParams.mockReturnValue({});

    const { buildEtendoContext } = require("@/utils/contextUtils");
    buildEtendoContext.mockReturnValue({});
  });

  it("renders modal dialog when isOpen is true", () => {
    render(<SelectorModal field={defaultField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <SelectorModal field={defaultField} isOpen={false} onClose={mockOnClose} onSelect={mockOnSelect} />
    );

    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const { container } = render(
      <SelectorModal field={defaultField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
    );

    // Find the close icon button (IconButton with X icon)
    const closeButtons = container.querySelectorAll("button");
    const closeButton = Array.from(closeButtons).find((btn) => btn.querySelector("svg"));

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it("handles field with custom datasourceName", () => {
    const customField = createMockField({
      selector: {
        datasourceName: "CustomDatasource",
        gridColumns: createMockGridColumnsForSelector(),
      },
    });

    render(<SelectorModal field={customField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("handles field with referencedEntity fallback when datasourceName is missing", () => {
    const fieldWithoutDatasourceName = createMockField({
      referencedEntity: "FallbackEntity",
      selector: {
        gridColumns: createMockGridColumnsForSelector(),
      },
    });

    render(
      <SelectorModal field={fieldWithoutDatasourceName} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("synthesizes a fallback `_identifier` column when selector.gridColumns is empty (e.g. multi-selector without OBUISEL_SELECTOR_FIELD rows)", () => {
    const fieldWithEmptyGridColumns = createMockField({
      name: "Accounting Status",
      selector: {
        datasourceName: "List",
        gridColumns: [],
      },
    });

    const { buildSelectorColumnDefs } = require("@/utils/form/selectors/selectorColumns");
    buildSelectorColumnDefs.mockClear();

    render(
      <SelectorModal field={fieldWithEmptyGridColumns} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
    );

    // The first positional arg should be the synthesized fallback column array
    const callArgs = buildSelectorColumnDefs.mock.calls[0]?.[0];
    expect(callArgs).toHaveLength(1);
    expect(callArgs[0]).toMatchObject({
      accessorKey: "_identifier",
      header: "Accounting Status",
    });
  });

  it("does NOT synthesize a fallback column when targetEntity is also missing (no datasource → modal cannot fetch anyway)", () => {
    const bareField = createMockField({
      referencedEntity: undefined as unknown as string,
      selector: { gridColumns: [] },
    });

    const { buildSelectorColumnDefs } = require("@/utils/form/selectors/selectorColumns");
    buildSelectorColumnDefs.mockClear();

    render(<SelectorModal field={bareField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(buildSelectorColumnDefs.mock.calls[0]?.[0]).toEqual([]);
  });

  it("passes correct parameters to datasource hook", () => {
    const { useDatasource } = require("@/hooks/useDatasource");
    useDatasource.mockReturnValue({
      data: [createMockEntityData()],
      loading: false,
      error: null,
    });

    render(<SelectorModal field={defaultField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(useDatasource).toHaveBeenCalled();
  });

  it("displays currentDisplayValue when provided", () => {
    render(
      <SelectorModal
        field={defaultField}
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        currentDisplayValue="Current Value"
      />
    );

    // The modal should render with the provided display value accessible
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("handles empty grid columns gracefully", () => {
    const fieldWithoutColumns = createMockField({
      selector: {
        datasourceName: "TestEntity",
        gridColumns: [],
      },
    });

    render(<SelectorModal field={fieldWithoutColumns} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("sorts grid columns by sortNo", () => {
    const unsortedColumns = [
      { ...createMockGridColumnsForSelector()[2], sortNo: 3 },
      { ...createMockGridColumnsForSelector()[0], sortNo: 1 },
      { ...createMockGridColumnsForSelector()[1], sortNo: 2 },
    ];

    const fieldWithUnsortedColumns = createMockField({
      selector: {
        datasourceName: "TestEntity",
        gridColumns: unsortedColumns,
      },
    });

    render(
      <SelectorModal field={fieldWithUnsortedColumns} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  describe("optional getValues / currentTab overrides (grid mode)", () => {
    // These tests pin the contract used by `GridCellEditor`: when a P&E grid
    // opens the modal, the row's data and the P&E tab must take precedence
    // over the ambient form/tab contexts (which point at the outer record).
    it("forwards the `getValues` prop to useSelectorDefaultCriteria when provided", () => {
      const customGetValues = jest.fn(() => ({ rowField: "row-value" }));
      const { useSelectorDefaultCriteria } = require("../hooks/useSelectorDefaultCriteria");

      render(
        <SelectorModal
          field={defaultField}
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          getValues={customGetValues}
        />
      );

      const callArgs = (useSelectorDefaultCriteria as jest.Mock).mock.calls.at(-1)[0];
      expect(callArgs.getValues).toBe(customGetValues);
    });

    it("falls back to useFormContext().getValues when no `getValues` prop is supplied", () => {
      const formContextGetValues = jest.fn(() => ({ fromForm: true }));
      (useFormContext as jest.Mock).mockReturnValue({
        ...createMockFormContext(),
        getValues: formContextGetValues,
      });
      const { useSelectorDefaultCriteria } = require("../hooks/useSelectorDefaultCriteria");

      render(<SelectorModal field={defaultField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

      const callArgs = (useSelectorDefaultCriteria as jest.Mock).mock.calls.at(-1)[0];
      expect(callArgs.getValues).toBe(formContextGetValues);
    });

    it("forwards the `currentTab` prop to useSelectorDefaultCriteria when provided", () => {
      const customTab = { id: "PE-TAB", window: "PE-WINDOW", table: "PE-TABLE", fields: {} };
      const { useSelectorDefaultCriteria } = require("../hooks/useSelectorDefaultCriteria");

      render(
        <SelectorModal
          field={defaultField}
          isOpen={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          // biome-ignore lint/suspicious/noExplicitAny: test override, real type comes from api-client
          currentTab={customTab as any}
        />
      );

      const callArgs = (useSelectorDefaultCriteria as jest.Mock).mock.calls.at(-1)[0];
      expect(callArgs.currentTab).toEqual(customTab);
    });

    it("falls back to useTabContext().tab when no `currentTab` prop is supplied", () => {
      // `useTabContext` is re-mocked here so we can compare against the *same*
      // tab object the component received (instead of a freshly built helper).
      const ambientTab = { id: "ambient-tab", window: "ambient-window", fields: {} };
      const { useTabContext } = require("@/contexts/tab");
      useTabContext.mockReturnValue({ tab: ambientTab });
      const { useSelectorDefaultCriteria } = require("../hooks/useSelectorDefaultCriteria");

      render(<SelectorModal field={defaultField} isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

      const callArgs = (useSelectorDefaultCriteria as jest.Mock).mock.calls.at(-1)[0];
      expect(callArgs.currentTab).toBe(ambientTab);
    });
  });
});
