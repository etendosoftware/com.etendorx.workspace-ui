import { getTextMaxLength } from "../columnLength";

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
