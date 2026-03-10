import { render } from "@testing-library/react";
import { ProductStockModalSelector } from "../ProductStockModalSelector";
import { SelectSelector } from "../SelectSelector";
import { PRODUCT_STOCK_VIEW_REFERENCE_IDS } from "@/utils/form/constants";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("../SelectSelector", () => ({
  SelectSelector: jest.fn(() => null),
}));

const getLastCallProps = () => (SelectSelector as jest.Mock).mock.lastCall?.[0];

const mockProductSimpleField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", valueField: "id" },
} as unknown as Field;

const mockProductStockField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", valueField: "id", datasourceName: "ProductStockView" },
} as unknown as Field;

const mockProductCompleteField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  column: { referenceSearchKey: PRODUCT_STOCK_VIEW_REFERENCE_IDS[0] },
  selector: { displayField: "_identifier", valueField: "id" },
} as unknown as Field;

const mockProductStockNoValueField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", datasourceName: "ProductStockView" },
} as unknown as Field;

describe("ProductStockModalSelector Columns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses ProductSimple columns when datasourceName is not ProductStockView", () => {
    render(<ProductStockModalSelector field={mockProductSimpleField} isReadOnly={false} />);

    expect(getLastCallProps().columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ accessorKey: "searchKey", header: "Search Key" }),
        expect.objectContaining({ accessorKey: "_identifier", header: "Product" }),
        expect.objectContaining({ accessorKey: "standardPrice", header: "Unit Price" }),
        expect.objectContaining({ accessorKey: "netListPrice", header: "List Price" }),
        expect.objectContaining({ accessorKey: "uOM", header: "UOM" }),
      ])
    );
  });

  test.each([
    ["datasourceName is ProductStockView", mockProductStockField],
    ["referenceSearchKey is a ProductComplete reference", mockProductCompleteField],
  ])("uses ProductStock columns when %s", (_, field) => {
    render(<ProductStockModalSelector field={field} isReadOnly={false} />);

    expect(getLastCallProps().columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ accessorKey: "_identifier", header: "Product" }),
        expect.objectContaining({ accessorKey: "storageBin", header: "Storage Bin" }),
        expect.objectContaining({ accessorKey: "attributeSetValue", header: "Attribute Set Value" }),
      ])
    );
  });

  it("uses selector valueField for stock view when provided", () => {
    render(<ProductStockModalSelector field={mockProductStockField} isReadOnly={false} />);

    expect(getLastCallProps().field.selector).toMatchObject({
      valueField: "id",
      datasourceName: "ProductStockView",
    });
  });

  it("falls back to product.id valueField for stock view when not provided", () => {
    render(<ProductStockModalSelector field={mockProductStockNoValueField} isReadOnly={false} />);

    expect(getLastCallProps().field.selector).toMatchObject({
      valueField: "product.id",
      datasourceName: "ProductStockView",
    });
  });

  it("sets valueField to id for non-stock view", () => {
    render(<ProductStockModalSelector field={mockProductSimpleField} isReadOnly={false} />);

    expect(getLastCallProps().field.selector).toMatchObject({
      valueField: "id",
      datasourceName: "ProductSimple",
    });
  });
});
