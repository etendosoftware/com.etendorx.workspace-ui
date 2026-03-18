/**
 * Tests for ColumnFilter component
 * Tests dropdown filter functionality and cell rendering with preloaded values
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ColumnFilter } from "../ColumnFilter";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";

interface MultiSelectProps {
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (ids: string[]) => void;
  onSearch?: (term: string) => void;
  onFocus?: () => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  placeholder?: string;
  maxHeight?: number;
  enableTextFilterLogic?: boolean;
}

// Mock the MultiSelect component
jest.mock("../../Form/FormView/selectors/components/MultiSelect", () => ({
  MultiSelect: ({
    options,
    selectedValues,
    onSelectionChange,
    onSearch,
    onFocus,
    onLoadMore,
    loading,
    hasMore,
    placeholder,
  }: MultiSelectProps) => (
    <div data-testid="multi-select">
      <input
        data-testid="search-input"
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
        onFocus={onFocus}
      />
      <div data-testid="selected-values">{selectedValues.join(",")}</div>
      <div data-testid="options">
        {options.map((opt: FilterOption) => (
          <div key={opt.id} data-testid={`option-${opt.id}`}>
            <input
              type="checkbox"
              checked={selectedValues.includes(opt.id)}
              onChange={() => {
                const newSelection = selectedValues.includes(opt.id)
                  ? selectedValues.filter((v: string) => v !== opt.id)
                  : [...selectedValues, opt.id];
                onSelectionChange(newSelection);
              }}
            />
            {opt.label}
          </div>
        ))}
      </div>
      {loading && <div data-testid="loading">Loading...</div>}
      {hasMore && (
        <button type="button" data-testid="load-more-btn" onClick={onLoadMore}>
          Load More
        </button>
      )}
    </div>
  ),
}));

describe("ColumnFilter - Boolean columns", () => {
  it("renders boolean filter with Yes/No options", () => {
    const column: Column = {
      id: "status",
      name: "Status",
      columnName: "status",
      type: "boolean",
      column: {
        reference: "20",
        _identifier: "YesNo",
      },
    } as Column;

    const filterState: ColumnFilterState = {
      id: "status",
      selectedOptions: [],
      availableOptions: [],
      isMultiSelect: false,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={jest.fn()} />
    );

    expect(screen.getByTestId("multi-select")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected boolean option", () => {
    const handleFilterChange = jest.fn();
    const column: Column = {
      id: "status",
      name: "Status",
      columnName: "status",
      type: "boolean",
      column: {
        reference: "20",
        _identifier: "YesNo",
      },
    } as Column;

    const filterState: ColumnFilterState = {
      id: "status",
      selectedOptions: [],
      availableOptions: [
        { id: "true", label: "Yes", value: "true" },
        { id: "false", label: "No", value: "false" },
      ],
      isMultiSelect: false,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={handleFilterChange} />
    );

    const yesOption = screen.getByTestId("option-true");
    const checkbox = yesOption.querySelector("input[type='checkbox']") as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "true",
          label: "Yes",
        }),
      ])
    );
  });
});

describe("ColumnFilter - Dropdown columns (TABLEDIR)", () => {
  it("renders dropdown filter with available options", () => {
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [
        { id: "wh-1", label: "Warehouse 1", value: "wh-1" },
        { id: "wh-2", label: "Warehouse 2", value: "wh-2" },
      ],
      isMultiSelect: true,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={jest.fn()} />
    );

    expect(screen.getByTestId("option-wh-1")).toBeInTheDocument();
    expect(screen.getByTestId("option-wh-2")).toBeInTheDocument();
  });

  it("calls onFilterChange when dropdown option is selected", () => {
    const handleFilterChange = jest.fn();
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [
        { id: "wh-1", label: "Warehouse 1", value: "wh-1" },
      ],
      isMultiSelect: true,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={handleFilterChange} />
    );

    const whOption = screen.getByTestId("option-wh-1");
    const checkbox = whOption.querySelector("input[type='checkbox']") as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "wh-1",
          label: "Warehouse 1",
        }),
      ])
    );
  });

  it("displays preloaded selected options in availableOptions", () => {
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    // Preloaded option from idFilter
    const preloadedOption: FilterOption = {
      id: "wh-preload",
      label: "Preloaded Warehouse",
      value: "wh-preload",
    };

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [preloadedOption],
      availableOptions: [
        // Other available options from API
        { id: "wh-1", label: "Warehouse 1", value: "wh-1" },
        { id: "wh-2", label: "Warehouse 2", value: "wh-2" },
      ],
      isMultiSelect: true,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={jest.fn()} />
    );

    // Preloaded option should be in the options list
    expect(screen.getByTestId("option-wh-preload")).toBeInTheDocument();
    expect(screen.getByText("Preloaded Warehouse")).toBeInTheDocument();
  });

  it("handles search input for dropdown filter", () => {
    const handleLoadOptions = jest.fn();
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [],
      isMultiSelect: true,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter
        column={column}
        filterState={filterState}
        onFilterChange={jest.fn()}
        onLoadOptions={handleLoadOptions}
      />
    );

    const searchInput = screen.getByTestId("search-input") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "test search" } });

    expect(handleLoadOptions).toHaveBeenCalledWith("test search");
  });

  it("calls onLoadOptions on focus for non-boolean columns", () => {
    const handleLoadOptions = jest.fn();
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [],
      isMultiSelect: true,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter
        column={column}
        filterState={filterState}
        onFilterChange={jest.fn()}
        onLoadOptions={handleLoadOptions}
      />
    );

    const searchInput = screen.getByTestId("search-input") as HTMLInputElement;
    fireEvent.focus(searchInput);

    expect(handleLoadOptions).toHaveBeenCalled();
  });

  it("handles load more for TABLEDIR columns", () => {
    const handleLoadMore = jest.fn();
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [{ id: "wh-1", label: "Warehouse 1", value: "wh-1" }],
      isMultiSelect: true,
      loading: false,
      hasMore: true,
      searchQuery: "",
    };

    render(
      <ColumnFilter
        column={column}
        filterState={filterState}
        onFilterChange={jest.fn()}
        onLoadMoreOptions={handleLoadMore}
      />
    );

    const loadMoreBtn = screen.getByTestId("load-more-btn");
    fireEvent.click(loadMoreBtn);

    expect(handleLoadMore).toHaveBeenCalled();
  });
});

describe("ColumnFilter - Text columns", () => {
  it("returns null for non-dropdown columns without filter type", () => {
    const column: Column = {
      id: "description",
      name: "Description",
      columnName: "description",
      type: "text",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "description",
      selectedOptions: [],
      availableOptions: [],
      isMultiSelect: false,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    const { container } = render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={jest.fn()} />
    );

    // Should not render MultiSelect for non-supported columns
    expect(container.firstChild).toBeNull();
  });
});

describe("ColumnFilter - Loading states", () => {
  it("displays loading indicator when loading is true", () => {
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [],
      isMultiSelect: true,
      loading: true,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={jest.fn()} />
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("ColumnFilter - Multiple selections", () => {
  it("allows multiple options to be selected in dropdown", () => {
    const handleFilterChange = jest.fn();
    const column: Column = {
      id: "warehouse",
      name: "Warehouse",
      columnName: "warehouse",
      type: "tabledir",
      referencedEntity: "true",
    } as Column;

    const filterState: ColumnFilterState = {
      id: "warehouse",
      selectedOptions: [],
      availableOptions: [
        { id: "wh-1", label: "Warehouse 1", value: "wh-1" },
        { id: "wh-2", label: "Warehouse 2", value: "wh-2" },
      ],
      isMultiSelect: true,
      loading: false,
      hasMore: false,
      searchQuery: "",
    };

    render(
      <ColumnFilter column={column} filterState={filterState} onFilterChange={handleFilterChange} />
    );

    // Select first option
    const option1 = screen.getByTestId("option-wh-1");
    const checkbox1 = option1.querySelector("input[type='checkbox']") as HTMLInputElement;
    fireEvent.click(checkbox1);

    // Select second option
    const option2 = screen.getByTestId("option-wh-2");
    const checkbox2 = option2.querySelector("input[type='checkbox']") as HTMLInputElement;
    fireEvent.click(checkbox2);

    expect(handleFilterChange).toHaveBeenCalledTimes(2);
  });
});
