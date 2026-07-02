import { toClassicBoolean } from "../toClassicBoolean";

describe("toClassicBoolean", () => {
  it.each([
    [false, false],
    [null, false],
    [undefined, false],
    ["", false],
    ["N", false],
    ["n", false],
    ["false", false],
    ["0", false],
    [0, false],
  ])("returns false for %p", (input, expected) => {
    expect(toClassicBoolean(input)).toBe(expected);
  });

  it.each([
    [true, true],
    ["Y", true],
    ["y", true],
    ["true", true],
    ["1", true],
    [1, true],
    ["X", true],
    ["someId", true],
    [42, true],
  ])("returns true for %p", (input, expected) => {
    expect(toClassicBoolean(input)).toBe(expected);
  });
});
