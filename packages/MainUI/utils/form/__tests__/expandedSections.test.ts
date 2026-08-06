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
 * Unit tests for computeInitialExpandedSections, the metadata-driven seeding of
 * the FormView section expansion state.
 *
 * Rules under test:
 * - the main section ("_main", assigned by useFormFields to fields with no
 *   AD_FieldGroup) is always expanded,
 * - fieldGroupCollapsed === false → expanded,
 * - fieldGroupCollapsed === true or undefined → collapsed.
 */

import {
  computeInitialExpandedSections,
  MAIN_SECTION_ID,
  type FormSectionGroupEntry,
} from "@/utils/form/expandedSections";

const makeGroup = (id: string | null, identifier: string, fieldGroupCollapsed?: boolean): FormSectionGroupEntry => [
  id,
  { identifier, fieldGroupCollapsed, fields: {} },
];

describe("computeInitialExpandedSections", () => {
  it("returns an empty array when no groups are provided", () => {
    expect(computeInitialExpandedSections([])).toEqual([]);
  });

  it("excludes a group whose fieldGroupCollapsed is undefined (default collapsed)", () => {
    expect(computeInitialExpandedSections([makeGroup("g1", "Group 1")])).toEqual([]);
  });

  it("includes a group whose fieldGroupCollapsed is false (explicitly expanded)", () => {
    expect(computeInitialExpandedSections([makeGroup("g1", "Group 1", false)])).toEqual(["g1"]);
  });

  it("excludes a group whose fieldGroupCollapsed is true (starts collapsed)", () => {
    expect(computeInitialExpandedSections([makeGroup("g1", "Group 1", true)])).toEqual([]);
  });

  it("includes the main section regardless of fieldGroupCollapsed — undefined", () => {
    expect(computeInitialExpandedSections([makeGroup(MAIN_SECTION_ID, "Main Section")])).toEqual([MAIN_SECTION_ID]);
  });

  it("includes the main section even when fieldGroupCollapsed is true", () => {
    expect(computeInitialExpandedSections([makeGroup(MAIN_SECTION_ID, "Main Section", true)])).toEqual([
      MAIN_SECTION_ID,
    ]);
  });

  it("includes the main section when fieldGroupCollapsed is false", () => {
    expect(computeInitialExpandedSections([makeGroup(MAIN_SECTION_ID, "Main Section", false)])).toEqual([
      MAIN_SECTION_ID,
    ]);
  });

  it("maps a null id to the main section id", () => {
    expect(computeInitialExpandedSections([makeGroup(null, "Main Section", false)])).toEqual([MAIN_SECTION_ID]);
  });

  it("handles a mix of collapsed and expanded groups, returning only expanded ids", () => {
    const groups: FormSectionGroupEntry[] = [
      makeGroup(MAIN_SECTION_ID, "Main"),
      makeGroup("g1", "Expanded", false),
      makeGroup("g2", "Collapsed", true),
      makeGroup("g3", "Default"),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual([MAIN_SECTION_ID, "g1"]);
  });

  it("preserves the original ordering of non-collapsed sections", () => {
    const groups: FormSectionGroupEntry[] = [
      makeGroup("z", "Z Group", false),
      makeGroup("a", "A Group", false),
      makeGroup("m", "M Group", false),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual(["z", "a", "m"]);
  });

  it("returns an empty array when all groups are collapsed", () => {
    const groups: FormSectionGroupEntry[] = [makeGroup("g1", "Sec1", true), makeGroup("g2", "Sec2", true)];
    expect(computeInitialExpandedSections(groups)).toEqual([]);
  });

  it("returns an empty array for the synthetic groups (notes, attachments, linked items)", () => {
    const groups: FormSectionGroupEntry[] = [
      makeGroup("notes_group", "Notes"),
      makeGroup("attachments_group", "Attachments"),
      makeGroup("linked-items", "Linked Items"),
    ];
    expect(computeInitialExpandedSections(groups)).toEqual([]);
  });
});
