import { buildSuccessBannerMessage, readBannerRawMessage } from "../responseBanner";

describe("readBannerRawMessage", () => {
  it("returns the string when `data` is a plain string", () => {
    expect(readBannerRawMessage("Hi there")).toBe("Hi there");
  });

  it("returns `msgText` when present on an object", () => {
    expect(readBannerRawMessage({ msgText: "Done" })).toBe("Done");
  });

  it("falls back to `message` when `msgText` is absent", () => {
    expect(readBannerRawMessage({ message: "Updated" })).toBe("Updated");
  });

  it("prefers `msgText` over `message`", () => {
    expect(readBannerRawMessage({ msgText: "A", message: "B" })).toBe("A");
  });

  it("returns undefined when neither key is present", () => {
    expect(readBannerRawMessage({})).toBeUndefined();
  });

  it("returns undefined for null/undefined data (no banner expected)", () => {
    expect(readBannerRawMessage(undefined)).toBeUndefined();
    expect(readBannerRawMessage(null)).toBeUndefined();
  });
});

describe("buildSuccessBannerMessage", () => {
  it("returns null when no message is present (Classic-silent UX)", () => {
    expect(buildSuccessBannerMessage(undefined, false)).toBeNull();
    expect(buildSuccessBannerMessage({}, false)).toBeNull();
  });

  it("returns parsed message for plain string data", () => {
    expect(buildSuccessBannerMessage("Done", false)).toEqual({
      msgText: "Done",
      isHtml: false,
    });
  });

  it("returns parsed message from msgText field", () => {
    expect(buildSuccessBannerMessage({ msgText: "OK" }, false)).toEqual({
      msgText: "OK",
      isHtml: false,
    });
  });

  it("detects HTML content from the markup regex", () => {
    const parsed = buildSuccessBannerMessage({ msgText: "<b>bold</b>" }, false);
    expect(parsed).not.toBeNull();
    expect(parsed?.isHtml).toBe(true);
  });

  it("respects the `successHint` flag when truthy even for plain text", () => {
    const parsed = buildSuccessBannerMessage({ msgText: "plain" }, true);
    expect(parsed?.isHtml).toBe(true);
  });

  it("stringifies object messages for safe rendering", () => {
    const parsed = buildSuccessBannerMessage({ msgText: { code: 42 } }, false);
    expect(parsed?.msgText).toBe('{"code":42}');
  });
});
