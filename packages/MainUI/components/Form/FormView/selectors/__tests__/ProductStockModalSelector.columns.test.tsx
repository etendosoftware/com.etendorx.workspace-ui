import { render } from "@testing-library/react";
import { ProductStockModalSelector } from "../ProductStockModalSelector";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import { useFormContext } from "react-hook-form";
import { PRODUCT_STOCK_VIEW_REFERENCE_IDS } from "@/utils/form/constants";

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
jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({ children, onClick }: any) => (
  <button onClick={onClick}>{children}</button>
));
jest.mock("../components/TextInput", () => ({ TextInput: () => <div>TextInput</div> }));

jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(() => ({ parentTab: null })),
}));

const mockProductSimpleField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", valueField: "id" },
} as any;

const mockProductStockField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", valueField: "id", datasourceName: "ProductStockView" },
} as any;

const mockProductCompleteField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  column: { referenceSearchKey: PRODUCT_STOCK_VIEW_REFERENCE_IDS[0] },
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

  it("uses ProductSimple columns when datasourceName is not ProductStockView", () => {
    const backendColumns = [
      { name: "col1", title: "Column 1", isDisplayed: true },
      { name: "col2", title: "Column 2", isDisplayed: true },
    ];

    (useTableDirDatasource as jest.Mock).mockReturnValue({
      records: [],
      loading: false,
      refetch: jest.fn(),
      search: jest.fn(),
      columns: backendColumns,
    });

    const { useMaterialReactTable } = require("material-react-table");

    render(<ProductStockModalSelector field={mockProductSimpleField} isReadOnly={false} />);

    expect(useMaterialReactTable).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.arrayContaining([
          expect.objectContaining({ accessorKey: "searchKey", header: "Search Key" }),
          expect.objectContaining({ accessorKey: "_identifier", header: "Product" }),
          expect.objectContaining({ accessorKey: "standardPrice", header: "Unit Price" }),
          expect.objectContaining({ accessorKey: "netListPrice", header: "List Price" }),
          expect.objectContaining({ accessorKey: "uOM", header: "UOM" }),
        ]),
      })
    );
  });

  it("uses ProductStock columns when datasourceName is ProductStockView", () => {
    (useTableDirDatasource as jest.Mock).mockReturnValue({
      records: [],
      loading: false,
      refetch: jest.fn(),
      search: jest.fn(),
      columns: [],
    });

    const { useMaterialReactTable } = require("material-react-table");

    render(<ProductStockModalSelector field={mockProductStockField} isReadOnly={false} />);

    expect(useMaterialReactTable).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.arrayContaining([
          expect.objectContaining({ accessorKey: "_identifier", header: "Product" }),
          expect.objectContaining({ accessorKey: "storageBin", header: "Storage Bin" }),
          expect.objectContaining({ accessorKey: "attributeSetValue", header: "Attribute Set Value" }),
        ]),
      })
    );
  });

  it("uses ProductStock columns when referenceSearchKey is a ProductComplete reference", () => {
    (useTableDirDatasource as jest.Mock).mockReturnValue({
      records: [],
      loading: false,
      refetch: jest.fn(),
      search: jest.fn(),
      columns: [],
    });

    const { useMaterialReactTable } = require("material-react-table");

    render(<ProductStockModalSelector field={mockProductCompleteField} isReadOnly={false} />);

    expect(useMaterialReactTable).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.arrayContaining([
          expect.objectContaining({ accessorKey: "_identifier", header: "Product" }),
          expect.objectContaining({ accessorKey: "storageBin", header: "Storage Bin" }),
          expect.objectContaining({ accessorKey: "attributeSetValue", header: "Attribute Set Value" }),
        ]),
      })
    );
  });
});
