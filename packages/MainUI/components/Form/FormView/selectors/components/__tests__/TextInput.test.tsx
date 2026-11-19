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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { render, screen } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "../TextInput";
import { CLEAR_ICON_VISIBILITY_CLASSES, FIELD_BOX_GROUP_CLASS } from "@/utils/form/focus";

const FIELD = { id: "f1", name: "Description", isMandatory: false } as unknown as Field;

const renderInput = (showClearButton: boolean) =>
  render(<TextInput field={FIELD} value="A long description" showClearButton={showClearButton} onChange={jest.fn()} />);

describe("TextInput", () => {
  it("leaves room for the clear icon and cuts a long value with an ellipsis", () => {
    renderInput(true);

    expect(screen.getByLabelText(FIELD.name)).toHaveClass("pr-11", "text-ellipsis");
  });

  it("keeps the narrow padding without a trailing icon", () => {
    renderInput(false);

    expect(screen.getByLabelText(FIELD.name)).toHaveClass("pr-3");
  });

  it("uses the theme focus tokens, so a focused field stays readable in dark mode", () => {
    renderInput(true);

    expect(screen.getByLabelText(FIELD.name)).toHaveClass(
      "focus:bg-(--ui-field-focus-bg)",
      "focus:text-(--ui-field-focus-fg)",
      "focus:border-(--ui-field-focus-border)"
    );
  });

  it("shows the clear icon only on hover or focus", () => {
    renderInput(true);

    expect(screen.getByRole("button")).toHaveClass(...CLEAR_ICON_VISIBILITY_CLASSES.split(" "));
    expect(screen.getByLabelText(FIELD.name).parentElement).toHaveClass(FIELD_BOX_GROUP_CLASS);
  });
});
