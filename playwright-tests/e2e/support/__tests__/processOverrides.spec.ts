import { expect, test } from "@playwright/test";
import {
  applyFieldOverrides,
  applyPreferenceOverrides,
  applyProcessOverrides,
  applySessionRoleOverrides,
  applyTabOverrides,
  PREFERENCES_URL,
  processMetadataUrl,
  SESSION_URL,
  windowMetadataUrl,
} from "../processOverrides";

type WindowMetadata = Parameters<typeof applyProcessOverrides>[0];

const PROCESS_ID = "9BED7889E1034FE68BD85D5D16857320";
const WINDOW_ID = "E547CE89D4C04429B6340FFA44E70716";
const ON_PROCESS = "async () => undefined";

function metadataWith(...processIds: (string | undefined)[]): WindowMetadata {
  return {
    tabs: [
      {
        fields: Object.fromEntries(
          processIds.map((id, index) => [`field${index}`, id ? { processDefinition: { id } } : {}])
        ),
      },
    ],
  };
}

test.describe("applyProcessOverrides", () => {
  test("sets the overrides on every button that runs the process", () => {
    const metadata = metadataWith(PROCESS_ID, "OTHER", undefined, PROCESS_ID);
    expect(applyProcessOverrides(metadata, PROCESS_ID, { etmetaOnprocess: ON_PROCESS })).toBe(2);
    const definitions = Object.values(metadata.tabs?.[0].fields ?? {}).map((field) => field.processDefinition);
    expect(definitions.map((definition) => definition?.etmetaOnprocess)).toEqual([
      ON_PROCESS,
      undefined,
      undefined,
      ON_PROCESS,
    ]);
  });

  test("keeps the other properties of the definition", () => {
    const metadata = { tabs: [{ fields: { pay: { processDefinition: { id: PROCESS_ID, name: "Add Payment" } } } }] };
    applyProcessOverrides(metadata, PROCESS_ID, { etmetaOnprocess: ON_PROCESS });
    expect(metadata.tabs[0].fields.pay.processDefinition).toEqual({
      id: PROCESS_ID,
      name: "Add Payment",
      etmetaOnprocess: ON_PROCESS,
    });
  });

  const unmatched: [string, WindowMetadata][] = [
    ["no tabs", {}],
    ["tabs without fields", { tabs: [{}] }],
    ["other processes only", metadataWith("OTHER")],
  ];
  for (const [name, metadata] of unmatched) {
    test(`changes nothing in metadata with ${name}`, () => {
      expect(applyProcessOverrides(metadata, PROCESS_ID, { etmetaOnprocess: ON_PROCESS })).toBe(0);
    });
  }
});

test.describe("applyFieldOverrides", () => {
  const FIELD_ID = "AD7C15BA367642AFB471EFAFD768FB2D";
  const READ_ONLY = { readOnlyLogicExpression: "true" };

  test("sets the overrides on the field with that id and keeps its other properties", () => {
    const metadata = { tabs: [{ fields: { pay: { id: FIELD_ID, name: "Add Payment" }, other: { id: "OTHER" } } }] };
    expect(applyFieldOverrides(metadata, FIELD_ID, READ_ONLY)).toBe(1);
    expect(metadata.tabs[0].fields).toEqual({
      pay: { id: FIELD_ID, name: "Add Payment", readOnlyLogicExpression: "true" },
      other: { id: "OTHER" },
    });
  });

  const unmatched: [string, WindowMetadata][] = [
    ["no tabs", {}],
    ["tabs without fields", { tabs: [{}] }],
    ["other fields only", { tabs: [{ fields: { other: { id: "OTHER" } } }] }],
  ];
  for (const [name, metadata] of unmatched) {
    test(`changes nothing in metadata with ${name}`, () => {
      expect(applyFieldOverrides(metadata, FIELD_ID, READ_ONLY)).toBe(0);
    });
  }
});

test.describe("applyTabOverrides", () => {
  const TAB_ID = "186";

  test("sets the overrides on the tab with that id and keeps its other properties", () => {
    const metadata = {
      tabs: [
        { id: TAB_ID, name: "Header" },
        { id: "187", name: "Lines" },
      ],
    };

    expect(applyTabOverrides(metadata, TAB_ID, { deletableRecords: false })).toBe(1);
    expect(metadata.tabs).toEqual([
      { id: TAB_ID, name: "Header", deletableRecords: false },
      { id: "187", name: "Lines" },
    ]);
  });

  test.describe("changes nothing", () => {
    const cases: [string, WindowMetadata][] = [
      ["no tabs", {}],
      ["another tab", { tabs: [{ id: "187" }] }],
    ];
    for (const [name, metadata] of cases) {
      test(`in metadata with ${name}`, () => {
        expect(applyTabOverrides(metadata, TAB_ID, { deletableRecords: false })).toBe(0);
      });
    }
  });
});

test.describe("windowMetadataUrl", () => {
  const url = windowMetadataUrl(WINDOW_ID);

  for (const matching of [`/api/erp/meta/window/${WINDOW_ID}`, `/api/erp/meta/window/${WINDOW_ID}?language=en_US`]) {
    test(`matches ${matching}`, () => {
      expect(url.test(`http://localhost:3000${matching}`)).toBe(true);
    });
  }

  for (const other of [`/api/erp/meta/window/${WINDOW_ID}0`, `/api/erp/meta/tab/${WINDOW_ID}`]) {
    test(`does not match ${other}`, () => {
      expect(url.test(`http://localhost:3000${other}`)).toBe(false);
    });
  }
});

test.describe("processMetadataUrl", () => {
  const url = processMetadataUrl(PROCESS_ID);

  test("matches the process metadata request, with or without query", () => {
    expect(url.test(`http://localhost:3000/api/erp/meta/process/${PROCESS_ID}`)).toBe(true);
    expect(url.test(`http://localhost:3000/api/erp/meta/process/${PROCESS_ID}?language=en_US`)).toBe(true);
  });

  test("does not match another process or the window metadata", () => {
    expect(url.test(`http://localhost:3000/api/erp/meta/process/${PROCESS_ID}0`)).toBe(false);
    expect(url.test(`http://localhost:3000/api/erp/meta/window/${PROCESS_ID}`)).toBe(false);
  });
});

test.describe("applyPreferenceOverrides", () => {
  test("adds the values to the preference map and keeps the rest", () => {
    const body = { preferences: { ShowAcct: "Y" } };
    expect(applyPreferenceOverrides(body, { StartPage: "/?tabId=180" })).toBe(true);
    expect(body.preferences).toEqual({ ShowAcct: "Y", StartPage: "/?tabId=180" });
  });

  test("leaves an answer without a preference map as it is", () => {
    const body = {};
    expect(applyPreferenceOverrides(body, { StartPage: "/?tabId=180" })).toBe(false);
    expect(body).toEqual({});
  });
});

test.describe("applySessionRoleOverrides", () => {
  test("changes the role of the session and keeps the rest", () => {
    const body = { currentRole: { id: "R1", userLevel: " CO" } };
    expect(applySessionRoleOverrides(body, { userLevel: "  O" })).toBe(true);
    expect(body.currentRole).toEqual({ id: "R1", userLevel: "  O" });
  });

  test("leaves an answer without a role as it is", () => {
    expect(applySessionRoleOverrides({}, { userLevel: "  O" })).toBe(false);
  });
});

test.describe("session URLs", () => {
  test("match the preferences and session requests only", () => {
    expect(PREFERENCES_URL.test("http://localhost:3000/api/erp/meta/preferences")).toBe(true);
    expect(PREFERENCES_URL.test("http://localhost:3000/api/erp/meta/preferences-other")).toBe(false);
    expect(SESSION_URL.test("http://localhost:3000/api/erp/meta/session?x=1")).toBe(true);
    expect(SESSION_URL.test("http://localhost:3000/api/erp/meta/sessions")).toBe(false);
  });
});
