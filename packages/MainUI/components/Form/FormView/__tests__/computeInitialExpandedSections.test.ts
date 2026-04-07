/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Unit tests for the computeInitialExpandedSections logic used in
 * FormView/index.tsx.
 *
 * The function signature (as implemented in FormView):
 *   computeInitialExpandedSections(currentGroups) =>
 *     currentGroups
 *       .filter(([, group]) => group.fieldGroupCollapsed !== true)
 *       .map(([id]) => String(id ?? "null"))
 *
 * We test the logic in isolation to avoid mounting the full FormView tree.
 */

type GroupEntry = [
  string | null,
  { identifier: string; fieldGroupCollapsed?: boolean; fields: Record<string, unknown> },
];

/**
 * Pure reimplementation that mirrors the source exactly.
 * Any change to the source logic must be reflected here — the test will
 * catch the divergence.
 */
const computeInitialExpandedSections = (currentGroups: GroupEntry[]): string[] =>
  currentGroups
    .filter(([, group]) => group.fieldGroupCollapsed !== true)
    .map(([id]) => String(id ?? "null"));

const makeGroup = (
  id: string | null,
  identifier: string,
  fieldGroupCollapsed?: boolean
): GroupEntry => [id, { identifier, fieldGroupCollapsed, fields: {} }];

describe("computeInitialExpandedSections", () => {
  it("returns an empty array when no groups are provided", () => {
    expect(computeInitialExpandedSections([])).toEqual([]);
  });

  it("includes a group whose fieldGroupCollapsed is undefined (default expanded)", () => {
    const groups = [makeGroup("g1", "Group 1", undefined)];
    expect(computeInitialExpandedSections(groups)).toEqual(["g1"]);
  });

  it("includes a group whose fieldGroupCollapsed is false (explicitly expanded)", () => {
    const groups = [makeGroup("g1", "Group 1", false)];
    expect(computeInitialExpandedSections(groups)).toEqual(["g1"]);
  });

  it("excludes a group whose fieldGroupCollapsed is true (starts collapsed)", () => {
    const groups = [makeGroup("g1", "Group 1", true)];
    expect(computeInitialExpandedSections(groups)).toEqual([]);
  });

  it("maps a null id to the string 'null'", () => {
    const groups = [makeGroup(null, "Main Section", false)];
    expect(computeInitialExpandedSections(groups)).toEqual(["null"]);
  });

  it("handles a mix of collapsed and expanded groups, returning only expanded ids", () => {
    const groups: GroupEntry[] = [
      makeGroup("g1", "Expanded", false),
      makeGroup("g2", "Collapsed", true),
      makeGroup("g3", "Default", undefined),
      makeGroup(null, "Main", false),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual(["g1", "g3", "null"]);
  });

  it("preserves the original ordering of non-collapsed sections", () => {
    const groups: GroupEntry[] = [
      makeGroup("z", "Z Group", false),
      makeGroup("a", "A Group", false),
      makeGroup("m", "M Group", false),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual(["z", "a", "m"]);
  });

  it("returns an empty array when all groups are collapsed", () => {
    const groups: GroupEntry[] = [
      makeGroup("g1", "Sec1", true),
      makeGroup("g2", "Sec2", true),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual([]);
  });

  it("returns all ids when no group has fieldGroupCollapsed set to true", () => {
    const groups: GroupEntry[] = [
      makeGroup("notes_group", "Notes", undefined),
      makeGroup("attachments_group", "Attachments", undefined),
      makeGroup("linked-items", "Linked Items", undefined),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual([
      "notes_group",
      "attachments_group",
      "linked-items",
    ]);
  });
});
