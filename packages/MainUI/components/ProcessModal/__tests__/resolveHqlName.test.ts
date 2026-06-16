import { isValidHqlName, resolveHqlName } from "../WindowReferenceGrid";

describe("isValidHqlName", () => {
  it.each(["gLItem", "paidOut", "receivedIn", "amount", "businessPartner", "a", "a1"])(
    "accepts canonical HQL camelCase: %s",
    (name) => {
      expect(isValidHqlName(name)).toBe(true);
    }
  );

  it.each([
    ["c_glitem_id", "underscores (DB column shape)"],
    ["received_in", "underscores (DB column shape)"],
    ["g/LItem", "slash"],
    ["G/L Item", "spaces + uppercase first letter"],
    ["G_L_Item", "uppercase first letter"],
    ["orderNo.", "dot"],
    ["invoiceNo.", "dot"],
    ["", "empty string"],
    [" gLItem", "leading whitespace"],
    ["gLItem ", "trailing whitespace"],
    ["1gLItem", "leading digit"],
    ["g-LItem", "dash"],
  ])("rejects %s (%s)", (name) => {
    expect(isValidHqlName(name)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidHqlName(undefined)).toBe(false);
    expect(isValidHqlName(null)).toBe(false);
    expect(isValidHqlName(42)).toBe(false);
    expect(isValidHqlName({})).toBe(false);
    expect(isValidHqlName([])).toBe(false);
    expect(isValidHqlName(true)).toBe(false);
  });
});

describe("resolveHqlName", () => {
  describe("prefers the metadata key (Etendo convention)", () => {
    it("uses the key even when field.hqlName is a broken display label", () => {
      // Real case from add-payment metadata: hqlName carries the display label.
      expect(resolveHqlName({ hqlName: "g/LItem", columnName: "c_glitem_id" }, "gLItem")).toBe("gLItem");
    });

    it("uses the key even when field.hqlName is a navigation path with a dot", () => {
      // Real case from order_invoice metadata: hqlName="orderNo." but key="salesOrderNo".
      expect(resolveHqlName({ hqlName: "orderNo.", columnName: "salesOrderNo" }, "salesOrderNo")).toBe("salesOrderNo");
    });

    it("uses the key over a DB columnName like 'received_in'", () => {
      // Real case from glitem metadata: hqlName="receivedIn" matches key, columnName="received_in".
      expect(resolveHqlName({ hqlName: "receivedIn", columnName: "received_in" }, "receivedIn")).toBe("receivedIn");
    });

    it("returns the key when it is a clean HQL identifier and the field has no overrides", () => {
      expect(resolveHqlName({}, "amount")).toBe("amount");
    });
  });

  describe("falls back when the key is not a clean HQL name", () => {
    it("uses field.hqlName when the key is invalid but hqlName is valid", () => {
      expect(resolveHqlName({ hqlName: "validName" }, "invalid key")).toBe("validName");
    });

    it("uses field.columnName when neither the key nor hqlName is valid", () => {
      expect(resolveHqlName({ columnName: "validName" }, "invalid.key")).toBe("validName");
    });

    it("returns the (invalid) key as a last resort when nothing else helps", () => {
      expect(resolveHqlName({}, "invalid key")).toBe("invalid key");
    });
  });

  describe("defensive handling", () => {
    it("handles null/undefined field gracefully by returning the key", () => {
      expect(resolveHqlName(null, "gLItem")).toBe("gLItem");
      expect(resolveHqlName(undefined, "gLItem")).toBe("gLItem");
    });

    it("returns an empty string when key is empty and field has no usable fields", () => {
      expect(resolveHqlName({}, "")).toBe("");
    });
  });
});
