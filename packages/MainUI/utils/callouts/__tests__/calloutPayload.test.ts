import type { Field } from "@workspaceui/api-client/src/api/types";
import { applyOutFields, buildGridVisibleProperties } from "../calloutPayload";

const field = (overrides: Record<string, unknown>) => overrides as unknown as Field;

describe("buildGridVisibleProperties", () => {
  it("lists displayed columns, plus the $ path of property fields", () => {
    const tab = {
      fields: {
        name: field({ displayed: true, columnName: "Name" }),
        hidden: field({ displayed: false, columnName: "Hidden" }),
        noColumn: field({ displayed: true }),
        type: field({ displayed: true, columnName: "Type", column: { propertyPath: "file.type" } }),
      },
    };

    expect(buildGridVisibleProperties(tab)).toEqual(["Name", "Type", "file$type"]);
  });
});

describe("applyOutFields", () => {
  const product = field({
    inputName: "inpmProductId",
    selector: {
      outFields: [
        { type: "calloutInput", suffix: "_UOM", selectorFieldProperty: "uOM" },
        { type: "calloutInput", suffix: "_PSTD", selectorFieldProperty: "standardPrice" },
        { type: "field", targetHqlName: "attributeSetValue", selectorFieldProperty: "attribute" },
        { type: "field", targetHqlName: "warehouse", selectorFieldProperty: "warehouse" },
      ],
    },
  });

  it("fills callout inputs and sets target fields with their identifiers", () => {
    const calloutData: Record<string, unknown> = {};
    const setValue = jest.fn();

    applyOutFields(
      product,
      { uOM: "KG", attribute: "A1", attribute$_identifier: "Lot 1", warehouse: undefined },
      calloutData,
      setValue
    );

    expect(calloutData).toEqual({ inpmProductId_UOM: "KG", inpmProductId_PSTD: "" });
    expect(setValue).toHaveBeenCalledWith("attributeSetValue", "A1", { shouldDirty: false });
    expect(setValue).toHaveBeenCalledWith("attributeSetValue$_identifier", "Lot 1", { shouldDirty: false });
    expect(setValue).toHaveBeenCalledWith("warehouse", "", { shouldDirty: false });
    expect(setValue).not.toHaveBeenCalledWith("warehouse$_identifier", expect.anything(), expect.anything());
  });

  it("does nothing without out-fields or option data", () => {
    const calloutData: Record<string, unknown> = {};
    const setValue = jest.fn();

    applyOutFields(product, undefined, calloutData, setValue);
    applyOutFields(field({ inputName: "inpName" }), { a: 1 }, calloutData, setValue);

    expect(calloutData).toEqual({});
    expect(setValue).not.toHaveBeenCalled();
  });
});
