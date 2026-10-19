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

import { fireEvent, render } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "../TextInput";
import { TextAreaInput } from "../TextAreaInput";
import { findFocusableFields } from "@/utils/form/focus";

const FIELD_VALUE = "PO/0001";

const buildField = (): Field =>
  ({
    id: "field-1",
    hqlName: "documentNo",
    name: "Document No.",
    isMandatory: false,
  }) as unknown as Field;

/**
 * Both text editors share the same contract: the editable control is the single
 * tab stop of the field, and the clear button is only reachable with the mouse.
 */
const EDITORS = [
  {
    name: "TextInput",
    controlSelector: "input",
    render: (readOnly: boolean) =>
      render(<TextInput field={buildField()} value={FIELD_VALUE} readOnly={readOnly} onChange={jest.fn()} />),
  },
  {
    name: "TextAreaInput",
    controlSelector: "textarea",
    render: (readOnly: boolean) =>
      render(<TextAreaInput field={buildField()} value={FIELD_VALUE} readOnly={readOnly} onChange={jest.fn()} />),
  },
] as const;

describe.each(EDITORS)("$name tab sequence", ({ controlSelector, render: renderEditor }) => {
  it("keeps the clear button out of the tab sequence", () => {
    const { container } = renderEditor(false);
    const clearButton = container.querySelector("button") as HTMLButtonElement;

    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveAttribute("tabindex", "-1");
  });

  it("leaves the editable control as the only tab stop of the field", () => {
    const { container } = renderEditor(false);

    expect(findFocusableFields(container)).toEqual([container.querySelector(controlSelector)]);
  });

  it("has no tab stop at all when the field is read-only", () => {
    const { container } = renderEditor(true);

    expect(findFocusableFields(container)).toEqual([]);
  });

  // The clear button disappears with the value, so without this the focus would
  // land on the document body and Tab would restart from the top of the page.
  it("returns the focus to the field after clearing it", () => {
    const { container } = renderEditor(false);
    const clearButton = container.querySelector("button") as HTMLButtonElement;

    fireEvent.click(clearButton);

    expect(document.activeElement).toBe(container.querySelector(controlSelector));
  });
});
