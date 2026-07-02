import { buildLegacySelectorUrl, parseSelectorPayload } from "../legacySelectorPopup";
import { LEGACY_ACTIONS, LEGACY_MESSAGE_TYPE } from "../../legacyMessageProtocol";

const pickedEnvelope = (action: string, id: string, identifier: string) => ({
  type: LEGACY_MESSAGE_TYPE,
  action: LEGACY_ACTIONS.SELECTOR_VALUE_PICKED,
  payload: { action, id, identifier },
});

describe("parseSelectorPayload", () => {
  it("extracts a well-formed selector payload", () => {
    expect(parseSelectorPayload(pickedEnvelope("SAVE", "P1", "Product One"))).toEqual({
      action: "SAVE",
      id: "P1",
      identifier: "Product One",
    });
  });

  it("returns null for a non-object", () => {
    expect(parseSelectorPayload("nope")).toBeNull();
    expect(parseSelectorPayload(null)).toBeNull();
  });

  it("returns null for the wrong envelope type", () => {
    expect(parseSelectorPayload({ ...pickedEnvelope("SAVE", "P1", "x"), type: "other" })).toBeNull();
  });

  it("returns null for the wrong action", () => {
    expect(parseSelectorPayload({ ...pickedEnvelope("SAVE", "P1", "x"), action: "closeModal" })).toBeNull();
  });

  it("returns null when the payload is missing", () => {
    expect(
      parseSelectorPayload({ type: LEGACY_MESSAGE_TYPE, action: LEGACY_ACTIONS.SELECTOR_VALUE_PICKED })
    ).toBeNull();
  });
});

describe("buildLegacySelectorUrl", () => {
  const base = { publicHost: "https://host", legacySearchUrl: "/info/Product.html" };

  it("builds the legacy forward URL with the default command", () => {
    const url = buildLegacySelectorUrl(base);
    expect(url).toContain("https://host/meta/legacy/info/Product.html");
    expect(url).toContain("Command=DEFAULT");
  });

  it("includes the current id and token when provided", () => {
    const url = buildLegacySelectorUrl({ ...base, currentId: "ABC", token: "tok" });
    expect(url).toContain("inpIDValue=ABC");
    expect(url).toContain("token=tok");
  });

  it("omits the current id and token when absent", () => {
    const url = buildLegacySelectorUrl({ ...base, currentId: undefined, token: null });
    expect(url).not.toContain("inpIDValue=");
    expect(url).not.toContain("token=");
  });
});
