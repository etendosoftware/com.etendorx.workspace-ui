import {
  formatUTCTimeToLocal,
  formatLocalTimeToUTCPayload,
  formatAbsoluteTimeToDisplay,
  formatDisplayToAbsoluteTimePayload,
  formatTimeTo12Hour,
  getTimeFormatters,
} from "../utils";

/** A single input → expected pair for a pure string time formatter. */
type TimeFormatCase = { title: string; input: string; expected: string };

/**
 * Registers, via `it.each`, one assertion per case for a pure string formatter,
 * removing the repeated `it(..., () => expect(fn(input)).toBe(expected))` boilerplate
 * shared across the deterministic formatter describe blocks.
 */
const runTimeFormatCases = (format: (value: string) => string, cases: TimeFormatCase[]) => {
  it.each(cases)("$title", ({ input, expected }) => {
    expect(format(input)).toBe(expected);
  });
};

/**
 * Registers the invalid-input assertion shared by the pass-through formatters:
 * empty, null and undefined values must be returned unchanged.
 */
const itReturnsNonStringInputsUnchanged = (format: (value: string) => string) => {
  it("returns input unchanged for empty or non-string values", () => {
    expect(format("")).toBe("");
    expect(format(null as unknown as string)).toBe(null);
    expect(format(undefined as unknown as string)).toBe(undefined);
  });
};

describe("formatUTCTimeToLocal", () => {
  it("returns input unchanged for empty string", () => {
    expect(formatUTCTimeToLocal("")).toBe("");
  });

  it("returns input unchanged for non-string values", () => {
    expect(formatUTCTimeToLocal(null as any)).toBe(null);
    expect(formatUTCTimeToLocal(undefined as any)).toBe(undefined);
  });

  it("parses a HH:MM:SS UTC time and returns a local time string", () => {
    // This will return local time - just check format
    const result = formatUTCTimeToLocal("12:00:00");
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("parses HH:MM without seconds", () => {
    const result = formatUTCTimeToLocal("08:30");
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("returns input unchanged for invalid time with too few parts", () => {
    expect(formatUTCTimeToLocal("12")).toBe("12");
  });

  it("returns input unchanged for NaN hours", () => {
    expect(formatUTCTimeToLocal("ab:30:00")).toBe("ab:30:00");
  });

  it("handles ISO datetime string with T", () => {
    const result = formatUTCTimeToLocal("2023-01-15T12:00:00");
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("handles ISO datetime string with Z", () => {
    const result = formatUTCTimeToLocal("2023-01-15T12:00:00Z");
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe("formatLocalTimeToUTCPayload", () => {
  it("returns input unchanged for empty string", () => {
    expect(formatLocalTimeToUTCPayload("")).toBe("");
  });

  it("returns input unchanged for non-string values", () => {
    expect(formatLocalTimeToUTCPayload(null as any)).toBe(null);
    expect(formatLocalTimeToUTCPayload(undefined as any)).toBe(undefined);
  });

  it("converts HH:MM:SS to UTC ISO format without milliseconds", () => {
    const result = formatLocalTimeToUTCPayload("12:30:45");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it("converts HH:MM (no seconds) to UTC ISO format", () => {
    const result = formatLocalTimeToUTCPayload("08:00");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it("returns input unchanged for invalid format with too few parts", () => {
    expect(formatLocalTimeToUTCPayload("12")).toBe("12");
  });

  it("returns input unchanged for NaN hours", () => {
    expect(formatLocalTimeToUTCPayload("xx:30:00")).toBe("xx:30:00");
  });

  it("does not include milliseconds in output", () => {
    const result = formatLocalTimeToUTCPayload("10:20:30");
    expect(result).not.toContain(".");
  });
});

describe("formatAbsoluteTimeToDisplay", () => {
  itReturnsNonStringInputsUnchanged(formatAbsoluteTimeToDisplay);

  runTimeFormatCases(formatAbsoluteTimeToDisplay, [
    {
      title: "extracts the time part from an ISO datetime without shifting it",
      input: "2024-06-01T09:30:00",
      expected: "09:30:00",
    },
    { title: "keeps a plain HH:MM:SS value as-is", input: "09:30:00", expected: "09:30:00" },
    { title: "pads a HH:MM value to HH:MM:SS", input: "9:30", expected: "09:30:00" },
    { title: "drops a trailing Z", input: "2024-06-01T09:30:00Z", expected: "09:30:00" },
    { title: "drops a numeric timezone offset", input: "2024-06-01T09:30:00+02:00", expected: "09:30:00" },
    { title: "drops milliseconds", input: "09:30:00.123", expected: "09:30:00" },
    { title: "returns input unchanged when there are too few parts", input: "09", expected: "09" },
  ]);
});

describe("formatDisplayToAbsoluteTimePayload", () => {
  itReturnsNonStringInputsUnchanged(formatDisplayToAbsoluteTimePayload);

  it("prefixes today's local date and preserves the literal time", () => {
    const result = formatDisplayToAbsoluteTimePayload("14:15:00");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T14:15:00$/);
  });

  it("pads a HH:MM value to HH:MM:SS", () => {
    const result = formatDisplayToAbsoluteTimePayload("9:5");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T09:05:00$/);
  });

  it("never includes milliseconds", () => {
    expect(formatDisplayToAbsoluteTimePayload("10:20:30")).not.toContain(".");
  });

  it("returns input unchanged when there are too few parts", () => {
    expect(formatDisplayToAbsoluteTimePayload("14")).toBe("14");
  });

  it("preserves the exact wall-clock time (round-trip with display)", () => {
    const payload = formatDisplayToAbsoluteTimePayload("23:59:59");
    expect(formatAbsoluteTimeToDisplay(payload)).toBe("23:59:59");
  });
});

describe("formatTimeTo12Hour", () => {
  itReturnsNonStringInputsUnchanged(formatTimeTo12Hour);

  runTimeFormatCases(formatTimeTo12Hour, [
    { title: "formats a morning time as AM", input: "09:30:00", expected: "09:30:00 AM" },
    { title: "formats an afternoon time as PM", input: "15:36:55", expected: "03:36:55 PM" },
    { title: "formats midnight as 12 AM", input: "00:00:00", expected: "12:00:00 AM" },
    { title: "formats noon as 12 PM", input: "12:00:00", expected: "12:00:00 PM" },
    { title: "pads a HH:MM value and defaults seconds to 00", input: "9:05", expected: "09:05:00 AM" },
    { title: "returns input unchanged when there are too few parts", input: "15", expected: "15" },
    { title: "returns input unchanged for NaN hours", input: "ab:30:00", expected: "ab:30:00" },
  ]);
});

describe("getTimeFormatters", () => {
  it("returns the UTC round-trip pair when absolute is false", () => {
    const formatters = getTimeFormatters(false);
    expect(formatters.toDisplay).toBe(formatUTCTimeToLocal);
    expect(formatters.toPayload).toBe(formatLocalTimeToUTCPayload);
  });

  it("returns the absolute pass-through pair when absolute is true", () => {
    const formatters = getTimeFormatters(true);
    expect(formatters.toDisplay).toBe(formatAbsoluteTimeToDisplay);
    expect(formatters.toPayload).toBe(formatDisplayToAbsoluteTimePayload);
  });
});
