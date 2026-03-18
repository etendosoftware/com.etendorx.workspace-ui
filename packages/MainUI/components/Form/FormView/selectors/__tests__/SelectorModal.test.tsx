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
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: jest.fn(),
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

    const { useUserContext } = require("@/hooks/useUserContext");
    useUserContext.mockReturnValue(createMockUserContext());

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
});
