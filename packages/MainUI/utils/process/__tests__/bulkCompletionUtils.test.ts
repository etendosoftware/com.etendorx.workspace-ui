import { isBulkCompletionProcess } from "../bulkCompletionUtils";

describe("isBulkCompletionProcess", () => {
  const makeProcess = (overrides = {}) =>
    ({
      onLoad: undefined,
      isMultiRecord: "Y",
      ...overrides,
    }) as any;

  const makeParams = (params: any[] = []) => {
    return Object.fromEntries(params.map((p, i) => [i, p])) as any;
  };

  it("returns false when onLoad is already defined", () => {
    const process = makeProcess({ onLoad: "some script" });
    const params = makeParams([{ name: "DocAction", dBColumnName: "DocAction" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns false when isMultiRecord is false", () => {
    const process = makeProcess({ isMultiRecord: false });
    const params = makeParams([{ name: "DocAction", dBColumnName: "DocAction" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns false when isMultiRecord is 'N'", () => {
    const process = makeProcess({ isMultiRecord: "N" });
    const params = makeParams([{ name: "DocAction", dBColumnName: "DocAction" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns false when no DocAction parameter exists", () => {
    const process = makeProcess({ isMultiRecord: true });
    const params = makeParams([{ name: "OtherParam", dBColumnName: "OtherColumn" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns true when isMultiRecord is true and DocAction param exists by name", () => {
    const process = makeProcess({ isMultiRecord: true });
    const params = makeParams([{ name: "DocAction", dBColumnName: "SomeCol" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(true);
  });

  it("returns true when isMultiRecord is 'Y' and DocAction param exists by dBColumnName", () => {
    const process = makeProcess({ isMultiRecord: "Y" });
    const params = makeParams([{ name: "OtherName", dBColumnName: "DocAction" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(true);
  });

  it("returns false with empty parameters", () => {
    const process = makeProcess({ isMultiRecord: "Y" });
    expect(isBulkCompletionProcess(process, makeParams([]))).toBe(false);
  });
});
