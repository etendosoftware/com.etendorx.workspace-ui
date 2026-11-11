import { copyColumnLength, getTextMaxLength } from "../columnLength";

const field = (length: unknown, dBColumnName?: string) => ({ column: { length, dBColumnName } }) as never;

describe("getTextMaxLength", () => {
  it("uses the length of the column", () => {
    expect(getTextMaxLength(field(40, "value"))).toBe(40);
    expect(getTextMaxLength(field("255", "name"))).toBe(255);
  });

  it.each([
    ["missing", undefined],
    ["zero", 0],
    ["negative", -1],
    ["not a number", "abc"],
  ])("sets no limit when the length is %s", (_, length) => {
    expect(getTextMaxLength(field(length, "value"))).toBeUndefined();
  });

  it("sets no limit when the field has no column", () => {
    expect(getTextMaxLength({} as never)).toBeUndefined();
  });

  describe("documentno without length (Classic grid rule)", () => {
    it("limits the grid editor to 20", () => {
      expect(getTextMaxLength(field(0, "DocumentNo"), { grid: true })).toBe(20);
      expect(getTextMaxLength(field(0, "documentno"), { grid: true })).toBe(20);
    });

    it("does not limit the form, as in Classic", () => {
      expect(getTextMaxLength(field(0, "DocumentNo"))).toBeUndefined();
    });

    it("keeps the column length when it has one", () => {
      expect(getTextMaxLength(field(30, "DocumentNo"), { grid: true })).toBe(30);
    });

    it("does not apply to other columns", () => {
      expect(getTextMaxLength(field(0, "name"), { grid: true })).toBeUndefined();
    });
  });
});

describe("copyColumnLength (grid editor field)", () => {
  it("copies the length and the database name from the tab field to the editor field", () => {
    const editorField = { column: { reference: "10", _identifier: "Search Key" } } as {
      column: Record<string, unknown>;
    };
    copyColumnLength(editorField, { column: { length: 40, dBColumnName: "Value" } });

    expect(editorField.column).toEqual({
      reference: "10",
      _identifier: "Search Key",
      length: 40,
      dBColumnName: "Value",
    });
  });

  it("makes the grid editor cap the input at the column length", () => {
    const editorField = { column: { reference: "10" } };
    copyColumnLength(editorField, { column: { length: 40 } });

    expect(getTextMaxLength(editorField as never, { grid: true })).toBe(40);
  });

  it("keeps a documentno column without length working in the grid", () => {
    const editorField = { column: { reference: "10" } };
    copyColumnLength(editorField, { column: { length: 0, dBColumnName: "DocumentNo" } });

    expect(getTextMaxLength(editorField as never, { grid: true })).toBe(20);
  });

  it("leaves the editor field untouched when the tab field has no length", () => {
    const editorField = { column: { reference: "10" } };
    copyColumnLength(editorField, { column: {} });

    expect(editorField.column).toEqual({ reference: "10" });
  });

  it("creates the column when the editor field had none", () => {
    const editorField = {} as { column?: Record<string, unknown> };
    copyColumnLength(editorField, { column: { length: 255 } });

    expect(editorField.column).toEqual({ length: 255 });
  });
});
