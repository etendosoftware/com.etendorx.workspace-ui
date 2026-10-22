/**
 * Spec tags. They go literally in the `describe` title, so `--grep` selects them:
 *
 *   test.describe("Funds Transfer - parameters @smoke @process", () => { … });
 *
 * Every spec under `smoke/` or `regression/` has exactly one tier tag: `@smoke` runs on every
 * PR, `@regression` on pushes to develop/main. Feature probes (the area folders below and
 * `regression/`) also have exactly one area tag, the one of their folder, so a run can pick the
 * probes of the areas a change touches. `support/__tests__/tags.spec.ts` enforces both rules.
 */

/** Tier tags: when a spec runs. */
export const TIER = {
  SMOKE: "@smoke",
  REGRESSION: "@regression",
} as const;

/** Area tags: which part of the UI a feature probe covers. */
export const AREA = {
  PROCESS: "@process",
  FORM: "@form",
  GRID: "@grid",
  NAV: "@nav",
  SESSION: "@session",
} as const;

export type TierTag = (typeof TIER)[keyof typeof TIER];
export type AreaTag = (typeof AREA)[keyof typeof AREA];

/** Folder of each tier under `e2e/`. */
export const TIER_FOLDERS: Record<string, TierTag> = {
  smoke: TIER.SMOKE,
  regression: TIER.REGRESSION,
};

/** Area folder (under `smoke/` or `regression/`) of the feature probes, and its area tag. */
export const AREA_FOLDERS: Record<string, AreaTag> = {
  "08_Process": AREA.PROCESS,
  "09_Form": AREA.FORM,
  "10_Grid": AREA.GRID,
  "11_Navigation": AREA.NAV,
  "12_Session": AREA.SESSION,
};

const ALL_TIERS: readonly string[] = Object.values(TIER);
const ALL_AREAS: readonly string[] = Object.values(AREA);
const TAG = /@[a-z]+/g;

function tagsIn(title: string, known: readonly string[]): string[] {
  return (title.match(TAG) ?? []).filter((tag) => known.includes(tag));
}

function expectOne(title: string, known: readonly string[], expected: string, kind: string): string | undefined {
  const found = tagsIn(title, known);
  if (found.length === 1 && found[0] === expected) {
    return undefined;
  }
  return `"${title}" must have exactly one ${kind} tag, ${expected}; found [${found.join(", ")}]`;
}

/**
 * Checks the tags of the top-level `describe` titles of a spec against its folder.
 * @param specPath - path relative to `e2e/`, with `/` separators (e.g. `smoke/09_Form/FRMa.spec.ts`).
 * @param titles - its top-level `describe` titles.
 * @returns one message per violation; empty when the spec is correctly tagged or not a tiered spec.
 */
export function specTagErrors(specPath: string, titles: readonly string[]): string[] {
  const [tierFolder, areaFolder] = specPath.split("/");
  const tier = TIER_FOLDERS[tierFolder];
  if (!tier) {
    return [];
  }
  if (titles.length === 0) {
    return [`${specPath} has no describe block to carry its tags`];
  }
  const area = AREA_FOLDERS[areaFolder];
  return titles
    .flatMap((title) => [
      expectOne(title, ALL_TIERS, tier, "tier"),
      area ? expectOne(title, ALL_AREAS, area, "area") : undefined,
    ])
    .filter((error): error is string => error !== undefined);
}
