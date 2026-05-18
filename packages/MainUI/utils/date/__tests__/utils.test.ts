import { formatUTCTimeToLocal, formatLocalTimeToUTCPayload } from "../utils";

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
