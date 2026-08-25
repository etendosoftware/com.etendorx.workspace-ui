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
 * Keyboard navigation primitives for the form view.
 *
 * Etendo Classic treats a form field as a single tab stop: auxiliary controls
 * (clear, calendar, search picker) are never reachable with Tab, and read-only
 * fields render as disabled items, so they are skipped too. These helpers are the
 * single place that knows what "a focusable field" means, so every selector and
 * every consumer (initial focus, split-pane focus, dropdown Tab handling) agrees.
 */

/** Marks the container holding the form sections — the root of the tab sequence. */
export const FORM_FIELDS_ROOT_ATTRIBUTE = "data-form-fields-root";

/** Marks a field wrapper with its `hqlName`, so a field can be located by name. */
export const FORM_FIELD_NAME_ATTRIBUTE = "data-form-field-name";

/**
 * `tabIndex` for controls that must stay out of the tab sequence: the clear "X",
 * the calendar/clock icons, the search picker and the process launcher.
 */
export const NOT_TABBABLE = -1;

/** `tabIndex` for a custom control that must take part in the tab sequence. */
export const TABBABLE = 0;

/**
 * Elements a browser can put the keyboard focus on. `[tabindex="-1"]` is excluded
 * here rather than in the filter below because `Collapsible` uses this same
 * selector to neutralise the fields of a collapsed section.
 *
 * Hidden inputs are excluded too: several selectors register their value through
 * one, and it would otherwise count as a tab stop that can never be focused.
 */
export const FOCUSABLE_SELECTOR =
  'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Offsets accepted by {@link findAdjacentFocusableField}. */
export const FIELD_NAVIGATION_OFFSETS = {
  NEXT: 1,
  PREVIOUS: -1,
} as const;

export type FieldNavigationOffset = (typeof FIELD_NAVIGATION_OFFSETS)[keyof typeof FIELD_NAVIGATION_OFFSETS];

const HIDDEN_SUBTREE_SELECTOR = '[aria-hidden="true"]';

/**
 * Whether an element inside the form is an actual tab stop.
 *
 * Visibility is decided through `aria-hidden` (which `Collapsible` sets on the
 * content of a collapsed section) instead of layout, because layout metrics are
 * not computed in jsdom and would make this untestable.
 */
export const isFocusableFormControl = (element: HTMLElement): boolean => {
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("tabindex") === String(NOT_TABBABLE)) return false;
  if (element.closest(HIDDEN_SUBTREE_SELECTOR)) return false;
  return true;
};

/** Every tab stop under `root`, in DOM order — which is the tab order. */
export const findFocusableFields = (root: HTMLElement | null | undefined): HTMLElement[] => {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isFocusableFormControl);
};

export const findFirstFocusableField = (root: HTMLElement | null | undefined): HTMLElement | null => {
  return findFocusableFields(root)[0] ?? null;
};

/**
 * Tab stops that belong to an actual field, leaving out the chrome of the form —
 * section headers, and the buttons of the Notes / Attachments / Linked Items
 * sections. Mirrors the `!isc.isA.SectionItem(item)` check that Classic's
 * `computeFocusItem` applies when choosing where to put the focus.
 */
export const findFocusableFieldControls = (root: HTMLElement | null | undefined): HTMLElement[] => {
  return findFocusableFields(root).filter((element) => element.closest(`[${FORM_FIELD_NAME_ATTRIBUTE}]`));
};

export const findFirstFocusableFieldControl = (root: HTMLElement | null | undefined): HTMLElement | null => {
  return findFocusableFieldControls(root)[0] ?? null;
};

/**
 * The control that receives the focus for a given field, or null when that field
 * is absent, read-only or hidden.
 */
export const findFieldFocusTarget = (root: HTMLElement | null | undefined, fieldName: string): HTMLElement | null => {
  if (!root || !fieldName) return null;
  // Matched by attribute value rather than by selector: `CSS.escape` is not
  // available in jsdom, and a field name comes from the dictionary unescaped.
  const wrapper = Array.from(root.querySelectorAll<HTMLElement>(`[${FORM_FIELD_NAME_ATTRIBUTE}]`)).find(
    (element) => element.getAttribute(FORM_FIELD_NAME_ATTRIBUTE) === fieldName
  );
  return findFirstFocusableField(wrapper);
};

/**
 * Field that takes the focus when the form opens, mirroring
 * `OBViewForm.computeFocusItem`: the field flagged as `isFirstFocusedField` in the
 * application dictionary, falling back to the first focusable field in tab order.
 * Section headers and the auxiliary sections are never candidates.
 */
export const resolveInitialFocusTarget = (
  root: HTMLElement | null | undefined,
  firstFocusedFieldName?: string
): HTMLElement | null => {
  if (firstFocusedFieldName) {
    const flaggedTarget = findFieldFocusTarget(root, firstFocusedFieldName);
    if (flaggedTarget) return flaggedTarget;
  }
  return findFirstFocusableFieldControl(root);
};

/**
 * Returns the keyboard to the editable control of the field an auxiliary button
 * belongs to. Those buttons often disappear once used (the clear "X" goes away
 * with the value), which would otherwise drop the focus on the document body and
 * restart the tab sequence from the top of the page.
 */
export const focusOwningField = (auxiliaryControl: HTMLElement | null | undefined): void => {
  if (!auxiliaryControl) return;
  const wrapper =
    auxiliaryControl.closest<HTMLElement>(`[${FORM_FIELD_NAME_ATTRIBUTE}]`) ?? auxiliaryControl.parentElement;
  findFirstFocusableField(wrapper)?.focus({ preventScroll: true });
};

/** The form-fields root that owns `element`, or null when it lives outside a form. */
export const findFieldsRoot = (element: HTMLElement | null | undefined): HTMLElement | null => {
  return element?.closest<HTMLElement>(`[${FORM_FIELDS_ROOT_ATTRIBUTE}]`) ?? null;
};

/**
 * Neighbour of `element` in the tab sequence of its form, or null when there is
 * none (no enclosing form, or `element` is at the edge). Used to keep Tab inside
 * the form when the focus sits in a dropdown rendered through a portal.
 */
export const findAdjacentFocusableField = (
  element: HTMLElement | null | undefined,
  offset: FieldNavigationOffset
): HTMLElement | null => {
  const root = findFieldsRoot(element);
  if (!root || !element) return null;

  const fields = findFocusableFields(root);
  const currentIndex = fields.indexOf(element);
  if (currentIndex === -1) return null;

  return fields[currentIndex + offset] ?? null;
};
