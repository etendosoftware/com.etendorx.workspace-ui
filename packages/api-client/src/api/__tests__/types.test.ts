import { SessionMode, FormMode, FieldType } from "../types";

describe("SessionMode", () => {
  it("should include SETSESSION mode", () => {
    expect(SessionMode.SETSESSION).toBe("SETSESSION");
  });

  it("should be independent from FormMode", () => {
    expect(SessionMode.SETSESSION).toBeDefined();

    // Verify SessionMode is separate from FormMode enum
    expect(SessionMode).not.toHaveProperty("NEW");
    expect(SessionMode).not.toHaveProperty("EDIT");

    // Verify FormMode doesn't have SessionMode values
    expect(FormMode).not.toHaveProperty("SETSESSION");
  });

  it("should have correct type definitions", () => {
    // Verify SessionMode values are strings
    expect(typeof SessionMode.SETSESSION).toBe("string");

    // Verify SessionMode object is properly typed
    const sessionModeKeys = Object.keys(SessionMode);
    expect(sessionModeKeys).toContain("SETSESSION");
    expect(sessionModeKeys).toHaveLength(1);
  });
});

describe("FormMode independence", () => {
  it("should not conflict with SessionMode", () => {
    expect(FormMode.NEW).toBe("NEW");
    expect(FormMode.EDIT).toBe("EDIT");

    // Ensure no overlap between the two mode types
    const formModeValues = Object.values(FormMode);
    const sessionModeValues = Object.values(SessionMode);

    for (const formValue of formModeValues) {
      expect(sessionModeValues).not.toContain(formValue);
    }
  });
});

describe("FieldType", () => {
  it("should include all expected field types", () => {
    expect(FieldType.TEXT).toBe("text");
    expect(FieldType.NUMBER).toBe("number");
    expect(FieldType.DATE).toBe("date");
    expect(FieldType.BOOLEAN).toBe("boolean");
    expect(FieldType.SELECT).toBe("select");
    expect(FieldType.IMAGE).toBe("image");
  });
});
