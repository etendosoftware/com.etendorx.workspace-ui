import { NAMED_COLORS } from "../constants";

describe("color constants", () => {
  it("should have RGB values for standard color names", () => {
    expect(NAMED_COLORS.red).toEqual({ r: 255, g: 0, b: 0 });
    expect(NAMED_COLORS.blue).toEqual({ r: 0, g: 0, b: 255 });
    expect(NAMED_COLORS.green).toEqual({ r: 0, g: 128, b: 0 });
    expect(NAMED_COLORS.black).toEqual({ r: 0, g: 0, b: 0 });
    expect(NAMED_COLORS.white).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should support both gray and grey spellings", () => {
    expect(NAMED_COLORS.gray).toEqual(NAMED_COLORS.grey);
  });

  it("should have transparent mapped to white", () => {
    expect(NAMED_COLORS.transparent).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should have all expected color names", () => {
    const expectedColors = [
      "red",
      "blue",
      "green",
      "yellow",
      "orange",
      "purple",
      "pink",
      "brown",
      "black",
      "white",
      "gray",
      "grey",
      "transparent",
    ];
    for (const color of expectedColors) {
      expect(NAMED_COLORS[color]).toBeDefined();
      expect(NAMED_COLORS[color]).toHaveProperty("r");
      expect(NAMED_COLORS[color]).toHaveProperty("g");
      expect(NAMED_COLORS[color]).toHaveProperty("b");
    }
  });

  it("should have RGB values in valid 0-255 range", () => {
    for (const [, rgb] of Object.entries(NAMED_COLORS)) {
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    }
  });
});
