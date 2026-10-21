import { expect, test } from "@playwright/test";
import { applyProcessOverrides, processMetadataUrl, windowMetadataUrl } from "../processOverrides";

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
