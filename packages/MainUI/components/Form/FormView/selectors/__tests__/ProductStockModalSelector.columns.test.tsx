import { render, screen, fireEvent } from "@testing-library/react";
import { ProductStockModalSelector } from "../ProductStockModalSelector";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import { useFormContext } from "react-hook-form";

// Mocks
jest.mock("@/hooks/datasource/useTableDirDatasource");
jest.mock("react-hook-form");
jest.mock("material-react-table", () => ({
  useMaterialReactTable: jest.fn(() => ({})),
  MaterialReactTable: ({ table }: any) => <div data-testid="mock-mrt">MRT Table</div>,
}));

// Mock Modal to simple div
jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => {
    return ({ children, open, onCancel, buttons }: any) => {
        if (!open) return null;
        return (
            <div data-testid="mock-modal">
                <button onClick={onCancel}>Cancel</button>
                {children}
                {buttons}
            </div>
        );
    };
});

jest.mock("@workspaceui/componentlibrary/src/assets/icons/package.svg", () => (props: any) => <svg {...props} />);
jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>);
jest.mock("../components/TextInput", () => ({ TextInput: () => <div>TextInput</div> }));

const mockField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", valueField: "id" },
} as any;

describe("ProductStockModalSelector Columns", () => {
    const setValue = jest.fn();
    const watch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useFormContext as jest.Mock).mockReturnValue({
            watch,
            setValue,
        });
    });

    it("uses backend columns when provided", () => {
        const backendColumns = [
            { name: "col1", title: "Column 1", isDisplayed: true },
            { name: "col2", title: "Column 2", isDisplayed: true }
        ];

        (useTableDirDatasource as jest.Mock).mockReturnValue({
            records: [],
            loading: false,
            refetch: jest.fn(),
            search: jest.fn(),
            columns: backendColumns,
        });

        // We need to spy on useMaterialReactTable to verify columns passed
        const { useMaterialReactTable } = require("material-react-table");

        render(<ProductStockModalSelector field={mockField} isReadOnly={false} />);

        // Check if useMaterialReactTable was called with expected columns
        expect(useMaterialReactTable).toHaveBeenCalledWith(expect.objectContaining({
            columns: expect.arrayContaining([
                expect.objectContaining({ accessorKey: "col1", header: "Column 1" }),
                expect.objectContaining({ accessorKey: "col2", header: "Column 2" })
            ])
        }));
    });

    it("falls back to default columns when backend columns are empty", () => {
        (useTableDirDatasource as jest.Mock).mockReturnValue({
            records: [],
            loading: false,
            refetch: jest.fn(),
            search: jest.fn(),
            columns: [],
        });

        const { useMaterialReactTable } = require("material-react-table");

        render(<ProductStockModalSelector field={mockField} isReadOnly={false} />);

        expect(useMaterialReactTable).toHaveBeenCalledWith(expect.objectContaining({
            columns: expect.arrayContaining([
                expect.objectContaining({ header: "Product" }),
                expect.objectContaining({ header: "Storage Bin" }),
                 expect.objectContaining({ header: "Attribute Set Value" })
            ])
        }));
    });
});
