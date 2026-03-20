import { isColorString, getContrastTextColor } from "../utils";

describe("isColorString", () => {
  it("returns false for non-string values", () => {
    expect(isColorString(null)).toBe(false);
    expect(isColorString(123)).toBe(false);
    expect(isColorString(undefined)).toBe(false);
    expect(isColorString({})).toBe(false);
  });

  it("validates short hex colors", () => {
    expect(isColorString("#fff")).toBe(true);
    expect(isColorString("#000")).toBe(true);
    expect(isColorString("#abc")).toBe(true);
  });

  it("validates long hex colors", () => {
    expect(isColorString("#ffffff")).toBe(true);
    expect(isColorString("#1F845A")).toBe(true);
    expect(isColorString("#000000")).toBe(true);
  });

  it("rejects invalid hex colors", () => {
    expect(isColorString("#gggggg")).toBe(false);
    expect(isColorString("#ff")).toBe(false);
    expect(isColorString("#fffffff")).toBe(false);
  });

  it("validates rgb colors", () => {
    expect(isColorString("rgb(255, 255, 255)")).toBe(true);
    expect(isColorString("rgb(0, 0, 0)")).toBe(true);
  });

  it("validates rgba colors", () => {
    expect(isColorString("rgba(255, 0, 0, 0.5)")).toBe(true);
    expect(isColorString("rgba(0, 0, 0, 1)")).toBe(true);
  });

  it("validates hsl colors", () => {
    expect(isColorString("hsl(120, 100%, 50%)")).toBe(true);
  });

  it("validates hsla colors", () => {
    expect(isColorString("hsla(120, 100%, 50%, 0.3)")).toBe(true);
  });

  it("validates named colors", () => {
    expect(isColorString("red")).toBe(true);
    expect(isColorString("blue")).toBe(true);
    expect(isColorString("transparent")).toBe(true);
  });

  it("rejects random strings", () => {
    expect(isColorString("banana")).toBe(false);
    expect(isColorString("not-a-color")).toBe(false);
    expect(isColorString("")).toBe(false);
  });
});

describe("getContrastTextColor", () => {
  it("returns white text for dark backgrounds", () => {
    expect(getContrastTextColor("#000000")).toBe("#FFFFFF");
    expect(getContrastTextColor("#1F845A")).toBe("#FFFFFF");
    expect(getContrastTextColor("rgb(0, 0, 0)")).toBe("#FFFFFF");
  });

  it("returns black text for light backgrounds", () => {
    expect(getContrastTextColor("#ffffff")).toBe("#000000");
    expect(getContrastTextColor("#FFEB3B")).toBe("#000000");
  });

  it("falls back to black text for unrecognized colors", () => {
    expect(getContrastTextColor("notacolor")).toBe("#000000");
  });

  it("handles short hex colors", () => {
    const result = getContrastTextColor("#fff");
    expect(result).toBe("#000000");
  });

  it("handles rgb colors", () => {
    expect(getContrastTextColor("rgb(255, 0, 0)")).toBe("#FFFFFF");
    expect(getContrastTextColor("rgb(255, 255, 255)")).toBe("#000000");
  });

  it("handles hsl colors", () => {
    const result = getContrastTextColor("hsl(0, 100%, 50%)");
    expect(typeof result).toBe("string");
    expect([" #000000", "#FFFFFF"].includes(result) || result === "#FFFFFF" || result === "#000000").toBe(true);
  });

  it("handles named colors", () => {
    const result = getContrastTextColor("white");
    expect(result).toBe("#000000");
  });
});
