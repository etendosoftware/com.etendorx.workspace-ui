import { CUSTOM_COMPONENT_REGISTRY, getCustomComponent, isRegisteredCustomSchema } from "../registry";

jest.mock("../GenericWarehouseProcess", () => ({ GenericWarehouseProcess: () => null }));
jest.mock("../MiddlewareTokenProcess", () => ({ MiddlewareTokenProcess: () => null }));

describe("custom component registry", () => {
  it("keeps warehouseProcess registered, so the existing warehouse flows are unaffected", () => {
    expect(isRegisteredCustomSchema("warehouseProcess")).toBe(true);
    expect(getCustomComponent("warehouseProcess")).toBe(CUSTOM_COMPONENT_REGISTRY.warehouseProcess);
  });

  it("registers the middleware token chooser", () => {
    expect(isRegisteredCustomSchema("middlewareTokenProcess")).toBe(true);
  });

  it("rejects an unknown type, so such a schema falls through to the standard render as before", () => {
    expect(isRegisteredCustomSchema("somethingElse")).toBe(false);
    expect(getCustomComponent("somethingElse")).toBeUndefined();
  });

  it("rejects non-string types without throwing", () => {
    for (const value of [undefined, null, 0, {}, []]) {
      expect(isRegisteredCustomSchema(value)).toBe(false);
    }
  });

  it("does not resolve inherited Object properties as components", () => {
    // A bare record lookup would return Object.prototype.constructor for these keys.
    expect(getCustomComponent("constructor")).toBeUndefined();
    expect(getCustomComponent("toString")).toBeUndefined();
  });
});
