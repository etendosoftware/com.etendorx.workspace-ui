import { toInputName, buildProcessParameters } from "../processPayloadMapper";

describe("toInputName", () => {
  it("converts single word column name", () => {
    expect(toInputName("name")).toBe("inpname");
  });

  it("converts db column name to camelCase with inp prefix", () => {
    expect(toInputName("ad_org_id")).toBe("inpadOrgId");
  });

  it("converts c_order_id", () => {
    expect(toInputName("c_order_id")).toBe("inpcOrderId");
  });

  it("handles uppercase input by lowercasing first", () => {
    expect(toInputName("AD_ORG_ID")).toBe("inpadOrgId");
  });

  it("handles single segment with no underscores", () => {
    expect(toInputName("docaction")).toBe("inpdocaction");
  });
});

describe("buildProcessParameters", () => {
  const parameters = {
    "Invoice Organization": {
      name: "Invoice Organization",
      dBColumnName: "AD_Org_ID",
    } as any,
    DocAction: {
      name: "DocAction",
      dBColumnName: "DocAction",
    } as any,
  };

  it("maps form values to db column names", () => {
    const result = buildProcessParameters({ "Invoice Organization": "org-id-123" }, parameters);
    expect(result.AD_Org_ID).toBe("org-id-123");
  });

  it("ignores keys ending with _data", () => {
    const result = buildProcessParameters(
      { "Invoice Organization": "org-id", "Invoice Organization_data": "meta" },
      parameters
    );
    expect(Object.keys(result)).not.toContain("Invoice Organization_data");
  });

  it("converts empty string values to null", () => {
    const result = buildProcessParameters({ DocAction: "" }, parameters);
    expect(result.DocAction).toBeNull();
  });

  it("converts boolean true to 'Y'", () => {
    const result = buildProcessParameters({ DocAction: true }, parameters);
    expect(result.DocAction).toBe("Y");
  });

  it("converts boolean false to 'N'", () => {
    const result = buildProcessParameters({ DocAction: false }, parameters);
    expect(result.DocAction).toBe("N");
  });

  it("keeps keys without mapping as-is", () => {
    const result = buildProcessParameters({ unknownKey: "value" }, parameters);
    expect(result.unknownKey).toBe("value");
  });

  it("returns empty object for empty formValues", () => {
    const result = buildProcessParameters({}, parameters);
    expect(result).toEqual({});
  });

  it("keeps numeric values as-is", () => {
    const result = buildProcessParameters({ DocAction: 42 }, parameters);
    expect(result.DocAction).toBe(42);
  });
});
