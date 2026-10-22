import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { AREA, specTagErrors, TIER } from "../tags";

const E2E_DIR = fileURLToPath(new URL("../..", import.meta.url));
const SPEC_FILE = /\.spec\.ts$/;
/** Top-level describe blocks start at the beginning of a line. */
const TOP_LEVEL_DESCRIBE = /^test\.describe(?:\.\w+)?\(\s*["'`]([^"'`]+)["'`]/gm;
const SMOKE_FLOW = "smoke/01_Sales/SALa.spec.ts";
const FORM_PROBE = "smoke/09_Form/FRMa.spec.ts";
const FORM_TITLE = "Form logic";
const PROCESS_REGRESSION = "regression/08_Process/PRCr.spec.ts";

function specFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return specFiles(path);
    }
    return SPEC_FILE.test(entry.name) ? [path] : [];
  });
}

function describeTitles(file: string): string[] {
  return [...readFileSync(file, "utf8").matchAll(TOP_LEVEL_DESCRIBE)].map((match) => match[1]);
}

test.describe("specTagErrors", () => {
  const valid: { name: string; path: string; titles: string[] }[] = [
    { name: "a smoke flow with its tier", path: SMOKE_FLOW, titles: [`Sales flow ${TIER.SMOKE}`] },
    {
      name: "a feature probe with tier and area",
      path: FORM_PROBE,
      titles: [`${FORM_TITLE} ${TIER.SMOKE} ${AREA.FORM}`],
    },
    { name: "a regression probe", path: PROCESS_REGRESSION, titles: [`Report ${TIER.REGRESSION} ${AREA.PROCESS}`] },
    { name: "a spec outside the tiers", path: "performance/rendering.spec.ts", titles: ["Rendering"] },
  ];

  for (const { name, path, titles } of valid) {
    test(`accepts ${name}`, () => {
      expect(specTagErrors(path, titles)).toEqual([]);
    });
  }

  const invalid: { name: string; path: string; titles: string[]; error: RegExp }[] = [
    { name: "a missing tier", path: SMOKE_FLOW, titles: ["Sales flow"], error: /tier tag, @smoke/ },
    {
      name: "the tier of another folder",
      path: FORM_PROBE,
      titles: [`${FORM_TITLE} ${TIER.REGRESSION} ${AREA.FORM}`],
      error: /tier tag, @smoke/,
    },
    {
      name: "two tiers",
      path: PROCESS_REGRESSION,
      titles: [`Report ${TIER.SMOKE} ${TIER.REGRESSION} ${AREA.PROCESS}`],
      error: /found \[@smoke, @regression\]/,
    },
    { name: "a missing area", path: FORM_PROBE, titles: [`${FORM_TITLE} ${TIER.SMOKE}`], error: /area tag, @form/ },
    {
      name: "the area of another folder",
      path: FORM_PROBE,
      titles: [`${FORM_TITLE} ${TIER.SMOKE} ${AREA.GRID}`],
      error: /area tag, @form; found \[@grid\]/,
    },
    { name: "a spec without describe", path: FORM_PROBE, titles: [], error: /no describe block/ },
  ];

  for (const { name, path, titles, error } of invalid) {
    test(`rejects ${name}`, () => {
      const errors = specTagErrors(path, titles);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatch(error);
    });
  }
});

test.describe("spec tags", () => {
  test("every tiered spec carries the tags of its folder", () => {
    const errors = specFiles(E2E_DIR).flatMap((file) =>
      specTagErrors(relative(E2E_DIR, file).split(sep).join("/"), describeTitles(file))
    );
    expect(errors).toEqual([]);
  });
});
