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

import { act, renderHook } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useRevealFieldErrors } from "@/hooks/useRevealFieldErrors";
import { MAIN_SECTION_ID, SECTION_TRANSITION_MS } from "@/utils/form/expandedSections";
import { FORM_FIELDS_ROOT_ATTRIBUTE, FORM_FIELD_NAME_ATTRIBUTE } from "@/utils/form/focus";

const SECTIONS = {
  MORE_INFO: "more-info-group",
  DIMENSIONS: "dimensions-group",
} as const;

const FIELD_NAMES = {
  DOCUMENT_NO: "documentNo",
  DESCRIPTION: "description",
  PROJECT: "project",
  NOT_RENDERED: "notRendered",
  UNKNOWN: "unknownField",
} as const;

/** Section each rendered field lives in; `null` stands for the main section. */
const FIELD_SECTIONS: Record<string, string | null> = {
  [FIELD_NAMES.DOCUMENT_NO]: null,
  [FIELD_NAMES.DESCRIPTION]: SECTIONS.MORE_INFO,
  [FIELD_NAMES.PROJECT]: SECTIONS.DIMENSIONS,
  [FIELD_NAMES.NOT_RENDERED]: SECTIONS.MORE_INFO,
};

const FIELDS = Object.fromEntries(
  Object.entries(FIELD_SECTIONS).map(([hqlName, fieldGroup]) => [hqlName, { hqlName, fieldGroup } as unknown as Field])
);

const sectionIdOf = (fieldGroup: string | null) => fieldGroup ?? MAIN_SECTION_ID;

/**
 * Mirrors `FormFieldsContent` + `Collapsible`: one block per section whose content
 * is `aria-hidden` while collapsed, holding the wrappers of its fields.
 */
const renderFieldsRoot = (): HTMLElement => {
  const root = document.createElement("div");
  root.setAttribute(FORM_FIELDS_ROOT_ATTRIBUTE, "");
  const sectionIds = [MAIN_SECTION_ID, SECTIONS.MORE_INFO, SECTIONS.DIMENSIONS];
  root.innerHTML = sectionIds
    .map((sectionId) => {
      const fields = Object.entries(FIELD_SECTIONS)
        .filter(([name, group]) => name !== FIELD_NAMES.NOT_RENDERED && sectionIdOf(group) === sectionId)
        .map(([name]) => `<div ${FORM_FIELD_NAME_ATTRIBUTE}="${name}"><input id="${name}-input" /></div>`)
        .join("");
      return `<div data-section-id="${sectionId}" aria-hidden="true">${fields}</div>`;
    })
    .join("");
  document.body.appendChild(root);
  return root;
};

const controlOf = (fieldName: string) => document.getElementById(`${fieldName}-input`) as HTMLElement;

/**
 * Builds a synchronous setter, like the one of useFormSectionsPersistenceTab, that
 * also reflects the expansion on the rendered sections.
 */
const createSectionsState = (root: HTMLElement, initial: string[]) => {
  const state = { expanded: initial };
  const applyToDom = () => {
    for (const section of Array.from(root.querySelectorAll<HTMLElement>("[data-section-id]"))) {
      const isExpanded = state.expanded.includes(section.getAttribute("data-section-id") ?? "");
      section.setAttribute("aria-hidden", String(!isExpanded));
    }
  };
  const setExpandedSections = jest.fn((updater: string[] | ((prev: string[]) => string[])) => {
    state.expanded = typeof updater === "function" ? updater(state.expanded) : updater;
    applyToDom();
  });
  applyToDom();
  return { state, setExpandedSections };
};

const setup = (initialExpanded: string[] = [MAIN_SECTION_ID]) => {
  const root = renderFieldsRoot();
  const sections = createSectionsState(root, initialExpanded);
  const fieldsRootRef = { current: root };
  const hook = renderHook(() =>
    useRevealFieldErrors({ fieldsRootRef, fields: FIELDS, setExpandedSections: sections.setExpandedSections })
  );
  return { ...sections, hook, reveal: hook.result.current };
};

const advance = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

describe("useRevealFieldErrors", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("expands the collapsed section of a missing field and focuses it once the animation ends", () => {
    const { state, reveal } = setup();

    reveal([FIELD_NAMES.DESCRIPTION]);

    expect(state.expanded).toEqual([MAIN_SECTION_ID, SECTIONS.MORE_INFO]);
    advance(SECTION_TRANSITION_MS - 1);
    expect(document.activeElement).not.toBe(controlOf(FIELD_NAMES.DESCRIPTION));
    advance(1);
    expect(document.activeElement).toBe(controlOf(FIELD_NAMES.DESCRIPTION));
    expect(controlOf(FIELD_NAMES.DESCRIPTION).scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
  });

  it("expands every involved section and focuses the first missing field in form order", () => {
    const { state, reveal } = setup([]);

    reveal([FIELD_NAMES.PROJECT, FIELD_NAMES.DESCRIPTION]);

    expect(state.expanded).toEqual([SECTIONS.DIMENSIONS, SECTIONS.MORE_INFO]);
    advance(SECTION_TRANSITION_MS);
    expect(document.activeElement).toBe(controlOf(FIELD_NAMES.DESCRIPTION));
  });

  it("keeps the sections untouched and focuses right away when they are already expanded", () => {
    const initial = [MAIN_SECTION_ID, SECTIONS.MORE_INFO];
    const { state, reveal } = setup(initial);

    reveal([FIELD_NAMES.DESCRIPTION]);

    expect(state.expanded).toBe(initial);
    advance(0);
    expect(document.activeElement).toBe(controlOf(FIELD_NAMES.DESCRIPTION));
  });

  it("does nothing when no field is reported", () => {
    const { setExpandedSections, reveal } = setup();

    reveal([]);
    advance(SECTION_TRANSITION_MS);

    expect(setExpandedSections).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it("ignores fields that are unknown or not rendered", () => {
    const { state, reveal } = setup();

    reveal([FIELD_NAMES.UNKNOWN, FIELD_NAMES.NOT_RENDERED]);
    advance(SECTION_TRANSITION_MS);

    expect(state.expanded).toEqual([MAIN_SECTION_ID, SECTIONS.MORE_INFO]);
    expect(document.activeElement).toBe(document.body);
  });

  it("only applies the focus of the latest call", () => {
    const { reveal } = setup([MAIN_SECTION_ID, SECTIONS.MORE_INFO]);

    reveal([FIELD_NAMES.PROJECT]);
    reveal([FIELD_NAMES.DOCUMENT_NO]);
    advance(SECTION_TRANSITION_MS);

    expect(document.activeElement).toBe(controlOf(FIELD_NAMES.DOCUMENT_NO));
  });

  it("drops the pending focus on unmount", () => {
    const { hook, reveal } = setup();

    reveal([FIELD_NAMES.DESCRIPTION]);
    hook.unmount();
    advance(SECTION_TRANSITION_MS);

    expect(document.activeElement).toBe(document.body);
  });

  it("tolerates a tab without field metadata", () => {
    const setExpandedSections = jest.fn();
    const { result } = renderHook(() =>
      useRevealFieldErrors({ fieldsRootRef: { current: null }, fields: undefined, setExpandedSections })
    );

    result.current([FIELD_NAMES.DESCRIPTION]);
    advance(0);

    expect(setExpandedSections).toHaveBeenCalledTimes(1);
  });
});
