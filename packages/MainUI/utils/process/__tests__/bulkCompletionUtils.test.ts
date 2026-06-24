import {
  buildOnLoadScripts,
  DEFAULT_BULK_COMPLETION_ONLOAD,
  DOC_ACTION,
  isBulkCompletionProcess,
  isBulkParameterRenderable,
  isDocActionParameter,
} from "../bulkCompletionUtils";

const VOID_DATE = "VoidDate";
const OTHER_PARAM = "OtherParam";

const makeProcess = (overrides = {}) =>
  ({
    etmetaOnload: null,
    isMultiRecord: "Y",
    ...overrides,
  }) as any;

const makeParams = (params: any[] = []) => {
  return Object.fromEntries(params.map((p, i) => [i, p])) as any;
};

const docActionParam = { name: DOC_ACTION, dBColumnName: DOC_ACTION };

describe("isDocActionParameter", () => {
  it("matches by dBColumnName", () => {
    expect(isDocActionParameter({ name: "X", dBColumnName: DOC_ACTION } as any)).toBe(true);
  });

  it("matches by name", () => {
    expect(isDocActionParameter({ name: DOC_ACTION, dBColumnName: "X" } as any)).toBe(true);
  });

  it("does not match other parameters", () => {
    expect(isDocActionParameter({ name: OTHER_PARAM, dBColumnName: OTHER_PARAM } as any)).toBe(false);
  });
});

describe("isBulkCompletionProcess", () => {
  it("returns true even when etmetaOnload is defined (decoupled from onLoad)", () => {
    const process = makeProcess({ etmetaOnload: "some script" });
    const params = makeParams([docActionParam]);
    expect(isBulkCompletionProcess(process, params)).toBe(true);
  });

  it("returns false when isMultiRecord is false", () => {
    const process = makeProcess({ isMultiRecord: false });
    const params = makeParams([docActionParam]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns false when isMultiRecord is 'N'", () => {
    const process = makeProcess({ isMultiRecord: "N" });
    const params = makeParams([docActionParam]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns false when no DocAction parameter exists", () => {
    const process = makeProcess({ isMultiRecord: true });
    const params = makeParams([{ name: OTHER_PARAM, dBColumnName: "OtherColumn" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(false);
  });

  it("returns true when isMultiRecord is true and DocAction param exists by name", () => {
    const process = makeProcess({ isMultiRecord: true });
    const params = makeParams([{ name: DOC_ACTION, dBColumnName: "SomeCol" }]);
    expect(isBulkCompletionProcess(process, params)).toBe(true);
  });

  it("returns true when isMultiRecord is 'Y' and DocAction param exists by dBColumnName", () => {
    const process = makeProcess({ isMultiRecord: "Y" });
    const params = makeParams([{ name: "OtherName", dBColumnName: DOC_ACTION }]);
    expect(isBulkCompletionProcess(process, params)).toBe(true);
  });

  it("returns false with empty parameters", () => {
    const process = makeProcess({ isMultiRecord: "Y" });
    expect(isBulkCompletionProcess(process, makeParams([]))).toBe(false);
  });
});

describe("buildOnLoadScripts", () => {
  const CUSTOM_ONLOAD = "(process, view) => {}";

  it("runs only the default for a bulk process without a custom onLoad", () => {
    expect(buildOnLoadScripts(null, true)).toEqual([DEFAULT_BULK_COMPLETION_ONLOAD]);
  });

  it("runs the default first and the custom onLoad second for a bulk process", () => {
    expect(buildOnLoadScripts(CUSTOM_ONLOAD, true)).toEqual([DEFAULT_BULK_COMPLETION_ONLOAD, CUSTOM_ONLOAD]);
  });

  it("runs only the custom onLoad for a non-bulk process", () => {
    expect(buildOnLoadScripts(CUSTOM_ONLOAD, false)).toEqual([CUSTOM_ONLOAD]);
  });

  it("returns an empty list when there is nothing to run", () => {
    expect(buildOnLoadScripts(null, false)).toEqual([]);
  });
});

describe("isBulkParameterRenderable", () => {
  it("renders the DocAction parameter", () => {
    expect(isBulkParameterRenderable(docActionParam as any)).toBe(true);
  });

  it("hides a non-DocAction parameter by default", () => {
    expect(isBulkParameterRenderable({ name: VOID_DATE, dBColumnName: VOID_DATE } as any)).toBe(false);
  });

  it("renders a non-DocAction parameter when shown by the script via dBColumnName", () => {
    const param = { name: "Void Date", dBColumnName: VOID_DATE };
    expect(isBulkParameterRenderable(param as any, { [`${VOID_DATE}.display`]: true })).toBe(true);
  });

  it("renders a non-DocAction parameter when shown by the script via name", () => {
    const param = { name: VOID_DATE, dBColumnName: "void_date_col" };
    expect(isBulkParameterRenderable(param as any, { [`${VOID_DATE}.display`]: true })).toBe(true);
  });

  it("keeps a non-DocAction parameter hidden when the script flag is false", () => {
    const param = { name: VOID_DATE, dBColumnName: VOID_DATE };
    expect(isBulkParameterRenderable(param as any, { [`${VOID_DATE}.display`]: false })).toBe(false);
  });
});
