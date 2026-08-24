import { compileExpression } from "../BaseSelector";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";

const PREF_KEY = "WriteOffLimitPreference";
const WINDOW_ID = "143";
const SCOPED_KEY = `${PREF_KEY}_${WINDOW_ID}`;

/**
 * The compiled function caches by expression string, so every test needs its own expression text
 * to get a fresh compile. Appending a harmless comparison keeps the expression unique while still
 * returning the preference value's comparison result.
 */
const compileGet = (uniqueSuffix: string, args = `'${PREF_KEY}'`) =>
  compileExpression(`OB.PropertyStore.get(${args}) /* ${uniqueSuffix} */`);

describe("compileExpression — OB.PropertyStore window scoping", () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it("resolves the window-scoped key from the compiled function's windowId argument", () => {
    savePreferences({ [PREF_KEY]: "global", [SCOPED_KEY]: "scoped" });

    const compiled = compileGet("scoped-from-arg");

    expect(compiled({}, {}, WINDOW_ID)).toBe("scoped");
  });

  it("falls back to the global key when the window has no scoped entry", () => {
    savePreferences({ [PREF_KEY]: "global" });

    const compiled = compileGet("global-fallback");

    expect(compiled({}, {}, WINDOW_ID)).toBe("global");
  });

  it("lets an explicit second argument override the compiled windowId", () => {
    savePreferences({ [SCOPED_KEY]: "scoped" });

    const compiled = compileGet("explicit-arg", `'${PREF_KEY}', '${WINDOW_ID}'`);

    expect(compiled({}, {}, "someOtherWindow")).toBe("scoped");
  });

  it("reads only the global key when called with two arguments, as before", () => {
    // Non-regression: every existing call site invokes the compiled function as (context, values).
    savePreferences({ [PREF_KEY]: "global", [SCOPED_KEY]: "scoped" });

    const compiled = compileGet("two-arg-call");

    expect(compiled({}, {})).toBe("global");
  });

  it("still prefers the session context over stored preferences", () => {
    savePreferences({ [SCOPED_KEY]: "scoped" });

    const compiled = compileGet("context-wins");

    expect(compiled({ [PREF_KEY]: "fromContext" }, {}, WINDOW_ID)).toBe("fromContext");
  });

  it("returns undefined when the preference is absent everywhere", () => {
    savePreferences({});

    const compiled = compileGet("absent");

    expect(compiled({}, {}, WINDOW_ID)).toBeUndefined();
  });
});
