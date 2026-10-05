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

import {
  FIELD_NAVIGATION_OFFSETS,
  FORM_FIELDS_ROOT_ATTRIBUTE,
  FORM_FIELD_NAME_ATTRIBUTE,
  findAdjacentFocusableField,
  findFieldFocusTarget,
  findFieldsRoot,
  findFirstFocusableField,
  findFocusableFieldControls,
  findFocusableFields,
  focusOwningField,
  isFocusableFormControl,
  resolveInitialFocusTarget,
} from "@/utils/form/focus";

const FIELD_NAMES = {
  DOCUMENT_NO: "documentNo",
  BUSINESS_PARTNER: "businessPartner",
  DESCRIPTION: "description",
  MISSING: "notInTheForm",
} as const;

/** Markup of one field: its wrapper, an auxiliary button and the editable control. */
const fieldMarkup = (name: string, control: string) => `
  <div ${FORM_FIELD_NAME_ATTRIBUTE}="${name}">
    <label>${name}</label>
    <button type="button" tabindex="-1">clear</button>
    ${control}
  </div>
`;

const textField = (name: string) => fieldMarkup(name, `<input id="${name}-input" />`);
/** A combo registers its value through a hidden input and is driven by a div. */
const registeredComboField = (name: string) =>
  fieldMarkup(name, `<input type="hidden" name="${name}" /><div id="${name}-input" tabindex="0"></div>`);
const readOnlyField = (name: string) => fieldMarkup(name, `<input id="${name}-input" disabled />`);
const comboField = (name: string) => fieldMarkup(name, `<div id="${name}-input" tabindex="0"></div>`);

/**
 * Header a `Collapsible` renders above the fields of a section, decorative icons
 * included — they are buttons, so they would otherwise count as tab stops.
 */
const sectionHeader = () => `
  <div aria-expanded="true">
    <button type="button">section icon</button>
    <span>Main Section</span>
    <button type="button">chevron</button>
  </div>
`;

/** Buttons of the Notes / Attachments sections, which live in the same root. */
const auxiliarySection = () => `
  <div aria-expanded="true">
    <button type="button">Add note</button>
  </div>
`;

/** Builds a detached form-fields root holding the given field markup. */
const renderFieldsRoot = (...fields: string[]): HTMLElement => {
  const root = document.createElement("div");
  root.setAttribute(FORM_FIELDS_ROOT_ATTRIBUTE, "");
  root.innerHTML = fields.join("");
  document.body.appendChild(root);
  return root;
};

const controlOf = (fieldName: string) => document.getElementById(`${fieldName}-input`);

describe("form focus utils", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("isFocusableFormControl", () => {
    it("rejects a disabled control", () => {
      renderFieldsRoot(readOnlyField(FIELD_NAMES.DOCUMENT_NO));

      expect(isFocusableFormControl(controlOf(FIELD_NAMES.DOCUMENT_NO) as HTMLElement)).toBe(false);
    });

    it("rejects a control explicitly taken out of the tab sequence", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO));
      const clearButton = root.querySelector("button") as HTMLElement;

      expect(isFocusableFormControl(clearButton)).toBe(false);
    });

    it("rejects a control inside a hidden subtree, such as a collapsed section", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO));
      root.setAttribute("aria-hidden", "true");

      expect(isFocusableFormControl(controlOf(FIELD_NAMES.DOCUMENT_NO) as HTMLElement)).toBe(false);
    });

    it("accepts an editable control", () => {
      renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO));

      expect(isFocusableFormControl(controlOf(FIELD_NAMES.DOCUMENT_NO) as HTMLElement)).toBe(true);
    });
  });

  describe("findFocusableFields", () => {
    it("returns the editable controls in DOM order, skipping auxiliary buttons", () => {
      const root = renderFieldsRoot(
        textField(FIELD_NAMES.DOCUMENT_NO),
        comboField(FIELD_NAMES.BUSINESS_PARTNER),
        textField(FIELD_NAMES.DESCRIPTION)
      );

      expect(findFocusableFields(root)).toEqual([
        controlOf(FIELD_NAMES.DOCUMENT_NO),
        controlOf(FIELD_NAMES.BUSINESS_PARTNER),
        controlOf(FIELD_NAMES.DESCRIPTION),
      ]);
    });

    it("ignores the hidden input a combo registers its value with", () => {
      const root = renderFieldsRoot(
        textField(FIELD_NAMES.DOCUMENT_NO),
        registeredComboField(FIELD_NAMES.BUSINESS_PARTNER)
      );

      expect(findFocusableFields(root)).toEqual([
        controlOf(FIELD_NAMES.DOCUMENT_NO),
        controlOf(FIELD_NAMES.BUSINESS_PARTNER),
      ]);
    });

    it("returns nothing without a root", () => {
      expect(findFocusableFields(null)).toEqual([]);
    });
  });

  describe("findFirstFocusableField", () => {
    it("skips read-only fields", () => {
      const root = renderFieldsRoot(readOnlyField(FIELD_NAMES.DOCUMENT_NO), textField(FIELD_NAMES.BUSINESS_PARTNER));

      expect(findFirstFocusableField(root)).toBe(controlOf(FIELD_NAMES.BUSINESS_PARTNER));
    });

    it("returns null when every field is read-only", () => {
      const root = renderFieldsRoot(readOnlyField(FIELD_NAMES.DOCUMENT_NO));

      expect(findFirstFocusableField(root)).toBeNull();
    });
  });

  describe("findFieldFocusTarget", () => {
    it("resolves the control of the named field", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO), comboField(FIELD_NAMES.BUSINESS_PARTNER));

      expect(findFieldFocusTarget(root, FIELD_NAMES.BUSINESS_PARTNER)).toBe(controlOf(FIELD_NAMES.BUSINESS_PARTNER));
    });

    it("returns null for a field that is not rendered", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO));

      expect(findFieldFocusTarget(root, FIELD_NAMES.MISSING)).toBeNull();
    });

    it("returns null for a field with no focusable control", () => {
      const root = renderFieldsRoot(readOnlyField(FIELD_NAMES.DOCUMENT_NO));

      expect(findFieldFocusTarget(root, FIELD_NAMES.DOCUMENT_NO)).toBeNull();
    });
  });

  describe("findFocusableFieldControls", () => {
    it("leaves out the form chrome, keeping only controls that belong to a field", () => {
      const root = renderFieldsRoot(
        sectionHeader(),
        textField(FIELD_NAMES.DOCUMENT_NO),
        comboField(FIELD_NAMES.BUSINESS_PARTNER),
        auxiliarySection()
      );

      expect(findFocusableFieldControls(root)).toEqual([
        controlOf(FIELD_NAMES.DOCUMENT_NO),
        controlOf(FIELD_NAMES.BUSINESS_PARTNER),
      ]);
    });
  });

  describe("resolveInitialFocusTarget", () => {
    // The decorative buttons of a section header precede every field in the DOM.
    it("never lands on a section header", () => {
      const root = renderFieldsRoot(sectionHeader(), textField(FIELD_NAMES.DOCUMENT_NO));

      expect(resolveInitialFocusTarget(root)).toBe(controlOf(FIELD_NAMES.DOCUMENT_NO));
    });

    it("never lands on the Notes or Attachments buttons of a read-only form", () => {
      const root = renderFieldsRoot(readOnlyField(FIELD_NAMES.DOCUMENT_NO), auxiliarySection());

      expect(resolveInitialFocusTarget(root)).toBeNull();
    });

    it("honours the field flagged in the application dictionary", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO), textField(FIELD_NAMES.BUSINESS_PARTNER));

      expect(resolveInitialFocusTarget(root, FIELD_NAMES.BUSINESS_PARTNER)).toBe(
        controlOf(FIELD_NAMES.BUSINESS_PARTNER)
      );
    });

    it("falls back to the first field when the flagged one cannot take the focus", () => {
      const root = renderFieldsRoot(readOnlyField(FIELD_NAMES.DOCUMENT_NO), textField(FIELD_NAMES.BUSINESS_PARTNER));

      expect(resolveInitialFocusTarget(root, FIELD_NAMES.DOCUMENT_NO)).toBe(controlOf(FIELD_NAMES.BUSINESS_PARTNER));
    });

    it("falls back to the first field when no field is flagged", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO), textField(FIELD_NAMES.BUSINESS_PARTNER));

      expect(resolveInitialFocusTarget(root)).toBe(controlOf(FIELD_NAMES.DOCUMENT_NO));
    });
  });

  describe("focusOwningField", () => {
    it("returns the keyboard to the control of the field the button belongs to", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO), textField(FIELD_NAMES.BUSINESS_PARTNER));
      const clearButton = root.querySelectorAll("button")[1] as HTMLElement;

      focusOwningField(clearButton);

      expect(document.activeElement).toBe(controlOf(FIELD_NAMES.BUSINESS_PARTNER));
    });

    it("does nothing without a button", () => {
      expect(() => focusOwningField(null)).not.toThrow();
    });
  });

  describe("findFieldsRoot", () => {
    it("climbs from a control up to the form-fields root", () => {
      const root = renderFieldsRoot(textField(FIELD_NAMES.DOCUMENT_NO));

      expect(findFieldsRoot(controlOf(FIELD_NAMES.DOCUMENT_NO))).toBe(root);
    });

    it("returns null for an element rendered outside a form", () => {
      const orphan = document.createElement("input");
      document.body.appendChild(orphan);

      expect(findFieldsRoot(orphan)).toBeNull();
    });
  });

  describe("findAdjacentFocusableField", () => {
    const renderThreeFields = () =>
      renderFieldsRoot(
        textField(FIELD_NAMES.DOCUMENT_NO),
        comboField(FIELD_NAMES.BUSINESS_PARTNER),
        textField(FIELD_NAMES.DESCRIPTION)
      );

    it("moves to the next field", () => {
      renderThreeFields();

      const next = findAdjacentFocusableField(controlOf(FIELD_NAMES.BUSINESS_PARTNER), FIELD_NAVIGATION_OFFSETS.NEXT);

      expect(next).toBe(controlOf(FIELD_NAMES.DESCRIPTION));
    });

    it("moves to the previous field", () => {
      renderThreeFields();

      const previous = findAdjacentFocusableField(
        controlOf(FIELD_NAMES.BUSINESS_PARTNER),
        FIELD_NAVIGATION_OFFSETS.PREVIOUS
      );

      expect(previous).toBe(controlOf(FIELD_NAMES.DOCUMENT_NO));
    });

    it("returns null past the last field", () => {
      renderThreeFields();

      expect(findAdjacentFocusableField(controlOf(FIELD_NAMES.DESCRIPTION), FIELD_NAVIGATION_OFFSETS.NEXT)).toBeNull();
    });

    it("returns null before the first field", () => {
      renderThreeFields();

      expect(
        findAdjacentFocusableField(controlOf(FIELD_NAMES.DOCUMENT_NO), FIELD_NAVIGATION_OFFSETS.PREVIOUS)
      ).toBeNull();
    });

    it("returns null for an element rendered outside a form", () => {
      const orphan = document.createElement("input");
      document.body.appendChild(orphan);

      expect(findAdjacentFocusableField(orphan, FIELD_NAVIGATION_OFFSETS.NEXT)).toBeNull();
    });
  });
});
