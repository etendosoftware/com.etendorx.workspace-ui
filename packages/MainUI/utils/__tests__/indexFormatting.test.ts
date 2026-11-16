import { formatLabel, formatTime, getMessageType } from "@/utils";

describe("formatTime", () => {
  it("pads hours and minutes below 10", () => {
    expect(formatTime(new Date(2026, 0, 1, 7, 5))).toBe("07:05");
  });

  it("keeps two-digit hours and minutes as they are", () => {
    expect(formatTime(new Date(2026, 0, 1, 18, 42))).toBe("18:42");
  });

  it("accepts a date string", () => {
    expect(formatTime(new Date(2026, 5, 15, 9, 30).toISOString())).toBe("09:30");
  });
});

describe("getMessageType", () => {
  it.each([
    ["error", "error"],
    ["user", "right-user"],
    ["assistant", "left-user"],
    ["", "left-user"],
  ])("maps the sender %p to %p", (sender, expected) => {
    expect(getMessageType(sender)).toBe(expected);
  });
});

describe("formatLabel", () => {
  it("replaces %s with the count", () => {
    expect(formatLabel("Lines (%s)", 3)).toBe("Lines (3)");
  });

  it("returns undefined without a count or without a placeholder", () => {
    expect(formatLabel("Lines (%s)")).toBeUndefined();
    expect(formatLabel("Lines", 3)).toBeUndefined();
  });
});
