import { expect, test, type Locator } from "@playwright/test";
import { atLevel, exactText, standaloneText } from "../components/level";

/** Locator double whose first/last matches are tagged, enough for atLevel. */
const fakeLocator = (): Locator => ({ first: () => "first", last: () => "last" }) as unknown as Locator;

test.describe("atLevel", () => {
  test("the header is the first match", () => {
    expect(atLevel(fakeLocator(), "header")).toBe("first");
  });

  test("the child tab is the last match", () => {
    expect(atLevel(fakeLocator(), "child")).toBe("last");
  });
});

test.describe("exactText", () => {
  test("matches the whole text only", () => {
    expect(exactText("Book").test("Book")).toBe(true);
    expect(exactText("Book").test("Rebook")).toBe(false);
    expect(exactText("Book").test("Book it")).toBe(false);
  });

  test("escapes regular expression characters", () => {
    const pattern = exactText("Process Made Payment(s) [1.0]");
    expect(pattern.test("Process Made Payment(s) [1.0]")).toBe(true);
    expect(pattern.test("Process Made Payments [1x0]")).toBe(false);
  });
});

test.describe("standaloneText", () => {
  test("finds the value inside the field text", () => {
    expect(standaloneText("1 (Spain)").test("Payment Method 1 (Spain)")).toBe(true);
    expect(standaloneText("1 (Spain)").test("1 (Spain)")).toBe(true);
  });

  test("does not take the tail of a longer value for it", () => {
    expect(standaloneText("1 (Spain)").test("Payment Method 2.1 (Spain)")).toBe(false);
    expect(standaloneText("1 (Spain)").test("11 (Spain)")).toBe(false);
  });
});
