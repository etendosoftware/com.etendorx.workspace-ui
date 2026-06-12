import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextFilter } from "../TextFilter";
import type { Column } from "@workspaceui/api-client/src/api/types";

jest.mock("../utils/performanceOptimizations", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => void) => fn,
}));

const column: Column = {
  id: "documentNo",
  name: "Document No.",
  columnName: "documentNo",
} as Column;

describe("TextFilter", () => {
  describe("rendering", () => {
    it("renders a text input with placeholder derived from column name", () => {
      render(<TextFilter column={column} onFilterChange={jest.fn()} />);
      expect(screen.getByPlaceholderText("Filter Document No....")).toBeInTheDocument();
    });

    it("uses columnName as fallback when column name is absent", () => {
      const col = { ...column, name: "" } as Column;
      render(<TextFilter column={col} onFilterChange={jest.fn()} />);
      expect(screen.getByPlaceholderText("Filter documentNo...")).toBeInTheDocument();
    });

    it("does not render operator selector buttons", () => {
      render(<TextFilter column={column} onFilterChange={jest.fn()} />);
      expect(screen.queryByTitle("Contains")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Starts with")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Equals")).not.toBeInTheDocument();
    });
  });

  describe("text input", () => {
    it("calls onFilterChange with the typed string", () => {
      const onFilterChange = jest.fn();
      render(<TextFilter column={column} onFilterChange={onFilterChange} />);
      fireEvent.change(screen.getByPlaceholderText("Filter Document No...."), { target: { value: "hello" } });
      expect(onFilterChange).toHaveBeenCalledWith("hello");
    });

    it("calls onFilterChange with empty string when cleared", () => {
      const onFilterChange = jest.fn();
      render(<TextFilter column={column} onFilterChange={onFilterChange} filterValue="abc" />);
      fireEvent.change(screen.getByPlaceholderText("Filter Document No...."), { target: { value: "" } });
      expect(onFilterChange).toHaveBeenCalledWith("");
    });
  });

  describe("filterValue prop sync", () => {
    it("initializes input from a plain string filterValue", () => {
      render(<TextFilter column={column} onFilterChange={jest.fn()} filterValue="preloaded" />);
      expect(screen.getByPlaceholderText("Filter Document No....")).toHaveValue("preloaded");
    });

    it("initializes input from the text field of a TextFilterValue", () => {
      render(
        <TextFilter
          column={column}
          onFilterChange={jest.fn()}
          filterValue={{ text: "search term", operator: "equals" }}
        />
      );
      expect(screen.getByPlaceholderText("Filter Document No....")).toHaveValue("search term");
    });

    it("resets input when filterValue becomes undefined", () => {
      const { rerender } = render(<TextFilter column={column} onFilterChange={jest.fn()} filterValue="initial" />);
      rerender(<TextFilter column={column} onFilterChange={jest.fn()} filterValue={undefined} />);
      expect(screen.getByPlaceholderText("Filter Document No....")).toHaveValue("");
    });
  });
});
